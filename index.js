const { default: makeWASocket, DisconnectReason } = require('@whiskeysockets/baileys');
const { usePostgresAuthState } = require('./postgres-auth');
const pino = require('pino');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const PORT = process.env.PORT || 3001;
// URL Webhook Next.js — gunakan URL Vercel production agar magic link selalu benar
const NEXTJS_WEBHOOK_URL = 'https://arumseduh.vercel.app/api/webhooks/whatsapp';

let sock;
let latestQr = null;
let isConnected = false;

async function connectToWhatsApp() {
    const { state, saveCreds } = await usePostgresAuthState();

    sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }), // Ganti ke 'info' jika ingin melihat log detail
        printQRInTerminal: true,
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            latestQr = qr;
            isConnected = false;
            console.log('\n[!] SCAN QR CODE DI BROWSER: Buka https://[URL-RENDER-ANDA]/qr');
            console.log('[!] QR Code juga tersedia via endpoint /qr');
            
            // Simpan QR ke file gambar (backup lokal)
            try {
                await QRCode.toFile(path.join(__dirname, 'qr.png'), qr);
            } catch (err) {
                console.error('Gagal menyimpan QR ke file:', err);
            }
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus. Alasan:', lastDisconnect.error?.message);
            console.log('Mencoba menyambung kembali:', shouldReconnect);
            
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('\n✅ [BOT] Berhasil terhubung ke WhatsApp!');
            console.log(`[BOT] Terhubung sebagai: ${sock.user?.id || 'Unknown'} (${sock.user?.name || 'No Name'})\n`);
            isConnected = true;
            latestQr = null; // Hapus QR setelah terhubung
            
            // Hapus file qr.png jika ada setelah berhasil terhubung
            const qrPath = path.join(__dirname, 'qr.png');
            if (fs.existsSync(qrPath)) {
                try { fs.unlinkSync(qrPath); } catch {}
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Menerima pesan masuk
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        console.log('[DEBUG_RAW_MSG]', JSON.stringify(msg, null, 2));
        
        // Abaikan pesan dari diri sendiri
        if (!msg.message || msg.key.fromMe) return;

        // Ambil isi teks pesan
        const messageType = Object.keys(msg.message)[0];
        let text = '';
        if (messageType === 'conversation') {
            text = msg.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            text = msg.message.extendedTextMessage.text;
        }

        if (!text) return;

        // Cari JID telepon asli (s.whatsapp.net) sebagai prioritas
        let realPhoneJid = null;
        if (msg.key.remoteJid && msg.key.remoteJid.endsWith('@s.whatsapp.net')) {
            realPhoneJid = msg.key.remoteJid;
        } else if (msg.key.remoteJidAlt && msg.key.remoteJidAlt.endsWith('@s.whatsapp.net')) {
            realPhoneJid = msg.key.remoteJidAlt;
        } else if (msg.key.participantAlt && msg.key.participantAlt.endsWith('@s.whatsapp.net')) {
            realPhoneJid = msg.key.participantAlt;
        } else if (msg.key.participant && msg.key.participant.endsWith('@s.whatsapp.net')) {
            realPhoneJid = msg.key.participant;
        }

        const remoteJid = msg.key.remoteJid;
        const senderJid = realPhoneJid || remoteJid;
        const senderNumber = senderJid.split('@')[0];

        const lowerText = text.toLowerCase();
        const isLoginRequest = lowerText.startsWith('login-') || 
                               lowerText.includes('request link untuk masuk / daftar');
        const isDeleteRequest = lowerText.startsWith('hapus-');

        console.log(`[DEBUG] Pesan masuk dari ${remoteJid} (Telepon: ${senderNumber}, JID Kirim: ${senderJid}): "${text}" (isLogin: ${isLoginRequest}, isDelete: ${isDeleteRequest})`);

        if (isLoginRequest || isDeleteRequest) {
            // Tentukan URL Webhook secara dinamis berdasarkan domain asal pada pesan jika ada
            let webhookUrl = NEXTJS_WEBHOOK_URL;
            const domainMatch = text.match(/Domain:\s*(https?:\/\/[^\s\.]+[\S]*)/i);
            
            if (domainMatch) {
                let domain = domainMatch[1].trim();
                // Hapus titik di akhir jika ada
                if (domain.endsWith('.')) {
                    domain = domain.substring(0, domain.length - 1);
                }
                webhookUrl = `${domain}/api/webhooks/whatsapp`;
                console.log(`[BOT] Mendeteksi domain dinamis dari pesan. Menggunakan webhook: ${webhookUrl}`);
            }

            try {
                // Panggil Webhook Next.js
                const response = await axios.post(webhookUrl, {
                    phone: senderNumber,
                    text: text,
                    jid: senderJid,
                    directReply: true
                });
                console.log('[-] Berhasil meneruskan ke Next.js Webhook');

                // Jika webhook mengembalikan pesan balasan langsung, kirimkan langsung lewat koneksi bot ini
                if (response.data && response.data.replyMessage) {
                    await sock.sendMessage(senderJid, { text: response.data.replyMessage });
                    console.log('[BOT] Berhasil mengirim pesan balasan langsung dari respon webhook.');
                }
            } catch (error) {
                console.error('[!] Gagal memanggil Next.js Webhook:', error.message);
                
                // Jika respon error memiliki detail pesan balasan, teruskan ke user
                if (error.response && error.response.data && error.response.data.replyMessage) {
                    try {
                        await sock.sendMessage(senderJid, { text: error.response.data.replyMessage });
                    } catch (sendErr) {
                        console.error('[!] Gagal mengirim pesan error ke user:', sendErr.message);
                    }
                }
            }
        }
    });
}

// ---------------------------------------------------------
// Express Server API (Untuk dipanggil oleh Next.js)
// ---------------------------------------------------------

// Endpoint ping untuk UptimeRobot
app.get('/ping', (req, res) => {
    res.json({ status: 'alive', time: new Date(), connected: isConnected });
});

app.get('/', (req, res) => {
    if (isConnected) {
        res.send('✅ Matchaboy WA Bot is Running & Connected 🍵');
    } else if (latestQr) {
        res.redirect('/qr');
    } else {
        res.send('⏳ Matchaboy WA Bot is Starting... Please wait.');
    }
});

// Endpoint QR Code — buka di browser HP/laptop untuk scan
app.get('/qr', async (req, res) => {
    if (isConnected) {
        return res.send(`
            <html><body style="display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:sans-serif;background:#0a0a0a;color:#22c55e;">
                <div style="text-align:center;">
                    <h1 style="font-size:3rem;">✅</h1>
                    <h2>Bot Sudah Terhubung!</h2>
                    <p style="color:#888;">WhatsApp bot sudah aktif dan berjalan. Tidak perlu scan lagi.</p>
                </div>
            </body></html>
        `);
    }
    
    if (!latestQr) {
        return res.send(`
            <html><body style="display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:sans-serif;background:#0a0a0a;color:#eab308;">
                <div style="text-align:center;">
                    <h1 style="font-size:3rem;">⏳</h1>
                    <h2>Menunggu QR Code...</h2>
                    <p style="color:#888;">QR Code belum tersedia. Refresh halaman ini dalam beberapa detik.</p>
                    <script>setTimeout(() => location.reload(), 3000);</script>
                </div>
            </body></html>
        `);
    }
    
    try {
        const qrImageDataUrl = await QRCode.toDataURL(latestQr, { width: 400, margin: 2 });
        res.send(`
            <html>
            <head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Scan QR - Matchaboy Bot</title></head>
            <body style="display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:sans-serif;background:#0a0a0a;color:white;margin:0;">
                <div style="text-align:center;padding:20px;">
                    <h2 style="color:#B48A5E;">🍵 Matchaboy WA Bot</h2>
                    <p style="color:#aaa;font-size:14px;margin-bottom:20px;">Scan QR Code ini dengan WhatsApp di HP Anda</p>
                    <div style="background:white;padding:16px;border-radius:20px;display:inline-block;box-shadow:0 0 40px rgba(180,138,94,0.3);">
                        <img src="${qrImageDataUrl}" alt="QR Code" style="width:300px;height:300px;" />
                    </div>
                    <p style="color:#666;font-size:12px;margin-top:16px;">WhatsApp → Perangkat Tertaut → Tautkan Perangkat</p>
                    <p style="color:#444;font-size:11px;">QR akan berubah setiap 20 detik. Halaman ini otomatis refresh.</p>
                    <script>setTimeout(() => location.reload(), 15000);</script>
                </div>
            </body>
            </html>
        `);
    } catch (err) {
        res.status(500).send('Gagal generate QR: ' + err.message);
    }
});

// Endpoint untuk mengirim pesan
app.post('/send', async (req, res) => {
    try {
        const { phone, message, jid: providedJid } = req.body;
        
        if ((!phone && !providedJid) || !message) {
            return res.status(400).json({ success: false, error: 'Butuh parameter phone/jid dan message' });
        }

        if (!sock) {
            return res.status(500).json({ success: false, error: 'Bot belum siap (belum connect WA)' });
        }

        // Gunakan JID yang diberikan atau format dari nomor
        const jid = providedJid || `${phone}@s.whatsapp.net`;

        // Kirim pesan
        await sock.sendMessage(jid, { text: message });
        console.log(`[PESAN KELUAR] Ke ${jid}: Berhasil dikirim`);

        return res.json({ success: true, message: 'Terkirim' });
    } catch (error) {
        console.error('[!] Gagal kirim pesan via API:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// Start bot & server
connectToWhatsApp();

app.listen(PORT, () => {
    console.log(`\n🚀 [SERVER] Express API berjalan di http://localhost:${PORT}`);
    console.log(`- Endpoint untuk kirim pesan: POST http://localhost:${PORT}/send`);
});
