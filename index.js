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
    // Tutup sock lama dengan benar sebelum membuat koneksi baru
    // Tanpa ini, sock lama tetap aktif → WhatsApp melihat 2 koneksi → status 440 (conflict) loop
    if (sock) {
        try {
            sock.ev.removeAllListeners();
            sock.ws?.terminate?.();
        } catch {}
        sock = null;
    }

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
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus. Alasan:', lastDisconnect?.error?.message, '| Status:', statusCode);

            if (statusCode === 440) {
                // 440 = Conflict: instance lain masih terhubung.
                // Tunggu lebih lama agar koneksi lama benar-benar tertutup di sisi WA.
                connectToWhatsApp._retryCount = 0;
                console.log('[BOT] Konflik sesi (440). Menunggu 10 detik agar koneksi lama tertutup...');
                setTimeout(() => connectToWhatsApp(), 10000);
            } else if (shouldReconnect) {
                // Exponential back-off: mulai 5 detik, maks 30 detik
                const delay = Math.min((connectToWhatsApp._retryCount || 0) * 5000 + 5000, 30000);
                connectToWhatsApp._retryCount = (connectToWhatsApp._retryCount || 0) + 1;
                console.log(`Menyiapkan koneksi ulang dalam ${delay / 1000} detik... (percobaan ke-${connectToWhatsApp._retryCount})`);
                setTimeout(() => connectToWhatsApp(), delay);
            } else {
                console.log('[BOT] Bot ter-logout. Tidak akan mencoba reconnect otomatis.');
                connectToWhatsApp._retryCount = 0;
            }
        } else if (connection === 'open') {
            console.log('\n✅ [BOT] Berhasil terhubung ke WhatsApp!');
            console.log(`[BOT] Terhubung sebagai: ${sock.user?.id || 'Unknown'} (${sock.user?.name || 'No Name'})\n`);
            isConnected = true;
            latestQr = null;
            connectToWhatsApp._retryCount = 0; // Reset retry counter setelah berhasil terhubung
            
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
        // Hanya proses pesan 'notify' (masuk baru), abaikan 'append' (sinkronisasi histori)
        if (m.type !== 'notify') return;

        const msg = m.messages[0];
        console.log('[DEBUG_RAW_MSG]', JSON.stringify(msg, null, 2));
        
        // Abaikan pesan dari diri sendiri atau pesan tanpa konten
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
            // Fix #3: regex sebelumnya punya karakter `\.` yang memblokir domain berisi titik (misal vercel.app)
            const domainMatch = text.match(/Domain:\s*(https?:\/\/[^\s]+)/i);
            
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
                // directReply: true → webhook tidak panggil sendWhatsAppMessage,
                // cukup return replyMessage di JSON, lalu bot kirim via sock.sendMessage()
                const response = await axios.post(webhookUrl, {
                    phone: senderNumber,
                    text: text,
                    jid: senderJid,
                    directReply: true
                }, { timeout: 15000 });

                console.log('[-] Berhasil meneruskan ke Next.js Webhook. Response:', response.data?.message || 'OK');

                // Webhook mengembalikan replyMessage → bot kirim langsung via socket
                if (response.data && response.data.replyMessage) {
                    await sock.sendMessage(senderJid, { text: response.data.replyMessage });
                    console.log('[BOT] Pesan balasan berhasil dikirim ke user.');
                }
            } catch (error) {
                console.error('[!] Gagal memanggil Next.js Webhook:', error.message);
                
                // Jika respon error memiliki detail pesan balasan, kirim langsung via socket
                if (error.response && error.response.data && error.response.data.replyMessage) {
                    try {
                        await sock.sendMessage(senderJid, { text: error.response.data.replyMessage });
                        console.log('[BOT] Error reply terkirim ke user via socket.');
                    } catch (sendErr) {
                        console.error('[!] Gagal mengirim pesan error ke user:', sendErr.message);
                    }
                } else {
                    // Kirim pesan error generik agar user tidak bingung menunggu
                    try {
                        await sock.sendMessage(senderJid, {
                            text: '⚠️ Maaf, sistem sedang sibuk. Silakan coba lagi dalam beberapa saat.'
                        });
                    } catch {}
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
