CREATE TYPE tipo_venta AS ENUM ('CONTADO','CREDITO');
CREATE TYPE estado_pago AS ENUM ('PAGADA','PENDIENTE','ANULADA');
CREATE TYPE estado_credito AS ENUM ('ACTIVO','CANCELADO');
CREATE TYPE estado_venta_tarjeta AS ENUM ('PENDIENTE','LIQUIDADA');
CREATE SEQUENCE seq_id_facturas START 1 INCREMENT 1 NO CYCLE;
CREATE OR REPLACE FUNCTION gen_id_factura() RETURNS CHAR(10) LANGUAGE SQL AS $$ SELECT LPAD(nextval('seq_id_facturas')::TEXT, 10, '0') $$;

CREATE TABLE facturas (
  id SERIAL PRIMARY KEY, id_personalizado CHAR(10) UNIQUE DEFAULT gen_id_factura(), cliente_id INTEGER NOT NULL, historial_clinico_id INTEGER,
  cliente_nombre VARCHAR(200), historial_snapshot JSONB, subtotal NUMERIC(14,2) NOT NULL DEFAULT 0, subtotal_bruto NUMERIC(14,2), iva NUMERIC(14,2) DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0, metodo_pago VARCHAR(30) NOT NULL, codigo_transferencia VARCHAR(100), es_credito BOOLEAN NOT NULL DEFAULT FALSE,
  abonado NUMERIC(14,2) DEFAULT 0, saldo_pendiente NUMERIC(14,2) DEFAULT 0, estado_credito estado_credito, tipo_venta tipo_venta NOT NULL DEFAULT 'CONTADO',
  estado_pago estado_pago NOT NULL DEFAULT 'PAGADA', observacion TEXT, fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(), usuario_id INTEGER, sucursal_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE detalle_facturas (
  id SERIAL PRIMARY KEY, factura_id INTEGER NOT NULL REFERENCES facturas(id) ON DELETE CASCADE, producto_id INTEGER, catalogo_item_id INTEGER,
  nombre VARCHAR(150) NOT NULL, tipo VARCHAR(60), codigo VARCHAR(50), id_interno INTEGER, cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(14,2) NOT NULL DEFAULT 0, total NUMERIC(14,2) NOT NULL DEFAULT 0, es_servicio BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE facturas_deudas (
  id SERIAL PRIMARY KEY, factura_id INTEGER NOT NULL REFERENCES facturas(id) ON DELETE RESTRICT, factura_id_personalizado CHAR(10), cliente_id INTEGER NOT NULL,
  cliente_nombre VARCHAR(200) NOT NULL, metodo_pago VARCHAR(30) NOT NULL, cliente_telefono VARCHAR(30), fecha_pago TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  monto_pagado NUMERIC(14,2) NOT NULL, total_factura NUMERIC(14,2) NOT NULL, saldo_restante NUMERIC(14,2) NOT NULL, codigo_transferencia VARCHAR(100),
  ultimos_cuatro_tarjeta CHAR(4), estado_pago estado_pago NOT NULL DEFAULT 'PENDIENTE', es_credito BOOLEAN NOT NULL DEFAULT TRUE, usuario_id INTEGER, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ventas_tarjeta (
  id SERIAL PRIMARY KEY, factura_id INTEGER NOT NULL REFERENCES facturas(id) ON DELETE RESTRICT, factura_id_personalizado CHAR(10), cliente_id INTEGER NOT NULL,
  cliente_nombre VARCHAR(200), fecha_venta TIMESTAMPTZ NOT NULL DEFAULT NOW(), monto_total NUMERIC(14,2) NOT NULL, monto_recibido NUMERIC(14,2) NOT NULL DEFAULT 0,
  saldo_pendiente NUMERIC(14,2) NOT NULL, estado estado_venta_tarjeta NOT NULL DEFAULT 'PENDIENTE', ultimos_cuatro_tarjeta CHAR(4), banco VARCHAR(80),
  numero_lote VARCHAR(50), observacion TEXT, cuenta_banco_id INTEGER, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE abonos_ventas_tarjeta (
  id SERIAL PRIMARY KEY, venta_tarjeta_id INTEGER NOT NULL REFERENCES ventas_tarjeta(id) ON DELETE CASCADE, fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  monto NUMERIC(14,2) NOT NULL, observacion TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_facturas_cliente ON facturas (cliente_id, fecha DESC);
CREATE INDEX idx_facturas_estado_pago ON facturas (estado_pago, es_credito);
CREATE INDEX idx_deudas_cliente ON facturas_deudas (cliente_id, fecha_pago DESC);
CREATE INDEX idx_ventas_tarjeta_estado ON ventas_tarjeta (estado, fecha_venta DESC);
CREATE INDEX idx_detalle_factura ON detalle_facturas (factura_id);
