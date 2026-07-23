-- Agrega UNIQUE constraint al campo codigo de productos
-- Esto evita duplicados a nivel BD (antes solo se validaba en frontend)

-- Primero limpiar posibles duplicados existentes (si los hay)
DELETE FROM productos p1 USING (
  SELECT MIN(id) as id, codigo
  FROM productos
  GROUP BY codigo
  HAVING COUNT(*) > 1
) p2
WHERE p1.codigo = p2.codigo AND p1.id > p2.id;

-- Agregar constraint UNIQUE
ALTER TABLE productos ADD CONSTRAINT productos_codigo_unique UNIQUE (codigo);

-- Índice para búsqueda exacta por código
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);
