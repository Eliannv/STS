-- facturacion-servicio/sql/02_operaciones_financieras.sql
BEGIN;

CREATE TABLE IF NOT EXISTS operaciones_financieras (
  id SERIAL PRIMARY KEY,
  factura_id INTEGER NOT NULL
    REFERENCES facturas(id)
    ON DELETE RESTRICT,
  factura_deuda_id INTEGER,
  cuenta_cobrar_id INTEGER,
  operacion_id UUID NOT NULL UNIQUE,
  operacion_id_original UUID,
  idempotency_key VARCHAR(255) NOT NULL UNIQUE,
  tipo VARCHAR(50) NOT NULL
    CHECK (
      tipo IN (
        'VENTA_EFECTIVO',
        'VENTA_TRANSFERENCIA',
        'VENTA_CREDITO',
        'VENTA_MIXTA',
        'COBRO_EFECTIVO',
        'COBRO_TRANSFERENCIA',
        'ANULACION_VENTA',
        'ANULACION_COBRO',
        'CANCELACION_CUENTA'
      )
    ),
  metodo_pago VARCHAR(30),
  metodo_cobro VARCHAR(30),
  monto_total NUMERIC(14,2) DEFAULT 0,
  monto_cobrado NUMERIC(14,2) DEFAULT 0,
  monto_credito NUMERIC(14,2) DEFAULT 0,
  fecha_vencimiento DATE,
  referencia_pago VARCHAR(100),
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
    CHECK (
      estado IN (
        'PENDIENTE',
        'APLICADO',
        'ERROR',
        'DESCARTADO'
      )
    ),
  intentos INTEGER DEFAULT 0,
  ultimo_error TEXT,
  payload JSONB NOT NULL,
  respuesta JSONB,
  proximo_reintento_en TIMESTAMPTZ,
  aplicado_en TIMESTAMPTZ,
  descartado_en TIMESTAMPTZ,
  motivo_descarte TEXT,
  trace_id VARCHAR(100),
  usuario_id INTEGER,
  usuario_nombre VARCHAR(150),
  sucursal_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_op_fin_estado_reintento
  ON operaciones_financieras (estado, proximo_reintento_en)
  WHERE estado = 'PENDIENTE';

CREATE INDEX IF NOT EXISTS idx_op_fin_factura
  ON operaciones_financieras (factura_id);

CREATE INDEX IF NOT EXISTS idx_op_fin_operacion
  ON operaciones_financieras (operacion_id);

COMMIT;
