ALTER TABLE sucursales ADD COLUMN IF NOT EXISTS codigo VARCHAR(20);

UPDATE sucursales
SET codigo = 'SUC-' || LPAD(id::text, 3, '0')
WHERE codigo IS NULL OR BTRIM(codigo) = '';

ALTER TABLE sucursales ALTER COLUMN codigo SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sucursales_codigo_key ON sucursales (codigo);

ALTER TABLE sucursales ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMPTZ;

UPDATE sucursales
SET fecha_creacion = COALESCE(created_at, NOW())
WHERE fecha_creacion IS NULL;

ALTER TABLE sucursales ALTER COLUMN fecha_creacion SET DEFAULT NOW();
ALTER TABLE sucursales ALTER COLUMN fecha_creacion SET NOT NULL;

ALTER TABLE sucursales ADD COLUMN IF NOT EXISTS email VARCHAR(150);
