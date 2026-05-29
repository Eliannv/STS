// sql/migrar_ventas.mjs
// Crea la tabla "ventas" usada por el módulo de ventas (distinta de la tabla histórica "facturas")
import 'dotenv/config';
import pool from '../src/infraestructura/base-dato/Postgresql.js';

const SQL = `
-- ─────────────────────────────────────────────────────────────
-- Tabla: ventas  (módulo de facturación/historial de ventas)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ventas (
  id               SERIAL          PRIMARY KEY,
  id_personalizado CHAR(10)        UNIQUE,
  cliente_id       INTEGER         NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  nombre_cliente   VARCHAR(200),
  metodo_pago      VARCHAR(50),
  numero_factura   VARCHAR(100)    UNIQUE,
  tipo             VARCHAR(30)     NOT NULL DEFAULT 'NORMAL',      -- NORMAL | COBRO_DEUDA
  estado           VARCHAR(30)     NOT NULL DEFAULT 'PENDIENTE',   -- PENDIENTE | PAGADA | ANULADA
  subtotal         NUMERIC(14,2)   NOT NULL DEFAULT 0,
  descuento        NUMERIC(14,2)   NOT NULL DEFAULT 0,
  total            NUMERIC(14,2)   NOT NULL DEFAULT 0,
  saldo_pendiente  NUMERIC(14,2)   NOT NULL DEFAULT 0,
  observacion      TEXT,
  usuario_id       INTEGER         REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Secuencia para id_personalizado
CREATE SEQUENCE IF NOT EXISTS seq_id_ventas START 1;

-- Función trigger para auto-generar id_personalizado si no se proporcionó
CREATE OR REPLACE FUNCTION set_venta_id_personalizado()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.id_personalizado IS NULL THEN
    NEW.id_personalizado := 'V' || LPAD(nextval('seq_id_ventas')::TEXT, 9, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_venta_id_personalizado ON ventas;
CREATE TRIGGER trg_venta_id_personalizado
  BEFORE INSERT ON ventas
  FOR EACH ROW EXECUTE FUNCTION set_venta_id_personalizado();

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id  ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_estado       ON ventas(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_created_at   ON ventas(created_at DESC);
`;

async function migrar() {
  const client = await pool.connect();
  try {
    console.log('⏳ Creando tabla ventas...');
    await client.query(SQL);
    console.log('✅ Tabla ventas creada correctamente.');

    // Verificar
    const { rows } = await client.query(`SELECT COUNT(*) FROM ventas`);
    console.log(`   Registros actuales: ${rows[0].count}`);
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrar();
