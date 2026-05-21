const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'sercofun_homenajes',
  user: process.env.DB_USER || 'sercofun_admin',
  password: process.env.DB_PASSWORD || 'ChangeMe',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  console.log('[DB] Nueva conexion a PostgreSQL establecida');
});

pool.on('error', (err) => {
  console.error('[DB] Error inesperado en cliente PostgreSQL:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
