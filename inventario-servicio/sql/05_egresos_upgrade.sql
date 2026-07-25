-- inventario-servicio/sql/05_egresos_upgrade.sql
BEGIN;

DO $$
BEGIN
  CREATE TYPE tipo_egreso_mercaderia AS ENUM (
    'DEVOLUCION_PROVEEDOR',
    'MERMA',
    'ROTURA',
    'ROBO',
    'PERDIDA',
    'VENCIMIENTO',
    'CONSUMO_INTERNO',
    'MUESTRA',
    'DONACION',
    'OBSOLESCENCIA',
    'RETIRO_CALIDAD',
    'OTRO'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE estado_egreso AS ENUM (
    'BORRADOR',
    'CONFIRMADO',
    'ANULADO',
    'DESCARTADO'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE estado_financiero_egreso AS ENUM (
    'NO_APLICA',
    'PENDIENTE',
    'APLICADO',
    'ERROR',
    'DESCARTADO'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'egresos_mercaderia'
      AND column_name = 'motivo'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'egresos_mercaderia'
      AND column_name = 'tipo_egreso'
  ) THEN
    ALTER TABLE egresos_mercaderia RENAME COLUMN motivo TO tipo_egreso;
  END IF;
END;
$$;

ALTER TABLE egresos_mercaderia
  ALTER COLUMN tipo_egreso DROP NOT NULL;

ALTER TABLE egresos_mercaderia
  ALTER COLUMN tipo_egreso TYPE tipo_egreso_mercaderia
  USING (
    CASE tipo_egreso::TEXT
      WHEN 'DEVOLUCION_PROVEEDOR' THEN 'DEVOLUCION_PROVEEDOR'
      WHEN 'PRODUCTO_DANADO' THEN 'ROTURA'
      WHEN 'AJUSTE_INVENTARIO' THEN 'MERMA'
      WHEN 'DONACION' THEN 'DONACION'
      WHEN 'USO_INTERNO' THEN 'CONSUMO_INTERNO'
      WHEN 'PERDIDA_ROBO' THEN 'ROBO'
      WHEN 'MERMA' THEN 'MERMA'
      WHEN 'ROTURA' THEN 'ROTURA'
      WHEN 'ROBO' THEN 'ROBO'
      WHEN 'PERDIDA' THEN 'PERDIDA'
      WHEN 'VENCIMIENTO' THEN 'VENCIMIENTO'
      WHEN 'CONSUMO_INTERNO' THEN 'CONSUMO_INTERNO'
      WHEN 'MUESTRA' THEN 'MUESTRA'
      WHEN 'OBSOLESCENCIA' THEN 'OBSOLESCENCIA'
      WHEN 'RETIRO_CALIDAD' THEN 'RETIRO_CALIDAD'
      ELSE 'OTRO'
    END
  )::tipo_egreso_mercaderia;

ALTER TABLE egresos_mercaderia
  ALTER COLUMN tipo_egreso SET NOT NULL,
  ADD COLUMN IF NOT EXISTS motivo TEXT,
  ADD COLUMN IF NOT EXISTS observacion TEXT,
  ADD COLUMN IF NOT EXISTS estado estado_egreso NOT NULL DEFAULT 'BORRADOR',
  ADD COLUMN IF NOT EXISTS estado_financiero estado_financiero_egreso
    NOT NULL DEFAULT 'NO_APLICA',
  ADD COLUMN IF NOT EXISTS id_personalizado VARCHAR(20),
  ADD COLUMN IF NOT EXISTS origen VARCHAR(50),
  ADD COLUMN IF NOT EXISTS ingreso_origen_id INTEGER
    REFERENCES ingresos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS confirmado_en TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmado_por_id INTEGER,
  ADD COLUMN IF NOT EXISTS confirmado_por_nombre VARCHAR(150),
  ADD COLUMN IF NOT EXISTS anulado_en TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS anulado_por_id INTEGER,
  ADD COLUMN IF NOT EXISTS anulado_por_nombre VARCHAR(150),
  ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT,
  ADD COLUMN IF NOT EXISTS operacion_confirmacion_id UUID,
  ADD COLUMN IF NOT EXISTS operacion_anulacion_id UUID,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE egresos_mercaderia
SET estado = 'CONFIRMADO',
    confirmado_en = COALESCE(created_at, fecha, NOW()),
    confirmado_por_id = usuario_id,
    confirmado_por_nombre = usuario_nombre,
    id_personalizado = COALESCE(id_personalizado, LPAD(id::TEXT, 10, '0')),
    origen = COALESCE(origen, 'MIGRACION'),
    updated_at = COALESCE(updated_at, created_at, NOW())
WHERE estado = 'BORRADOR';

UPDATE egresos_mercaderia
SET motivo = 'Registro histórico migrado'
WHERE tipo_egreso = 'OTRO'
  AND NULLIF(BTRIM(motivo), '') IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_egresos_id_personalizado
  ON egresos_mercaderia (id_personalizado)
  WHERE id_personalizado IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_egresos_operacion_confirmacion
  ON egresos_mercaderia (operacion_confirmacion_id)
  WHERE operacion_confirmacion_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_egresos_operacion_anulacion
  ON egresos_mercaderia (operacion_anulacion_id)
  WHERE operacion_anulacion_id IS NOT NULL;

ALTER TABLE detalle_egresos
  ADD COLUMN IF NOT EXISTS detalle_ingreso_id INTEGER
    REFERENCES detalle_ingresos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS costo_unitario_original NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255),
  ADD COLUMN IF NOT EXISTS operacion_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS uq_detalle_egreso_idempotency
  ON detalle_egresos (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TYPE tipo_kardex_stock ADD VALUE IF NOT EXISTS 'MERMA';
ALTER TYPE tipo_kardex_stock ADD VALUE IF NOT EXISTS 'ROTURA';
ALTER TYPE tipo_kardex_stock ADD VALUE IF NOT EXISTS 'ROBO';
ALTER TYPE tipo_kardex_stock ADD VALUE IF NOT EXISTS 'PERDIDA';
ALTER TYPE tipo_kardex_stock ADD VALUE IF NOT EXISTS 'VENCIMIENTO';
ALTER TYPE tipo_kardex_stock ADD VALUE IF NOT EXISTS 'CONSUMO_INTERNO';
ALTER TYPE tipo_kardex_stock ADD VALUE IF NOT EXISTS 'MUESTRA';
ALTER TYPE tipo_kardex_stock ADD VALUE IF NOT EXISTS 'DONACION';
ALTER TYPE tipo_kardex_stock ADD VALUE IF NOT EXISTS 'OBSOLESCENCIA';
ALTER TYPE tipo_kardex_stock ADD VALUE IF NOT EXISTS 'RETIRO_CALIDAD';

ALTER TABLE operaciones_financieras_inventario
  ALTER COLUMN ingreso_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS egreso_id INTEGER
    REFERENCES egresos_mercaderia(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS proveedor_id INTEGER,
  ADD COLUMN IF NOT EXISTS proveedor_nombre VARCHAR(150),
  ADD COLUMN IF NOT EXISTS ingreso_origen_id INTEGER
    REFERENCES ingresos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS monto NUMERIC(14,2) NOT NULL DEFAULT 0;

ALTER TABLE operaciones_financieras_inventario
  DROP CONSTRAINT IF EXISTS operaciones_financieras_inventario_tipo_check;

ALTER TABLE operaciones_financieras_inventario
  ADD CONSTRAINT operaciones_financieras_inventario_tipo_check
  CHECK (
    tipo IN (
      'COMPRA_CONTADO',
      'COMPRA_CREDITO',
      'ANULACION_COMPRA',
      'DEVOLUCION_PROVEEDOR',
      'REEMBOLSO_DEVOLUCION',
      'ANULACION_REEMBOLSO'
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'operaciones_financieras_inventario'::regclass
      AND conname = 'chk_op_fin_inv_propietario'
  ) THEN
    ALTER TABLE operaciones_financieras_inventario
      ADD CONSTRAINT chk_op_fin_inv_propietario
      CHECK (num_nonnulls(ingreso_id, egreso_id) = 1);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_op_fin_inv_egreso
  ON operaciones_financieras_inventario (egreso_id, created_at DESC);

COMMIT;
