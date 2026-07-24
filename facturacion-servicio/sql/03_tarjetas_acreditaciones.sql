-- facturacion-servicio/sql/03_tarjetas_acreditaciones.sql
BEGIN;

DO $$
DECLARE
  tiene_legacy BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_type AS tipo
    JOIN pg_enum AS valor ON valor.enumtypid = tipo.oid
    WHERE tipo.typname = 'estado_venta_tarjeta'
      AND valor.enumlabel = 'LEGACY_LIQUIDADA'
  )
  INTO tiene_legacy;

  IF NOT tiene_legacy THEN
    CREATE TYPE estado_venta_tarjeta_nuevo AS ENUM (
      'PENDIENTE',
      'PROCESANDO',
      'PARCIALMENTE_ACREDITADA',
      'ACREDITADA',
      'RECHAZADA',
      'ANULADA',
      'LEGACY_LIQUIDADA'
    );

    ALTER TABLE ventas_tarjeta
      ALTER COLUMN estado DROP DEFAULT;

    ALTER TABLE ventas_tarjeta
      ALTER COLUMN estado TYPE estado_venta_tarjeta_nuevo
      USING (
        CASE estado::TEXT
          WHEN 'LIQUIDADA' THEN 'LEGACY_LIQUIDADA'
          WHEN 'PENDIENTE' THEN 'PENDIENTE'
          WHEN 'PROCESANDO' THEN 'PROCESANDO'
          WHEN 'PARCIALMENTE_ACREDITADA' THEN 'PARCIALMENTE_ACREDITADA'
          WHEN 'ACREDITADA' THEN 'ACREDITADA'
          WHEN 'RECHAZADA' THEN 'RECHAZADA'
          WHEN 'ANULADA' THEN 'ANULADA'
          WHEN 'LEGACY_LIQUIDADA' THEN 'LEGACY_LIQUIDADA'
          ELSE 'PENDIENTE'
        END
      )::estado_venta_tarjeta_nuevo;

    DROP TYPE estado_venta_tarjeta;
    ALTER TYPE estado_venta_tarjeta_nuevo RENAME TO estado_venta_tarjeta;
  END IF;
END;
$$;

ALTER TABLE ventas_tarjeta
  ALTER COLUMN estado SET DEFAULT 'PENDIENTE'::estado_venta_tarjeta,
  ADD COLUMN IF NOT EXISTS fecha_ultima_acreditacion TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS comision_acumulada NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retencion_acumulada NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monto_bruto_acreditado NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monto_neto_acreditado NUMERIC(14,2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  CREATE TYPE estado_abono_venta_tarjeta AS ENUM (
    'PENDIENTE',
    'APLICADO',
    'ERROR',
    'REVERTIDO'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

ALTER TABLE abonos_ventas_tarjeta
  ADD COLUMN IF NOT EXISTS monto_bruto NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS comision NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retencion NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monto_neto NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS banco VARCHAR(80),
  ADD COLUMN IF NOT EXISTS numero_lote VARCHAR(50),
  ADD COLUMN IF NOT EXISTS numero_autorizacion VARCHAR(100),
  ADD COLUMN IF NOT EXISTS voucher VARCHAR(100),
  ADD COLUMN IF NOT EXISTS fecha_acreditacion TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cuenta_banco_id INTEGER,
  ADD COLUMN IF NOT EXISTS operacion_id UUID,
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255),
  ADD COLUMN IF NOT EXISTS usuario_id INTEGER,
  ADD COLUMN IF NOT EXISTS usuario_nombre VARCHAR(150),
  ADD COLUMN IF NOT EXISTS trace_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS estado estado_abono_venta_tarjeta;

ALTER TABLE abonos_ventas_tarjeta
  ALTER COLUMN estado SET DEFAULT 'PENDIENTE'::estado_abono_venta_tarjeta;

ALTER TABLE abonos_ventas_tarjeta
  DROP CONSTRAINT IF EXISTS abonos_ventas_tarjeta_venta_tarjeta_id_fkey;

ALTER TABLE abonos_ventas_tarjeta
  ADD CONSTRAINT abonos_ventas_tarjeta_venta_tarjeta_id_fkey
  FOREIGN KEY (venta_tarjeta_id)
  REFERENCES ventas_tarjeta(id)
  ON DELETE RESTRICT;

ALTER TABLE abonos_ventas_tarjeta
  DROP CONSTRAINT IF EXISTS chk_abono_tarjeta_montos;

ALTER TABLE abonos_ventas_tarjeta
  ADD CONSTRAINT chk_abono_tarjeta_montos
  CHECK (
    monto_bruto > 0
    AND comision >= 0
    AND retencion >= 0
    AND monto_bruto >= comision + retencion
    AND monto_neto = monto_bruto - comision - retencion
  );

CREATE UNIQUE INDEX IF NOT EXISTS uq_abono_tarjeta_idempotency
  ON abonos_ventas_tarjeta (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_abono_tarjeta_operacion
  ON abonos_ventas_tarjeta (operacion_id);

CREATE INDEX IF NOT EXISTS idx_abono_tarjeta_estado
  ON abonos_ventas_tarjeta (estado, fecha_acreditacion);

CREATE OR REPLACE FUNCTION controlar_inmutabilidad_abono_tarjeta()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Las acreditaciones de tarjeta son inmutables';
  END IF;

  IF (TO_JSONB(NEW) - 'estado') IS DISTINCT FROM (TO_JSONB(OLD) - 'estado') THEN
    RAISE EXCEPTION 'Los datos financieros de una acreditación son inmutables';
  END IF;

  IF NOT (
    NEW.estado = OLD.estado
    OR (OLD.estado = 'PENDIENTE' AND NEW.estado IN ('APLICADO', 'ERROR'))
    OR (OLD.estado = 'ERROR' AND NEW.estado IN ('PENDIENTE', 'APLICADO'))
    OR (OLD.estado = 'APLICADO' AND NEW.estado = 'REVERTIDO')
  ) THEN
    RAISE EXCEPTION 'Transición de estado de acreditación no permitida';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_controlar_update_abono_tarjeta
  ON abonos_ventas_tarjeta;

DROP TRIGGER IF EXISTS trg_no_delete_abono_tarjeta
  ON abonos_ventas_tarjeta;

CREATE TRIGGER trg_controlar_update_abono_tarjeta
  BEFORE UPDATE ON abonos_ventas_tarjeta
  FOR EACH ROW
  EXECUTE FUNCTION controlar_inmutabilidad_abono_tarjeta();

CREATE TRIGGER trg_no_delete_abono_tarjeta
  BEFORE DELETE ON abonos_ventas_tarjeta
  FOR EACH ROW
  EXECUTE FUNCTION controlar_inmutabilidad_abono_tarjeta();

ALTER TABLE operaciones_financieras
  DROP CONSTRAINT IF EXISTS operaciones_financieras_operacion_id_key,
  DROP CONSTRAINT IF EXISTS operaciones_financieras_tipo_check;

ALTER TABLE operaciones_financieras
  ADD CONSTRAINT operaciones_financieras_tipo_check
  CHECK (
    tipo IN (
      'VENTA_EFECTIVO',
      'VENTA_TRANSFERENCIA',
      'VENTA_CREDITO',
      'VENTA_MIXTA',
      'COBRO_EFECTIVO',
      'COBRO_TRANSFERENCIA',
      'ACREDITACION_TARJETA',
      'ANULACION_VENTA',
      'ANULACION_COBRO',
      'CANCELACION_CUENTA'
    )
  );

COMMIT;
