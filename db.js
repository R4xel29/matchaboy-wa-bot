const { Pool } = require('pg');

// Gunakan DATABASE_URL dari env, jika tidak ada fallback ke db local/development dari Matchaboy
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.wlcergeosgpzxasxcyyi:QFLwyGwdOVvm4KRS@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
