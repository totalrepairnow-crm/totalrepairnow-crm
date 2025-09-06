const { Pool } = require('pg');

const config = {
  host: process.env.PGHOST || '127.0.0.1',
  port: +(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'crmuser',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'crm',
  ssl: process.env.PGSSL === 'require' ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(config);
module.exports = { pool };
