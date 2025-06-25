// test-db.js
const pool = require('./db');

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL!');
    console.log('Server Time:', res.rows[0].now);
  } catch (err) {
    console.error('❌ Connection failed:', err);
  } finally {
    pool.end();
  }
}

testConnection();
