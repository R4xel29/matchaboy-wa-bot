const { Pool } = require('pg');

// WAJIB: Set DATABASE_URL di environment variables (Render/Railway/dll).
// JANGAN hardcode credentials di sini — risiko kebocoran ke GitHub!
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error(
        '[DB] FATAL: Environment variable DATABASE_URL tidak ditemukan. ' +
        'Set DATABASE_URL di konfigurasi environment sebelum menjalankan bot.'
    );
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 3,                  // Bot tidak butuh banyak koneksi; cegah EMAXCONNSESSION Supabase
    idleTimeoutMillis: 10000, // Tutup koneksi idle setelah 10 detik
    connectionTimeoutMillis: 5000,
});

// Test koneksi saat startup agar error terdeteksi lebih awal
pool.connect((err, client, release) => {
    if (err) {
        console.error('[DB] Gagal terhubung ke database:', err.message);
    } else {
        console.log('[DB] Koneksi database berhasil.');
        release();
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
