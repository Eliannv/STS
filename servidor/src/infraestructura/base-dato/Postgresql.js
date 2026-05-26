// src/infraestructura/base-dato/Postgresql.js

import pkg from 'pg';
const { Pool } = pkg;

const configPgsql = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,

  max: 10
});

configPgsql.on('connect', () => {
  console.log('✅ Nueva conexión PostgreSQL creada');
});

configPgsql.on('error', (err) => {
  console.error('❌ Error en PostgreSQL:', err.message);
});

export default configPgsql;