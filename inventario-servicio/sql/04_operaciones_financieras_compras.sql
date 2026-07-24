-- inventario-servicio/sql/04_operaciones_financieras_compras.sql
BEGIN;

ALTER TABLE ingresos
  ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(30),
  ADD COLUMN IF NOT EXISTS caja_tipo VARCHAR(10),
  ADD COLUMN IF NOT EXISTS caja_id INTEGER,
  ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE,
  ADD COLUMN IF NOT EXISTS estado_financiero VARCHAR(20)
    NOT NULL DEFAULT 'NO_APLICA',
  ADD COLUMN IF NOT EXISTS cuenta_pagar_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'ingresos'::regclass
      AND conname = 'chk_ingresos_metodo_pago'
  ) THEN
    ALTER TABLE ingresos
      ADD CONSTRAINT chk_ingresos_metodo_pago
      CHECK (
        metodo_pago IS NULL
        OR metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'ingresos'::regclass
      AND conname = 'chk_ingresos_caja_tipo'
  ) THEN
    ALTER TABLE ingresos
      ADD CONSTRAINT chk_ingresos_caja_tipo
      CHECK (
        caja_tipo IS NULL
        OR caja_tipo IN ('BANCO', 'CHICA')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'ingresos'::regclass
      AND conname = 'chk_ingresos_estado_financiero'
  ) THEN
    ALTER TABLE ingresos
      ADD CONSTRAINT chk_ingresos_estado_financiero
      CHECK (
        estado_financiero IN (
          'NO_APLICA',
          'PENDIENTE',
          'APLICADO',
          'ERROR',
          'DESCARTADO'
        )
      );
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS operaciones_financieras_inventario (
  id SERIAL PRIMARY KEY,
  ingreso_id INTEGER NOT NULL
    REFERENCES ingresos(id)
    ON DELETE RESTRICT,
  cuenta_pagar_id INTEGER,
  operacion_id UUID NOT NULL UNIQUE,
  operacion_id_original UUID,
  idempotency_key VARCHAR(255) NOT NULL UNIQUE,
  tipo VARCHAR(50) NOT NULL
    CHECK (
      tipo IN (
        'COMPRA_CONTADO',
        'COMPRA_CREDITO',
        'ANULACION_COMPRA',
        'DEVOLUCION_PROVEEDOR'
      )
    ),
  tipo_compra tipo_compra,
  metodo_pago VARCHAR(30)
    CHECK (
      metodo_pago IS NULL
      OR metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA')
    ),
  caja_tipo VARCHAR(10)
    CHECK (
      caja_tipo IS NULL
      OR caja_tipo IN ('BANCO', 'CHICA')
    ),
  caja_id INTEGER,
  monto_total NUMERIC(14,2) NOT NULL DEFAULT 0
    CHECK (monto_total >= 0),
  fecha_vencimiento DATE,
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
    CHECK (
      estado IN ('PENDIENTE', 'APLICADO', 'ERROR', 'DESCARTADO')
    ),
  intentos INTEGER NOT NULL DEFAULT 0
    CHECK (intentos >= 0),
  ultimo_error TEXT,
  payload JSONB NOT NULL,
  respuesta JSONB,
  proximo_reintento_en TIMESTAMPTZ,
  aplicado_en TIMESTAMPTZ,
  descartado_en TIMESTAMPTZ,
  motivo_descarte TEXT,
  motivo TEXT,
  trace_id VARCHAR(100),
  usuario_id INTEGER,
  usuario_nombre VARCHAR(150),
  sucursal_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_op_fin_inv_estado_reintento
  ON operaciones_financieras_inventario (
    estado,
    proximo_reintento_en
  )
  WHERE estado = 'PENDIENTE';

CREATE INDEX IF NOT EXISTS idx_op_fin_inv_ingreso
  ON operaciones_financieras_inventario (ingreso_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_op_fin_inv_operacion_original
  ON operaciones_financieras_inventario (operacion_id_original)
  WHERE operacion_id_original IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ingresos_estado_financiero
  ON ingresos (estado_financiero, updated_at DESC);

COMMIT;
