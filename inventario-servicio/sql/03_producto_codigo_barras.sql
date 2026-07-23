ALTER TABLE productos
ADD COLUMN IF NOT EXISTS codigo_barras VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_codigo_barras
ON productos (codigo_barras);

CREATE SEQUENCE IF NOT EXISTS seq_codigo_barras_productos
START 1
INCREMENT 1
NO CYCLE;

DO $$
DECLARE
  mayor_codigo BIGINT;
  valor_secuencia BIGINT;
BEGIN
  SELECT COALESCE(MAX(SUBSTRING(codigo_barras FROM 4)::BIGINT), 0)
    INTO mayor_codigo
  FROM productos
  WHERE codigo_barras ~ '^PRO[0-9]{9}$';

  IF mayor_codigo > 0 THEN
    SELECT last_value INTO valor_secuencia FROM seq_codigo_barras_productos;
    PERFORM setval(
      'seq_codigo_barras_productos',
      GREATEST(mayor_codigo, valor_secuencia),
      TRUE
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION gen_codigo_barras_producto() RETURNS VARCHAR(100) AS $$
DECLARE
  nuevo_codigo VARCHAR(100);
BEGIN
  LOOP
    nuevo_codigo := 'PRO' || LPAD(nextval('seq_codigo_barras_productos')::TEXT, 9, '0');
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM productos WHERE codigo_barras = nuevo_codigo
    );
  END LOOP;
  RETURN nuevo_codigo;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE productos
ALTER COLUMN codigo_barras SET DEFAULT gen_codigo_barras_producto();
