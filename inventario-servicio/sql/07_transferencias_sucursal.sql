-- inventario-servicio/sql/07_transferencias_sucursal.sql
-- Traslado de mercadería entre sucursales.
-- La transferencia es atómica: descarga el origen y carga el destino en la misma
-- transacción, apoyándose en los tipos TRANSFERENCIA_SALIDA / TRANSFERENCIA_ENTRADA
-- que el ledger de movimientos ya contempla.
BEGIN;

DO $$ BEGIN
  CREATE TYPE estado_transferencia AS ENUM ('CONFIRMADA','ANULADA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE SEQUENCE IF NOT EXISTS seq_id_transferencias START 1 INCREMENT 1 NO CYCLE;
CREATE OR REPLACE FUNCTION gen_id_transferencia() RETURNS CHAR(10) LANGUAGE SQL AS $$
  SELECT 'TR' || LPAD(nextval('seq_id_transferencias')::TEXT, 8, '0')
$$;

CREATE TABLE IF NOT EXISTS transferencias (
  id SERIAL PRIMARY KEY,
  id_personalizado CHAR(10) UNIQUE DEFAULT gen_id_transferencia(),
  sucursal_origen_id INTEGER NOT NULL,
  sucursal_origen_nombre VARCHAR(100),
  sucursal_destino_id INTEGER NOT NULL,
  sucursal_destino_nombre VARCHAR(100),
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado estado_transferencia NOT NULL DEFAULT 'CONFIRMADA',
  motivo VARCHAR(150),
  observacion TEXT,
  total_items INTEGER NOT NULL DEFAULT 0,
  costo_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  usuario_id INTEGER,
  usuario_nombre VARCHAR(150),
  operacion_id VARCHAR(100) NOT NULL,
  idempotency_key VARCHAR(180) NOT NULL,
  anulada_en TIMESTAMPTZ,
  anulada_por_id INTEGER,
  anulada_por_nombre VARCHAR(150),
  motivo_anulacion VARCHAR(150),
  trace_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_transferencia_sucursales_distintas CHECK (sucursal_origen_id <> sucursal_destino_id)
);

CREATE TABLE IF NOT EXISTS detalle_transferencias (
  id SERIAL PRIMARY KEY,
  transferencia_id INTEGER NOT NULL REFERENCES transferencias(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  producto_codigo VARCHAR(50),
  producto_nombre VARCHAR(150),
  modelo VARCHAR(100),
  color VARCHAR(60),
  grupo VARCHAR(60),
  cantidad INTEGER NOT NULL,
  costo_unitario NUMERIC(14,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  CONSTRAINT chk_detalle_transferencia_cantidad CHECK (cantidad > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_transferencias_idempotency ON transferencias (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_transferencias_origen ON transferencias (sucursal_origen_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_transferencias_destino ON transferencias (sucursal_destino_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_detalle_transferencias ON detalle_transferencias (transferencia_id);

COMMIT;
