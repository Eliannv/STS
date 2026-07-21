ALTER TABLE facturas
  ADD COLUMN IF NOT EXISTS estado_inventario VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE';

UPDATE facturas
SET estado_inventario = CASE
  WHEN estado_pago = 'ANULADA' THEN 'REVERSADO'
  ELSE 'APLICADO'
END
WHERE estado_inventario = 'PENDIENTE' AND created_at < NOW();

CREATE INDEX IF NOT EXISTS idx_facturas_estado_inventario ON facturas (estado_inventario);
