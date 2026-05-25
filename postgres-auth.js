const { proto, BufferJSON, initAuthCreds } = require('@whiskeysockets/baileys');
const db = require('./db');

const writeData = (data) => {
    return JSON.stringify(data, BufferJSON.replacer);
};

const readData = (data) => {
    if (!data) return null;
    // Kolom TEXT: pg driver mengembalikan string murni, langsung parse dengan reviver Baileys
    const str = typeof data === 'string' ? data : JSON.stringify(data, BufferJSON.replacer);
    return JSON.parse(str, BufferJSON.reviver);
};

async function usePostgresAuthState() {
    // 1. Buat tabel baru jika belum ada (dengan tipe TEXT yang benar)
    await db.query(`
        CREATE TABLE IF NOT EXISTS wa_bot_session (
            key  TEXT PRIMARY KEY,
            value TEXT
        )
    `);

    // 2. Migration otomatis: ubah kolom JSONB lama ke TEXT (jika masih JSONB)
    //    Ini aman dijalankan berkali-kali — hanya berjalan jika kolom masih bertipe jsonb
    try {
        const colCheck = await db.query(`
            SELECT data_type FROM information_schema.columns
            WHERE table_name = 'wa_bot_session' AND column_name = 'value'
        `);
        if (colCheck.rows.length > 0 && colCheck.rows[0].data_type === 'jsonb') {
            console.log('[DB AUTH] Mendeteksi kolom JSONB lama, melakukan migrasi ke TEXT...');
            await db.query(`ALTER TABLE wa_bot_session ALTER COLUMN value TYPE TEXT USING value::text`);
            console.log('[DB AUTH] Migrasi kolom ke TEXT berhasil. Sesi lama mungkin perlu scan QR ulang.');
        }
    } catch (migErr) {
        console.warn('[DB AUTH] Peringatan migrasi kolom (abaikan jika tabel baru):', migErr.message);
    }

    const writeToDb = async (key, val) => {
        try {
            if (val === null || val === undefined) {
                await db.query('DELETE FROM wa_bot_session WHERE key = $1', [key]);
            } else {
                const serialized = writeData(val);
                await db.query(`
                    INSERT INTO wa_bot_session (key, value)
                    VALUES ($1, $2::text)
                    ON CONFLICT (key)
                    DO UPDATE SET value = EXCLUDED.value
                `, [key, serialized]);
            }
        } catch (err) {
            console.error(`[DB AUTH ERROR] Gagal menulis key ${key}:`, err);
        }
    };

    const readFromDb = async (key) => {
        try {
            const res = await db.query('SELECT value FROM wa_bot_session WHERE key = $1', [key]);
            if (res.rows.length === 0) return null;
            return readData(res.rows[0].value);
        } catch (err) {
            console.error(`[DB AUTH ERROR] Gagal membaca key ${key}:`, err);
            return null;
        }
    };

    let creds = await readFromDb('creds');
    if (!creds) {
        creds = initAuthCreds();
        await writeToDb('creds', creds);
    }

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readFromDb(`${type}:${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}:${id}`;
                            tasks.push(writeToDb(key, value));
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: async () => {
            await writeToDb('creds', creds);
        }
    };
}

module.exports = { usePostgresAuthState };
