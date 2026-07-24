-- caja-servicio/sql/05_cuentas_pagar_compras.sql
BEGIN;

ALTER TYPE categoria_mov_financiero
  ADD VALUE IF NOT EXISTS 'DEVOLUCION_PROVEEDOR';

ALTER TYPE origen_mov
  ADD VALUE IF NOT EXISTS 'INVENTARIO';

ALTER TYPE origen_mov
  ADD VALUE IF NOT EXISTS 'CUENTA_PAGAR';

CREATE UNIQUE INDEX IF NOT EXISTS uq_cuentas_operacion
  ON cuentas (operacion_id)
  WHERE operacion_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_cuentas_idempotency
  ON cuentas (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cuentas_tipo_estado
  ON cuentas (tipo, estado, fecha_vencimiento);

CREATE INDEX IF NOT EXISTS idx_cuentas_referencia
  ON cuentas (referencia_tipo, referencia_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'cuentas'::regclass
      AND conname = 'chk_cuentas_tipo_pagar'
  ) THEN
    ALTER TABLE cuentas
      ADD CONSTRAINT chk_cuentas_tipo_pagar
      CHECK (
        (
          tipo = 'PAGAR'
          AND tipo_cuenta_por_pagar IS NOT NULL
        )
        OR (
          tipo = 'COBRAR'
          AND tipo_cuenta_por_pagar IS NULL
        )
      )
      NOT VALID;
  END IF;
END;
$$;

COMMIT;
