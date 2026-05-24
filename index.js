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
            console.log('\n[!] SCAN QR CODE INI DI APLIKASI WHATSAPP ANDA');
            console.log('[!] QR Code juga disimpan ke file: qr.png');
            
            // Simpan QR ke file gambar agar user mudah scan
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
    res.json({ status: 'alive', time: new Date() });
});

app.get('/', (req, res) => {
    res.send('Matchaboy WA Bot is Running 🍵');
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
