-- facturacion-servicio/sql/04_facturas_por_sucursal.sql
-- Toda factura pertenece a una sucursal. Las emitidas por usuarios sin sucursal
-- asignada quedaron con sucursal_id NULL y no aparecían en ningún reporte.
BEGIN;

ALTER TABLE facturas ADD COLUMN IF NOT EXISTS sucursal_nombre VARCHAR(100);

CREATE OR REPLACE FUNCTION sucursal_matriz_facturacion() RETURNS INTEGER LANGUAGE SQL STABLE AS $$
  SELECT COALESCE((SELECT MIN(sucursal_id) FROM facturas WHERE sucursal_id IS NOT NULL), 1)
$$;

UPDATE facturas SET sucursal_id = sucursal_matriz_facturacion() WHERE sucursal_id IS NULL;

ALTER TABLE facturas ALTER COLUMN sucursal_id SET NOT NULL;

-- Las ventas con tarjeta y los abonos heredan la sucursal de su factura.
ALTER TABLE ventas_tarjeta ADD COLUMN IF NOT EXISTS sucursal_id INTEGER;
UPDATE ventas_tarjeta vt
SET sucursal_id = f.sucursal_id
FROM facturas f
WHERE f.id = vt.factura_id AND vt.sucursal_id IS NULL;

ALTER TABLE facturas_deudas ADD COLUMN IF NOT EXISTS sucursal_id INTEGER;
UPDATE facturas_deudas fd
SET sucursal_id = f.sucursal_id
FROM facturas f
WHERE f.id = fd.factura_id AND fd.sucursal_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_facturas_sucursal ON facturas (sucursal_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_tarjeta_sucursal ON ventas_tarjeta (sucursal_id, fecha_venta DESC);
CREATE INDEX IF NOT EXISTS idx_deudas_sucursal ON facturas_deudas (sucursal_id, fecha_pago DESC);

COMMIT;
