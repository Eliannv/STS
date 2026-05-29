/**
 * Migración: crear tablas cajas_banco, cajas_chicas,
 * movimientos_cajas_chicas, movimientos_cajas_banco
 * (ejecutar UNA sola vez en Supabase)
 */
import 'dotenv/config';
import pool from '../src/infraestructura/base-dato/Postgresql.js';

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ENUMs (IF NOT EXISTS en PostgreSQL requiere hack via DO)
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE estado_caja AS ENUM ('ABIERTA','CERRADA');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE tipo_movimiento_caja AS ENUM ('INGRESO','EGRESO');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE categoria_mov_banco AS ENUM (
          'VENTA_EFECTIVO','COBRO_DEUDA','CIERRE_CAJA_CHICA',
          'TRANSFERENCIA_CLIENTE','PAGO_TRABAJADOR','OTRO'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    console.log('✅ ENUMs listos');

    // CAJAS BANCO
    await client.query(`
      CREATE TABLE IF NOT EXISTS cajas_banco (
        id                 SERIAL        PRIMARY KEY,
        fecha              DATE          NOT NULL,
        saldo_inicial      NUMERIC(14,2) NOT NULL DEFAULT 0,
        saldo_actual       NUMERIC(14,2) NOT NULL DEFAULT 0,
        estado             estado_caja   NOT NULL DEFAULT 'ABIERTA',
        usuario_id         INTEGER       REFERENCES usuarios(id) ON DELETE SET NULL,
        usuario_nombre     VARCHAR(150),
        observacion        TEXT,
        activo             BOOLEAN       NOT NULL DEFAULT TRUE,
        created_at         TIMESTAMPTZ   DEFAULT NOW(),
        updated_at         TIMESTAMPTZ   DEFAULT NOW(),
        cerrado_en         TIMESTAMPTZ,
        cerrado_por_id     INTEGER       REFERENCES usuarios(id) ON DELETE SET NULL,
        cerrado_por_nombre VARCHAR(150)
      )
    `);
    console.log('✅ Tabla cajas_banco lista');

    // CAJAS CHICAS
    await client.query(`
      CREATE TABLE IF NOT EXISTS cajas_chicas (
        id                 SERIAL        PRIMARY KEY,
        fecha              DATE          NOT NULL,
        monto_inicial      NUMERIC(14,2) NOT NULL DEFAULT 0,
        monto_actual       NUMERIC(14,2) NOT NULL DEFAULT 0,
        estado             estado_caja   NOT NULL DEFAULT 'ABIERTA',
        usuario_id         INTEGER       REFERENCES usuarios(id) ON DELETE SET NULL,
        usuario_nombre     VARCHAR(150),
        observacion        TEXT,
        activo             BOOLEAN       NOT NULL DEFAULT TRUE,
        caja_banco_id      INTEGER       REFERENCES cajas_banco(id) ON DELETE SET NULL,
        created_at         TIMESTAMPTZ   DEFAULT NOW(),
        updated_at         TIMESTAMPTZ   DEFAULT NOW(),
        cerrado_en         TIMESTAMPTZ,
        cerrado_por_id     INTEGER       REFERENCES usuarios(id) ON DELETE SET NULL,
        cerrado_por_nombre VARCHAR(150)
      )
    `);
    console.log('✅ Tabla cajas_chicas lista');

    // MOVIMIENTOS CAJAS CHICAS
    await client.query(`
      CREATE TABLE IF NOT EXISTS movimientos_cajas_chicas (
        id             SERIAL               PRIMARY KEY,
        caja_chica_id  INTEGER              NOT NULL REFERENCES cajas_chicas(id) ON DELETE CASCADE,
        fecha          TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
        tipo           tipo_movimiento_caja NOT NULL,
        descripcion    VARCHAR(255)         NOT NULL,
        monto          NUMERIC(14,2)        NOT NULL,
        saldo_anterior NUMERIC(14,2)        NOT NULL,
        saldo_nuevo    NUMERIC(14,2)        NOT NULL,
        usuario_id     INTEGER              REFERENCES usuarios(id) ON DELETE SET NULL,
        usuario_nombre VARCHAR(150),
        referencia     VARCHAR(100),
        created_at     TIMESTAMPTZ          DEFAULT NOW()
      )
    `);
    console.log('✅ Tabla movimientos_cajas_chicas lista');

    // MOVIMIENTOS CAJAS BANCO
    await client.query(`
      CREATE TABLE IF NOT EXISTS movimientos_cajas_banco (
        id             SERIAL               PRIMARY KEY,
        caja_banco_id  INTEGER              NOT NULL REFERENCES cajas_banco(id) ON DELETE CASCADE,
        fecha          TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
        tipo           tipo_movimiento_caja NOT NULL,
        categoria      categoria_mov_banco  NOT NULL DEFAULT 'OTRO',
        monto          NUMERIC(14,2)        NOT NULL,
        saldo_anterior NUMERIC(14,2)        NOT NULL,
        saldo_nuevo    NUMERIC(14,2)        NOT NULL,
        descripcion    VARCHAR(255),
        referencia     VARCHAR(100),
        usuario_id     INTEGER              REFERENCES usuarios(id) ON DELETE SET NULL,
        usuario_nombre VARCHAR(150),
        created_at     TIMESTAMPTZ          DEFAULT NOW()
      )
    `);
    console.log('✅ Tabla movimientos_cajas_banco lista');

    await client.query('COMMIT');
    console.log('\n🎉 Migración de cajas completada exitosamente');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error en migración:', e.message);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
