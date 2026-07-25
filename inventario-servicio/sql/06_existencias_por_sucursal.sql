-- inventario-servicio/sql/06_existencias_por_sucursal.sql
-- Convierte el stock global en stock por sucursal.
-- productos.stock pasa a ser un total derivado: la verdad vive en existencias.
BEGIN;

CREATE TABLE IF NOT EXISTS existencias (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  sucursal_id INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  costo_promedio NUMERIC(14,4) NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_existencias_producto_sucursal UNIQUE (producto_id, sucursal_id),
  CONSTRAINT chk_existencias_stock_no_negativo CHECK (stock >= 0),
  CONSTRAINT chk_existencias_costo_no_negativo CHECK (costo_promedio >= 0)
);

CREATE INDEX IF NOT EXISTS idx_existencias_sucursal ON existencias (sucursal_id, producto_id);
CREATE INDEX IF NOT EXISTS idx_existencias_producto ON existencias (producto_id);

-- inventario_db no conoce el catálogo de sucursales (vive en usuario_db).
-- La matriz se deduce del menor sucursal_id ya presente en los datos; si no hay
-- ninguno, se asume 1, que es la primera sucursal creada por usuario-servicio.
CREATE OR REPLACE FUNCTION sucursal_matriz_inventario() RETURNS INTEGER LANGUAGE SQL STABLE AS $$
  SELECT COALESCE(
    (SELECT MIN(sucursal_id) FROM existencias),
    (SELECT MIN(sucursal_id) FROM movimientos_stock WHERE sucursal_id IS NOT NULL),
    (SELECT MIN(sucursal_id) FROM egresos_mercaderia WHERE sucursal_id IS NOT NULL),
    1
  )
$$;

-- Los movimientos históricos quedaron sin sucursal por el usuario administrador
-- sin asignar; se adoptan en la matriz para que el kardex cuadre con existencias.
-- El ledger es inmutable, así que se levanta la protección solo durante el backfill.
DROP TRIGGER IF EXISTS trg_movimientos_stock_inmutables ON movimientos_stock;

UPDATE movimientos_stock SET sucursal_id = sucursal_matriz_inventario() WHERE sucursal_id IS NULL;
UPDATE egresos_mercaderia SET sucursal_id = sucursal_matriz_inventario() WHERE sucursal_id IS NULL;

CREATE TRIGGER trg_movimientos_stock_inmutables
BEFORE UPDATE OR DELETE ON movimientos_stock
FOR EACH ROW EXECUTE FUNCTION impedir_mutacion_movimiento_stock();

-- A partir de aquí ningún movimiento puede quedar sin sucursal.
ALTER TABLE movimientos_stock DROP CONSTRAINT IF EXISTS chk_movimientos_sucursal_requerida;
ALTER TABLE movimientos_stock
  ADD CONSTRAINT chk_movimientos_sucursal_requerida CHECK (sucursal_id IS NOT NULL) NOT VALID;
ALTER TABLE movimientos_stock VALIDATE CONSTRAINT chk_movimientos_sucursal_requerida;

-- Las existencias solo pueden moverse a través del ledger de movimientos,
-- igual que ya ocurría con productos.stock.
CREATE OR REPLACE FUNCTION impedir_existencia_fuera_ledger() RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('app.movimiento_stock_autorizado', TRUE) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Las existencias solo pueden cambiar mediante el servicio de movimientos';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_existencias_solo_ledger ON existencias;
CREATE TRIGGER trg_existencias_solo_ledger
BEFORE UPDATE OF stock, costo_promedio ON existencias
FOR EACH ROW
WHEN (OLD.stock IS DISTINCT FROM NEW.stock OR OLD.costo_promedio IS DISTINCT FROM NEW.costo_promedio)
EXECUTE FUNCTION impedir_existencia_fuera_ledger();

-- productos.stock y productos.costo se mantienen como agregados derivados para no
-- romper listados, reportes y valorizaciones que ya los consultan.
CREATE OR REPLACE FUNCTION sincronizar_total_producto() RETURNS TRIGGER AS $$
DECLARE
  objetivo INTEGER := COALESCE(NEW.producto_id, OLD.producto_id);
  total_stock INTEGER;
  costo_ponderado NUMERIC(14,4);
  autorizacion_previa TEXT;
BEGIN
  SELECT COALESCE(SUM(stock), 0),
         CASE WHEN COALESCE(SUM(stock), 0) > 0
              THEN ROUND(SUM(stock * costo_promedio) / SUM(stock), 4)
              ELSE MAX(costo_promedio) END
  INTO total_stock, costo_ponderado
  FROM existencias WHERE producto_id = objetivo;

  autorizacion_previa := current_setting('app.movimiento_stock_autorizado', TRUE);
  PERFORM set_config('app.movimiento_stock_autorizado', 'true', TRUE);
  UPDATE productos
  SET stock = total_stock,
      costo = COALESCE(costo_ponderado, costo),
      updated_at = NOW()
  WHERE id = objetivo;
  PERFORM set_config('app.movimiento_stock_autorizado', COALESCE(autorizacion_previa, 'false'), TRUE);

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_existencias_sincroniza_producto ON existencias;
CREATE TRIGGER trg_existencias_sincroniza_producto
AFTER INSERT OR UPDATE OR DELETE ON existencias
FOR EACH ROW EXECUTE FUNCTION sincronizar_total_producto();

-- Todo el stock acumulado hasta hoy se atribuye a la matriz.
-- El INSERT dispara la sincronización, dejando productos.stock coherente con existencias.
INSERT INTO existencias (producto_id, sucursal_id, stock, costo_promedio)
SELECT p.id, sucursal_matriz_inventario(), GREATEST(COALESCE(p.stock, 0), 0), COALESCE(p.costo, 0)
FROM productos p
ON CONFLICT (producto_id, sucursal_id) DO NOTHING;

COMMIT;
