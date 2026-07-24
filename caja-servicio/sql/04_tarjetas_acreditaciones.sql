-- caja-servicio/sql/04_tarjetas_acreditaciones.sql
BEGIN;

ALTER TYPE categoria_mov_financiero
  ADD VALUE IF NOT EXISTS 'COMISION_BANCARIA';

ALTER TYPE categoria_mov_financiero
  ADD VALUE IF NOT EXISTS 'RETENCION_BANCARIA';

COMMIT;
