const { Pool } = require('pg');

const pool = new Pool({
  host: "aws-0-ap-southeast-1.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  user: "postgres.heceotsazrqtejxmbsux",
  pool_mode: "session",
  password: "9QOc3onAnN!",
  ssl: {
    rejectUnauthorized: false  // required by Supabase
  }
});

module.exports = pool