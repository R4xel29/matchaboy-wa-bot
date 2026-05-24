const { proto, BufferJSON, initAuthCreds } = require('@whiskeysockets/baileys');
const db = require('./db');

const writeData = (data) => {
    return JSON.stringify(data, BufferJSON.replacer);
};

const readData = (data) => {
    if (!data) return null;
    // Jika format data di db sudah berupa objek/string JSON
    const parsed = typeof data === 'string' ? data : JSON.stringify(data);
    return JSON.parse(parsed, BufferJSON.reviver);
};

async function usePostgresAuthState() {
    // 1. Inisialisasi tabel jika belum ada
    await db.query(`
        CREATE TABLE IF NOT EXISTS wa_bot_session (
            key TEXT PRIMARY KEY,
            value JSONB
        )
    `);

    const writeToDb = async (key, val) => {
        try {
            if (val === null || val === undefined) {
                await db.query('DELETE FROM wa_bot_session WHERE key = $1', [key]);
            } else {
                const serialized = writeData(val);
                await db.query(`
                    INSERT INTO wa_bot_session (key, value)
                    VALUES ($1, $2)
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
