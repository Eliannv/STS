-- inventario-servicio/sql/08_ingresos_por_sucursal.sql
-- El documento de compra pertenece a una sucursal, no solo los movimientos que genera.
-- Sin esto no se puede responder cuánto compró cada sucursal ni filtrar el listado.
BEGIN;

ALTER TABLE ingresos
  ADD COLUMN IF NOT EXISTS sucursal_id INTEGER,
  ADD COLUMN IF NOT EXISTS sucursal_nombre VARCHAR(100);

-- Fuente más fiable: la sucursal donde el ingreso realmente cargó stock.
UPDATE ingresos i
SET sucursal_id = m.sucursal_id,
    sucursal_nombre = COALESCE(i.sucursal_nombre, m.sucursal_nombre)
FROM (
  SELECT referencia_id, MIN(sucursal_id) AS sucursal_id, MIN(sucursal_nombre) AS sucursal_nombre
  FROM movimientos_stock
  WHERE referencia_tipo = 'INGRESO' AND referencia_id IS NOT NULL
  GROUP BY referencia_id
) m
WHERE m.referencia_id = i.id AND i.sucursal_id IS NULL;

-- Compras anteriores al ledger (o borradores que nunca movieron stock): son de la matriz,
-- que es donde operaba el sistema antes de habilitarse el multi-sucursal.
UPDATE ingresos SET sucursal_id = sucursal_matriz_inventario() WHERE sucursal_id IS NULL;

ALTER TABLE ingresos ALTER COLUMN sucursal_id SET NOT NULL;

-- Las operaciones financieras de compra ya tienen la columna; se completan las
-- que hubieran quedado sin sucursal para que cuentas por pagar cuadre por sucursal.
UPDATE operaciones_financieras_inventario o
SET sucursal_id = i.sucursal_id
FROM ingresos i
WHERE i.id = o.ingreso_id AND o.sucursal_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_ingresos_sucursal ON ingresos (sucursal_id, fecha DESC);

COMMIT;
