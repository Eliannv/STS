-- caja-servicio/sql/03_cuentas_cobrar.sql
BEGIN;

ALTER TABLE cuentas
  ADD COLUMN IF NOT EXISTS origen VARCHAR(50),
  ADD COLUMN IF NOT EXISTS referencia_tipo VARCHAR(50),
  ADD COLUMN IF NOT EXISTS referencia_id INTEGER,
  ADD COLUMN IF NOT EXISTS referencia_codigo VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tercero_tipo VARCHAR(50),
  ADD COLUMN IF NOT EXISTS fecha_emision DATE,
  ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE,
  ADD COLUMN IF NOT EXISTS moneda VARCHAR(10) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS usuario_nombre VARCHAR(150),
  ADD COLUMN IF NOT EXISTS operacion_id UUID,
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);

DO $$
DECLARE
  existe_tipo BOOLEAN;
  contiene_estados_legacy BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'estado_cuenta'
  )
  INTO existe_tipo;

  IF existe_tipo THEN
    SELECT EXISTS (
      SELECT 1
      FROM pg_type AS tipo
      JOIN pg_enum AS valor
        ON valor.enumtypid = tipo.oid
      WHERE tipo.typname = 'estado_cuenta'
        AND valor.enumlabel IN ('ACTIVA', 'CANCELADA')
    )
    INTO contiene_estados_legacy;

    IF contiene_estados_legacy THEN
      EXECUTE $sql$
        CREATE TYPE estado_cuenta_nuevo AS ENUM (
          'PENDIENTE',
          'PARCIAL',
          'PAGADA',
          'VENCIDA',
          'ANULADA'
        )
      $sql$;

      ALTER TABLE cuentas
        ALTER COLUMN estado DROP DEFAULT;

      EXECUTE $sql$
        ALTER TABLE cuentas
        ALTER COLUMN estado TYPE estado_cuenta_nuevo
        USING (
          CASE estado::TEXT
            WHEN 'ACTIVA' THEN 'PENDIENTE'
            WHEN 'CANCELADA' THEN 'ANULADA'
            WHEN 'PENDIENTE' THEN 'PENDIENTE'
            WHEN 'PARCIAL' THEN 'PARCIAL'
            WHEN 'PAGADA' THEN 'PAGADA'
            WHEN 'VENCIDA' THEN 'VENCIDA'
            WHEN 'ANULADA' THEN 'ANULADA'
            ELSE 'PENDIENTE'
          END
        )::estado_cuenta_nuevo
      $sql$;

      DROP TYPE estado_cuenta;
      ALTER TYPE estado_cuenta_nuevo RENAME TO estado_cuenta;
    END IF;
  ELSE
    EXECUTE $sql$
      CREATE TYPE estado_cuenta AS ENUM (
        'PENDIENTE',
        'PARCIAL',
        'PAGADA',
        'VENCIDA',
        'ANULADA'
      )
    $sql$;

    ALTER TABLE cuentas
      ALTER COLUMN estado DROP DEFAULT;

    EXECUTE $sql$
      ALTER TABLE cuentas
      ALTER COLUMN estado TYPE estado_cuenta
      USING (
        CASE estado::TEXT
          WHEN 'ACTIVA' THEN 'PENDIENTE'
          WHEN 'CANCELADA' THEN 'ANULADA'
          WHEN 'PENDIENTE' THEN 'PENDIENTE'
          WHEN 'PARCIAL' THEN 'PARCIAL'
          WHEN 'PAGADA' THEN 'PAGADA'
          WHEN 'VENCIDA' THEN 'VENCIDA'
          WHEN 'ANULADA' THEN 'ANULADA'
          ELSE 'PENDIENTE'
        END
      )::estado_cuenta
    $sql$;
  END IF;
END;
$$;

ALTER TABLE cuentas
  ALTER COLUMN estado SET DEFAULT 'PENDIENTE'::estado_cuenta;

UPDATE cuentas
SET
  fecha_emision = COALESCE(fecha_emision, fecha),
  moneda = COALESCE(moneda, 'USD'),
  origen = COALESCE(origen, 'MIGRACION'),
  tercero_tipo = COALESCE(tercero_tipo, 'CLIENTE');

CREATE TABLE IF NOT EXISTS movimientos_cuentas (
  id SERIAL PRIMARY KEY,
  cuenta_id INTEGER NOT NULL
    REFERENCES cuentas(id)
    ON DELETE RESTRICT,
  tipo_movimiento VARCHAR(20) NOT NULL
    CHECK (
      tipo_movimiento IN (
        'CREACION',
        'ABONO',
        'PAGO',
        'AJUSTE',
        'ANULACION',
        'REVERSO'
      )
    ),
  monto NUMERIC(14,2) NOT NULL
    CHECK (monto > 0),
  saldo_anterior NUMERIC(14,2) NOT NULL,
  saldo_nuevo NUMERIC(14,2) NOT NULL,
  metodo_pago VARCHAR(30),
  caja_tipo VARCHAR(10)
    CHECK (
      caja_tipo IS NULL
      OR caja_tipo IN ('BANCO', 'CHICA')
    ),
  caja_id INTEGER,
  movimiento_financiero_id INTEGER,
  referencia_tipo VARCHAR(50),
  referencia_id INTEGER,
  referencia_codigo VARCHAR(100),
  operacion_id UUID,
  idempotency_key VARCHAR(255) UNIQUE,
  movimiento_revertido_id INTEGER
    REFERENCES movimientos_cuentas(id)
    ON DELETE RESTRICT,
  motivo TEXT,
  observacion TEXT,
  trace_id VARCHAR(100),
  usuario_id INTEGER,
  usuario_nombre VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION bloquear_modificacion_movimiento()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Los movimientos son inmutables';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_no_update_mov_cuenta
  ON movimientos_cuentas;

DROP TRIGGER IF EXISTS trg_no_delete_mov_cuenta
  ON movimientos_cuentas;

CREATE TRIGGER trg_no_update_mov_cuenta
  BEFORE UPDATE ON movimientos_cuentas
  FOR EACH ROW
  EXECUTE FUNCTION bloquear_modificacion_movimiento();

CREATE TRIGGER trg_no_delete_mov_cuenta
  BEFORE DELETE ON movimientos_cuentas
  FOR EACH ROW
  EXECUTE FUNCTION bloquear_modificacion_movimiento();

CREATE INDEX IF NOT EXISTS idx_mov_cuentas_cuenta
  ON movimientos_cuentas (cuenta_id);

CREATE INDEX IF NOT EXISTS idx_mov_cuentas_operacion
  ON movimientos_cuentas (operacion_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_mov_cuentas_idempotency
  ON movimientos_cuentas (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mov_cuentas_reversion
  ON movimientos_cuentas (movimiento_revertido_id)
  WHERE movimiento_revertido_id IS NOT NULL;

COMMIT;
