-- caja-servicio/sql/02_caja_upgrade.sql
BEGIN;

DROP TRIGGER IF EXISTS trg_no_update_mov_banco ON movimientos_cajas_banco;
DROP TRIGGER IF EXISTS trg_no_delete_mov_banco ON movimientos_cajas_banco;
DROP TRIGGER IF EXISTS trg_no_update_mov_chica ON movimientos_cajas_chicas;
DROP TRIGGER IF EXISTS trg_no_delete_mov_chica ON movimientos_cajas_chicas;

DO $$
BEGIN
  CREATE TYPE categoria_mov_financiero AS ENUM (
    'APERTURA',
    'VENTA_EFECTIVO',
    'VENTA_TRANSFERENCIA',
    'COBRO_DEUDA_EFECTIVO',
    'COBRO_DEUDA_TRANSFERENCIA',
    'ACREDITACION_TARJETA',
    'PAGO_PROVEEDOR',
    'PAGO_TRABAJADOR',
    'REPOSICION_CAJA_CHICA',
    'DEVOLUCION_CAJA_CHICA',
    'TRANSFERENCIA_ENTRADA',
    'TRANSFERENCIA_SALIDA',
    'OTRO_INGRESO',
    'OTRO_EGRESO',
    'AJUSTE',
    'ANULACION_VENTA',
    'ANULACION_COBRO',
    'ANULACION_PAGO',
    'COMPENSACION'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE origen_mov AS ENUM (
    'FACTURACION',
    'COBRO_DEUDA',
    'VENTA_TARJETA',
    'COMPRAS',
    'CAJA',
    'TRANSFERENCIA',
    'AJUSTE',
    'MIGRACION',
    'SISTEMA'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

ALTER TABLE cajas_banco
  ADD COLUMN IF NOT EXISTS periodo DATE,
  ADD COLUMN IF NOT EXISTS fecha_apertura TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ingresos_acumulados NUMERIC(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS egresos_acumulados NUMERIC(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_movimientos INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS saldo_contado_cierre NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS diferencia_cierre NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS motivo_diferencia TEXT,
  ADD COLUMN IF NOT EXISTS observacion_cierre TEXT,
  ADD COLUMN IF NOT EXISTS permite_saldo_negativo BOOLEAN DEFAULT FALSE;

UPDATE cajas_banco
SET
  periodo = COALESCE(periodo, DATE_TRUNC('month', fecha)::DATE),
  fecha_apertura = COALESCE(fecha_apertura, created_at, fecha::TIMESTAMPTZ),
  ingresos_acumulados = COALESCE(ingresos_acumulados, 0),
  egresos_acumulados = COALESCE(egresos_acumulados, 0),
  total_movimientos = COALESCE(total_movimientos, 0),
  permite_saldo_negativo = COALESCE(permite_saldo_negativo, FALSE);

ALTER TABLE cajas_banco
  ALTER COLUMN periodo SET NOT NULL,
  ALTER COLUMN fecha_apertura SET DEFAULT NOW(),
  ALTER COLUMN fecha_apertura SET NOT NULL,
  ALTER COLUMN ingresos_acumulados SET NOT NULL,
  ALTER COLUMN egresos_acumulados SET NOT NULL,
  ALTER COLUMN total_movimientos SET NOT NULL,
  ALTER COLUMN permite_saldo_negativo SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'cajas_banco'::regclass
      AND conname = 'uq_cajas_banco_periodo'
  ) THEN
    ALTER TABLE cajas_banco
      ADD CONSTRAINT uq_cajas_banco_periodo UNIQUE (periodo);
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_caja_banco_abierta
  ON cajas_banco ((1))
  WHERE estado = 'ABIERTA';

ALTER TABLE cajas_chicas
  ADD COLUMN IF NOT EXISTS ingresos_acumulados NUMERIC(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS egresos_acumulados NUMERIC(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_movimientos INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS saldo_contado_cierre NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS diferencia_cierre NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS motivo_diferencia TEXT,
  ADD COLUMN IF NOT EXISTS transferir_a_banco BOOLEAN DEFAULT TRUE;

UPDATE cajas_chicas
SET caja_banco_id = (
  SELECT id
  FROM cajas_banco
  WHERE estado = 'ABIERTA'
  ORDER BY id DESC
  LIMIT 1
)
WHERE caja_banco_id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cajas_chicas
    WHERE caja_banco_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'No se puede vincular la Caja Chica: no existe una Caja Banco abierta';
  END IF;
END;
$$;

UPDATE cajas_chicas
SET
  ingresos_acumulados = COALESCE(ingresos_acumulados, 0),
  egresos_acumulados = COALESCE(egresos_acumulados, 0),
  total_movimientos = COALESCE(total_movimientos, 0),
  transferir_a_banco = COALESCE(transferir_a_banco, TRUE);

ALTER TABLE cajas_chicas
  DROP CONSTRAINT IF EXISTS cajas_chicas_caja_banco_id_fkey;

ALTER TABLE cajas_chicas
  DROP CONSTRAINT IF EXISTS fk_cajas_chicas_caja_banco;

ALTER TABLE cajas_chicas
  ALTER COLUMN caja_banco_id SET NOT NULL,
  ALTER COLUMN ingresos_acumulados SET NOT NULL,
  ALTER COLUMN egresos_acumulados SET NOT NULL,
  ALTER COLUMN total_movimientos SET NOT NULL,
  ALTER COLUMN transferir_a_banco SET NOT NULL,
  ADD CONSTRAINT fk_cajas_chicas_caja_banco
    FOREIGN KEY (caja_banco_id)
    REFERENCES cajas_banco(id)
    ON DELETE RESTRICT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_caja_chica_abierta
  ON cajas_chicas ((1))
  WHERE estado = 'ABIERTA';

DO $$
DECLARE
  tipo_categoria TEXT;
BEGIN
  SELECT udt_name
  INTO tipo_categoria
  FROM information_schema.columns
  WHERE table_schema = current_schema()
    AND table_name = 'movimientos_cajas_banco'
    AND column_name = 'categoria';

  IF tipo_categoria = 'categoria_mov_banco' THEN
    ALTER TABLE movimientos_cajas_banco
      ALTER COLUMN categoria DROP NOT NULL;

    ALTER TABLE movimientos_cajas_banco
      ALTER COLUMN categoria TYPE categoria_mov_financiero
      USING (
        CASE categoria::TEXT
          WHEN 'CIERRE_CAJA_CHICA' THEN 'TRANSFERENCIA_ENTRADA'
          WHEN 'TRANSFERENCIA_CLIENTE' THEN 'VENTA_TRANSFERENCIA'
          WHEN 'PAGO_TRABAJADOR' THEN 'PAGO_TRABAJADOR'
          WHEN 'PAGO_PROVEEDORES' THEN 'PAGO_PROVEEDOR'
          WHEN 'OTRO_INGRESO' THEN 'OTRO_INGRESO'
          WHEN 'OTRO_EGRESO' THEN 'OTRO_EGRESO'
          ELSE 'AJUSTE'
        END
      )::categoria_mov_financiero;

    ALTER TABLE movimientos_cajas_banco
      ALTER COLUMN categoria SET NOT NULL;
  ELSIF tipo_categoria IS NULL THEN
    ALTER TABLE movimientos_cajas_banco
      ADD COLUMN categoria categoria_mov_financiero;
  END IF;
END;
$$;

ALTER TABLE movimientos_cajas_banco
  ADD COLUMN IF NOT EXISTS origen origen_mov,
  ADD COLUMN IF NOT EXISTS referencia_tipo VARCHAR(50),
  ADD COLUMN IF NOT EXISTS referencia_id INTEGER,
  ADD COLUMN IF NOT EXISTS referencia_codigo VARCHAR(100),
  ADD COLUMN IF NOT EXISTS operacion_id UUID,
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255),
  ADD COLUMN IF NOT EXISTS movimiento_revertido_id INTEGER,
  ADD COLUMN IF NOT EXISTS motivo TEXT,
  ADD COLUMN IF NOT EXISTS observacion TEXT,
  ADD COLUMN IF NOT EXISTS trace_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS fecha_operacion TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS afecta_flujo_operativo BOOLEAN DEFAULT TRUE;

UPDATE movimientos_cajas_banco
SET
  origen = COALESCE(origen, 'MIGRACION'::origen_mov),
  referencia_tipo = COALESCE(
    referencia_tipo,
    CASE WHEN venta_id IS NOT NULL THEN 'FACTURA' ELSE 'MOVIMIENTO_LEGACY' END
  ),
  referencia_id = COALESCE(referencia_id, venta_id),
  operacion_id = COALESCE(
    operacion_id,
    MD5('MIGRACION-BANCO-' || id::TEXT)::UUID
  ),
  idempotency_key = COALESCE(
    idempotency_key,
    'MIGRACION:BANCO:' || id::TEXT
  ),
  observacion = COALESCE(observacion, descripcion),
  fecha_operacion = COALESCE(fecha_operacion, fecha, created_at, NOW()),
  afecta_flujo_operativo = COALESCE(afecta_flujo_operativo, TRUE);

ALTER TABLE movimientos_cajas_banco
  ALTER COLUMN fecha_operacion SET DEFAULT NOW(),
  ALTER COLUMN fecha_operacion SET NOT NULL,
  ALTER COLUMN afecta_flujo_operativo SET NOT NULL;

ALTER TABLE movimientos_cajas_banco
  DROP CONSTRAINT IF EXISTS movimientos_cajas_banco_caja_banco_id_fkey;

ALTER TABLE movimientos_cajas_banco
  DROP CONSTRAINT IF EXISTS fk_mov_banco_caja_banco;

ALTER TABLE movimientos_cajas_banco
  ADD CONSTRAINT fk_mov_banco_caja_banco
    FOREIGN KEY (caja_banco_id)
    REFERENCES cajas_banco(id)
    ON DELETE RESTRICT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'movimientos_cajas_banco'::regclass
      AND conname = 'fk_mov_banco_revertido'
  ) THEN
    ALTER TABLE movimientos_cajas_banco
      ADD CONSTRAINT fk_mov_banco_revertido
      FOREIGN KEY (movimiento_revertido_id)
      REFERENCES movimientos_cajas_banco(id)
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'movimientos_cajas_banco'::regclass
      AND conname = 'ck_mov_banco_monto_positivo'
  ) THEN
    ALTER TABLE movimientos_cajas_banco
      ADD CONSTRAINT ck_mov_banco_monto_positivo
      CHECK (monto > 0)
      NOT VALID;
  END IF;
END;
$$;

ALTER TABLE movimientos_cajas_banco
  VALIDATE CONSTRAINT ck_mov_banco_monto_positivo;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mov_banco_idempotency
  ON movimientos_cajas_banco (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mov_banco_reversion
  ON movimientos_cajas_banco (movimiento_revertido_id)
  WHERE movimiento_revertido_id IS NOT NULL;

ALTER TABLE movimientos_cajas_chicas
  ADD COLUMN IF NOT EXISTS categoria categoria_mov_financiero,
  ADD COLUMN IF NOT EXISTS origen origen_mov,
  ADD COLUMN IF NOT EXISTS referencia_tipo VARCHAR(50),
  ADD COLUMN IF NOT EXISTS referencia_id INTEGER,
  ADD COLUMN IF NOT EXISTS referencia_codigo VARCHAR(100),
  ADD COLUMN IF NOT EXISTS operacion_id UUID,
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255),
  ADD COLUMN IF NOT EXISTS movimiento_revertido_id INTEGER,
  ADD COLUMN IF NOT EXISTS motivo TEXT,
  ADD COLUMN IF NOT EXISTS observacion TEXT,
  ADD COLUMN IF NOT EXISTS trace_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS fecha_operacion TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS afecta_flujo_operativo BOOLEAN DEFAULT TRUE;

UPDATE movimientos_cajas_chicas
SET
  categoria = COALESCE(
    categoria,
    CASE tipo
      WHEN 'INGRESO' THEN 'OTRO_INGRESO'::categoria_mov_financiero
      WHEN 'EGRESO' THEN 'OTRO_EGRESO'::categoria_mov_financiero
    END
  ),
  origen = COALESCE(origen, 'MIGRACION'::origen_mov),
  referencia_tipo = COALESCE(
    referencia_tipo,
    CASE WHEN factura_id IS NOT NULL THEN 'FACTURA' ELSE 'MOVIMIENTO_LEGACY' END
  ),
  referencia_id = COALESCE(referencia_id, factura_id),
  referencia_codigo = COALESCE(referencia_codigo, referencia),
  operacion_id = COALESCE(
    operacion_id,
    MD5('MIGRACION-CHICA-' || id::TEXT)::UUID
  ),
  idempotency_key = COALESCE(
    idempotency_key,
    'MIGRACION:CHICA:' || id::TEXT
  ),
  observacion = COALESCE(observacion, descripcion),
  fecha_operacion = COALESCE(fecha_operacion, fecha, created_at, NOW()),
  afecta_flujo_operativo = COALESCE(afecta_flujo_operativo, TRUE);

ALTER TABLE movimientos_cajas_chicas
  ALTER COLUMN fecha_operacion SET DEFAULT NOW(),
  ALTER COLUMN fecha_operacion SET NOT NULL,
  ALTER COLUMN afecta_flujo_operativo SET NOT NULL;

ALTER TABLE movimientos_cajas_chicas
  DROP CONSTRAINT IF EXISTS movimientos_cajas_chicas_caja_chica_id_fkey;

ALTER TABLE movimientos_cajas_chicas
  DROP CONSTRAINT IF EXISTS fk_mov_chica_caja_chica;

ALTER TABLE movimientos_cajas_chicas
  ADD CONSTRAINT fk_mov_chica_caja_chica
    FOREIGN KEY (caja_chica_id)
    REFERENCES cajas_chicas(id)
    ON DELETE RESTRICT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'movimientos_cajas_chicas'::regclass
      AND conname = 'fk_mov_chica_revertido'
  ) THEN
    ALTER TABLE movimientos_cajas_chicas
      ADD CONSTRAINT fk_mov_chica_revertido
      FOREIGN KEY (movimiento_revertido_id)
      REFERENCES movimientos_cajas_chicas(id)
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'movimientos_cajas_chicas'::regclass
      AND conname = 'ck_mov_chica_monto_positivo'
  ) THEN
    ALTER TABLE movimientos_cajas_chicas
      ADD CONSTRAINT ck_mov_chica_monto_positivo
      CHECK (monto > 0)
      NOT VALID;
  END IF;
END;
$$;

ALTER TABLE movimientos_cajas_chicas
  VALIDATE CONSTRAINT ck_mov_chica_monto_positivo;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mov_chica_idempotency
  ON movimientos_cajas_chicas (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mov_chica_reversion
  ON movimientos_cajas_chicas (movimiento_revertido_id)
  WHERE movimiento_revertido_id IS NOT NULL;

UPDATE cajas_banco
SET
  ingresos_acumulados = 0,
  egresos_acumulados = 0,
  total_movimientos = 0;

WITH resumen AS (
  SELECT
    caja_banco_id,
    COALESCE(
      SUM(monto) FILTER (
        WHERE tipo = 'INGRESO'
          AND afecta_flujo_operativo = TRUE
      ),
      0
    ) AS ingresos,
    COALESCE(
      SUM(monto) FILTER (
        WHERE tipo = 'EGRESO'
          AND afecta_flujo_operativo = TRUE
      ),
      0
    ) AS egresos,
    COUNT(*) AS movimientos
  FROM movimientos_cajas_banco
  GROUP BY caja_banco_id
)
UPDATE cajas_banco AS caja
SET
  ingresos_acumulados = resumen.ingresos,
  egresos_acumulados = resumen.egresos,
  total_movimientos = resumen.movimientos
FROM resumen
WHERE caja.id = resumen.caja_banco_id;

UPDATE cajas_chicas
SET
  ingresos_acumulados = 0,
  egresos_acumulados = 0,
  total_movimientos = 0;

WITH resumen AS (
  SELECT
    caja_chica_id,
    COALESCE(
      SUM(monto) FILTER (
        WHERE tipo = 'INGRESO'
          AND afecta_flujo_operativo = TRUE
      ),
      0
    ) AS ingresos,
    COALESCE(
      SUM(monto) FILTER (
        WHERE tipo = 'EGRESO'
          AND afecta_flujo_operativo = TRUE
      ),
      0
    ) AS egresos,
    COUNT(*) AS movimientos
  FROM movimientos_cajas_chicas
  GROUP BY caja_chica_id
)
UPDATE cajas_chicas AS caja
SET
  ingresos_acumulados = resumen.ingresos,
  egresos_acumulados = resumen.egresos,
  total_movimientos = resumen.movimientos
FROM resumen
WHERE caja.id = resumen.caja_chica_id;

CREATE OR REPLACE FUNCTION bloquear_modificacion_movimiento()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Los movimientos son inmutables';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_no_update_mov_banco
  BEFORE UPDATE ON movimientos_cajas_banco
  FOR EACH ROW
  EXECUTE FUNCTION bloquear_modificacion_movimiento();

CREATE TRIGGER trg_no_delete_mov_banco
  BEFORE DELETE ON movimientos_cajas_banco
  FOR EACH ROW
  EXECUTE FUNCTION bloquear_modificacion_movimiento();

CREATE TRIGGER trg_no_update_mov_chica
  BEFORE UPDATE ON movimientos_cajas_chicas
  FOR EACH ROW
  EXECUTE FUNCTION bloquear_modificacion_movimiento();

CREATE TRIGGER trg_no_delete_mov_chica
  BEFORE DELETE ON movimientos_cajas_chicas
  FOR EACH ROW
  EXECUTE FUNCTION bloquear_modificacion_movimiento();

COMMIT;
