// src/infraestructura/base-dato/Postgresql.js
import pkg from 'pg';
const { Pool } = pkg;

const configPgsql = new Pool({
  host:     'host.docker.internal',
  port:     5432,
  user:     'postgres',
  password: 'admin',
  database: 'STS',
  max: 10
});

configPgsql.on('connect', () => {
  console.log('Nueva conexión PostgreSQL creada');
});

configPgsql.on('error', (err) => {
  console.error('Error en el pool de PostgreSQL:', err.message);
});

export default configPgsql;