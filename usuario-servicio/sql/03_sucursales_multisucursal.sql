-- usuario-servicio/sql/03_sucursales_multisucursal.sql
-- Habilita la operación multi-sucursal: designa la matriz, normaliza códigos
-- y garantiza que todo usuario pertenezca a una sucursal.
BEGIN;

ALTER TABLE sucursales
  ADD COLUMN IF NOT EXISTS es_matriz BOOLEAN NOT NULL DEFAULT FALSE;

-- El código es el identificador operativo de la sucursal: siempre en mayúsculas y sin espacios.
UPDATE sucursales SET codigo = UPPER(BTRIM(codigo)) WHERE codigo IS DISTINCT FROM UPPER(BTRIM(codigo));

-- Debe existir exactamente una matriz. Si aún no hay ninguna, se designa la más antigua.
UPDATE sucursales
SET es_matriz = TRUE
WHERE id = (SELECT id FROM sucursales ORDER BY id ASC LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM sucursales WHERE es_matriz = TRUE);

-- Sin sucursales no hay operación posible: se crea la matriz por defecto.
INSERT INTO sucursales (codigo, nombre, activo, es_matriz, fecha_creacion)
SELECT 'MATRIZ', 'Matriz', TRUE, TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM sucursales);

CREATE UNIQUE INDEX IF NOT EXISTS uq_sucursales_matriz ON sucursales (es_matriz) WHERE es_matriz = TRUE;

-- La matriz no puede desactivarse: es el destino de los datos huérfanos.
ALTER TABLE sucursales DROP CONSTRAINT IF EXISTS chk_sucursales_matriz_activa;
ALTER TABLE sucursales
  ADD CONSTRAINT chk_sucursales_matriz_activa CHECK (NOT es_matriz OR activo);

-- Los usuarios sin sucursal generaban registros huérfanos (facturas y movimientos
-- con sucursal_id NULL que no aparecen en ningún reporte). Se adoptan en la matriz.
UPDATE usuarios
SET sucursal_id = (SELECT id FROM sucursales WHERE es_matriz = TRUE),
    updated_at = NOW()
WHERE sucursal_id IS NULL;

ALTER TABLE usuarios ALTER COLUMN sucursal_id SET NOT NULL;

-- Desasignar un usuario al borrar su sucursal reintroduciría el NULL que acabamos
-- de eliminar; se restringe el borrado y se obliga a reasignar primero.
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_sucursal_id_fkey;
ALTER TABLE usuarios
  ADD CONSTRAINT usuarios_sucursal_id_fkey
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_sucursales_activo ON sucursales (activo, nombre);

COMMIT;
