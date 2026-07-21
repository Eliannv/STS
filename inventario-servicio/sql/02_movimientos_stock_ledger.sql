DO $$ BEGIN
  CREATE TYPE naturaleza_movimiento_stock AS ENUM ('ENTRADA','SALIDA','NEUTRO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_kardex_stock AS ENUM ('INVENTARIO_INICIAL','COMPRA','VENTA','DEVOLUCION_CLIENTE','DEVOLUCION_PROVEEDOR','EGRESO','AJUSTE','TRANSFERENCIA_ENTRADA','TRANSFERENCIA_SALIDA','ANULACION_VENTA','ANULACION_COMPRA','ANULACION_EGRESO','REVALORIZACION','COMPENSACION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE estado_ingreso ADD VALUE IF NOT EXISTS 'ANULADO';

DROP TRIGGER IF EXISTS trg_movimientos_stock_inmutables ON movimientos_stock;

ALTER TABLE movimientos_stock
  DROP CONSTRAINT IF EXISTS movimientos_stock_producto_id_fkey;

ALTER TABLE movimientos_stock
  ADD CONSTRAINT movimientos_stock_producto_id_fkey
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT;

ALTER TABLE movimientos_stock
  ADD COLUMN IF NOT EXISTS producto_codigo VARCHAR(50),
  ADD COLUMN IF NOT EXISTS sucursal_nombre VARCHAR(100),
  ADD COLUMN IF NOT EXISTS naturaleza naturaleza_movimiento_stock,
  ADD COLUMN IF NOT EXISTS tipo_movimiento tipo_kardex_stock,
  ADD COLUMN IF NOT EXISTS origen VARCHAR(30),
  ADD COLUMN IF NOT EXISTS costo_promedio_anterior NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS costo_promedio_nuevo NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS referencia_codigo VARCHAR(50),
  ADD COLUMN IF NOT EXISTS usuario_id INTEGER,
  ADD COLUMN IF NOT EXISTS usuario_nombre VARCHAR(150),
  ADD COLUMN IF NOT EXISTS fecha_operacion TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS operacion_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(180),
  ADD COLUMN IF NOT EXISTS movimiento_revertido_id INTEGER REFERENCES movimientos_stock(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS motivo VARCHAR(150),
  ADD COLUMN IF NOT EXISTS trace_id VARCHAR(100);

UPDATE movimientos_stock SET
  naturaleza = CASE
    WHEN tipo IN ('INGRESO','ANULACION','COMPRA_EDITADA') THEN 'ENTRADA'::naturaleza_movimiento_stock
    WHEN tipo IN ('VENTA NORMAL','VENTA','SALIDA','ELIMINACION','VENTA_EDITADA') THEN 'SALIDA'::naturaleza_movimiento_stock
    ELSE 'NEUTRO'::naturaleza_movimiento_stock
  END,
  tipo_movimiento = CASE
    WHEN tipo = 'INGRESO' THEN 'COMPRA'::tipo_kardex_stock
    WHEN tipo IN ('VENTA NORMAL','VENTA','VENTA_EDITADA') THEN 'VENTA'::tipo_kardex_stock
    WHEN tipo IN ('SALIDA','ELIMINACION') THEN 'EGRESO'::tipo_kardex_stock
    WHEN tipo = 'ANULACION' THEN 'ANULACION_VENTA'::tipo_kardex_stock
    ELSE 'AJUSTE'::tipo_kardex_stock
  END,
  origen = COALESCE(origen, 'MIGRACION'),
  fecha_operacion = COALESCE(fecha_operacion, created_at, NOW()),
  operacion_id = COALESCE(operacion_id, 'LEGACY-' || id),
  idempotency_key = COALESCE(idempotency_key, 'LEGACY-MOVIMIENTO-' || id)
WHERE naturaleza IS NULL OR tipo_movimiento IS NULL OR origen IS NULL
   OR fecha_operacion IS NULL OR operacion_id IS NULL OR idempotency_key IS NULL;

UPDATE movimientos_stock movimiento
SET producto_codigo = COALESCE(movimiento.producto_codigo, producto.codigo),
    producto_nombre = COALESCE(movimiento.producto_nombre, producto.nombre),
    grupo_producto = COALESCE(movimiento.grupo_producto, producto.grupo)
FROM productos producto
WHERE producto.id = movimiento.producto_id
  AND (movimiento.producto_codigo IS NULL OR movimiento.producto_nombre IS NULL OR movimiento.grupo_producto IS NULL);

ALTER TABLE movimientos_stock
  ALTER COLUMN naturaleza SET NOT NULL,
  ALTER COLUMN tipo_movimiento SET NOT NULL,
  ALTER COLUMN origen SET NOT NULL,
  ALTER COLUMN fecha_operacion SET NOT NULL,
  ALTER COLUMN operacion_id SET NOT NULL,
  ALTER COLUMN idempotency_key SET NOT NULL;

UPDATE movimientos_stock
SET cantidad = GREATEST(ABS(cantidad), 1)
WHERE cantidad <= 0;

INSERT INTO movimientos_stock (
  producto_id,
  producto_codigo,
  producto_nombre,
  grupo_producto,
  tipo,
  naturaleza,
  tipo_movimiento,
  origen,
  cantidad,
  costo_unitario,
  precio_venta,
  costo_promedio_anterior,
  costo_promedio_nuevo,
  stock_anterior,
  stock_nuevo,
  referencia_id,
  referencia_tipo,
  referencia_codigo,
  fecha_operacion,
  operacion_id,
  idempotency_key,
  motivo,
  observacion,
  created_at
)
SELECT
  producto.id,
  producto.codigo,
  producto.nombre,
  producto.grupo,
  'INGRESO'::tipo_movimiento_stock,
  'ENTRADA'::naturaleza_movimiento_stock,
  'INVENTARIO_INICIAL'::tipo_kardex_stock,
  'MIGRACION',
  producto.stock,
  COALESCE(producto.costo, 0),
  COALESCE(producto.pvp1, 0),
  COALESCE(producto.costo, 0),
  COALESCE(producto.costo, 0),
  0,
  producto.stock,
  producto.id,
  'PRODUCTO',
  producto.codigo,
  NOW(),
  'MIGRACION-INVENTARIO-INICIAL-' || producto.id,
  'MIGRACION-INVENTARIO-INICIAL-' || producto.id,
  'Saldo de apertura del ledger',
  'Asiento generado al activar el Kardex inmutable',
  NOW()
FROM productos producto
WHERE producto.stock > 0
  AND producto.tipo_control_stock <> 'ILIMITADO'
  AND NOT EXISTS (
    SELECT 1
    FROM movimientos_stock movimiento
    WHERE movimiento.producto_id = producto.id
  );

CREATE INDEX IF NOT EXISTS idx_movimientos_sucursal ON movimientos_stock (sucursal_id, fecha_operacion DESC);
CREATE INDEX IF NOT EXISTS idx_movimientos_referencia ON movimientos_stock (referencia_tipo, referencia_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_operacion ON movimientos_stock (operacion_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_movimientos_idempotency ON movimientos_stock (idempotency_key);
CREATE UNIQUE INDEX IF NOT EXISTS uq_movimiento_reversion ON movimientos_stock (movimiento_revertido_id) WHERE movimiento_revertido_id IS NOT NULL;

DO $$ BEGIN
  ALTER TABLE movimientos_stock
    ADD CONSTRAINT chk_movimiento_cantidad_positiva CHECK (cantidad > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE movimientos_stock
    ADD CONSTRAINT chk_movimiento_stock_no_negativo CHECK (stock_anterior >= 0 AND stock_nuevo >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION impedir_mutacion_movimiento_stock() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'movimientos_stock es un ledger inmutable; registre un movimiento compensatorio';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_movimientos_stock_inmutables ON movimientos_stock;
CREATE TRIGGER trg_movimientos_stock_inmutables
BEFORE UPDATE OR DELETE ON movimientos_stock
FOR EACH ROW EXECUTE FUNCTION impedir_mutacion_movimiento_stock();

CREATE OR REPLACE FUNCTION impedir_stock_fuera_ledger() RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('app.movimiento_stock_autorizado', TRUE) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'El stock y costo del producto solo pueden cambiar mediante el servicio de movimientos';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_productos_stock_solo_ledger ON productos;
CREATE TRIGGER trg_productos_stock_solo_ledger
BEFORE UPDATE OF stock, costo ON productos
FOR EACH ROW
WHEN (OLD.stock IS DISTINCT FROM NEW.stock OR OLD.costo IS DISTINCT FROM NEW.costo)
EXECUTE FUNCTION impedir_stock_fuera_ledger();
