-- cliente-servicio/sql/02_cliente_ficha.sql
-- Campos de atención al cliente para la Ficha. Todos opcionales: ningún flujo
-- existente los exige, así que la compatibilidad hacia atrás queda intacta.
BEGIN;

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(30),
  ADD COLUMN IF NOT EXISTS preferencia_contacto VARCHAR(20),
  ADD COLUMN IF NOT EXISTS observaciones TEXT,
  ADD COLUMN IF NOT EXISTS notas_internas TEXT,
  ADD COLUMN IF NOT EXISTS ocupacion VARCHAR(100);

-- La ocupación es relevante en óptica: define el uso visual predominante
-- (pantallas, conducción, trabajo de precisión) y orienta la recomendación.
COMMENT ON COLUMN clientes.ocupacion IS 'Actividad del cliente; orienta la recomendación óptica';
COMMENT ON COLUMN clientes.notas_internas IS 'Uso interno del personal; no se muestra al cliente';

-- Medios de contacto admitidos. Se valida por CHECK en lugar de ENUM para no
-- requerir una migración de tipo si mañana se agrega otro canal.
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS chk_clientes_preferencia_contacto;
ALTER TABLE clientes
  ADD CONSTRAINT chk_clientes_preferencia_contacto
  CHECK (preferencia_contacto IS NULL OR preferencia_contacto IN ('TELEFONO','WHATSAPP','EMAIL','NINGUNO'));

COMMIT;
