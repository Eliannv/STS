-- caja-servicio/sql/06_caja_chica_por_sucursal.sql
-- Cada sucursal opera su propia caja chica diaria.
-- La caja banco permanece centralizada a nivel empresa (una por periodo mensual),
-- que es donde todas las sucursales depositan al cerrar.
BEGIN;

ALTER TABLE cajas_chicas
  ADD COLUMN IF NOT EXISTS sucursal_id INTEGER,
  ADD COLUMN IF NOT EXISTS sucursal_nombre VARCHAR(100);

-- caja_db no conoce el catálogo de sucursales (vive en usuario_db); la matriz se
-- deduce de los datos existentes y, si no hay ninguno, se asume la sucursal 1.
CREATE OR REPLACE FUNCTION sucursal_matriz_caja() RETURNS INTEGER LANGUAGE SQL STABLE AS $$
  SELECT COALESCE(
    (SELECT MIN(sucursal_id) FROM cajas_chicas WHERE sucursal_id IS NOT NULL),
    (SELECT MIN(sucursal_id) FROM cuentas WHERE sucursal_id IS NOT NULL),
    1
  )
$$;

UPDATE cajas_chicas SET sucursal_id = sucursal_matriz_caja() WHERE sucursal_id IS NULL;
UPDATE cuentas SET sucursal_id = sucursal_matriz_caja() WHERE sucursal_id IS NULL;

ALTER TABLE cajas_chicas ALTER COLUMN sucursal_id SET NOT NULL;

-- El índice anterior era ON ((1)): permitía una única caja chica abierta en TODO
-- el sistema, lo que impedía que dos sucursales operaran a la vez.
DROP INDEX IF EXISTS uq_caja_chica_abierta;
CREATE UNIQUE INDEX IF NOT EXISTS uq_caja_chica_abierta_por_sucursal
  ON cajas_chicas (sucursal_id)
  WHERE estado = 'ABIERTA';

CREATE INDEX IF NOT EXISTS idx_cajas_chicas_sucursal ON cajas_chicas (sucursal_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_cuentas_sucursal ON cuentas (sucursal_id, fecha DESC);

COMMIT;
