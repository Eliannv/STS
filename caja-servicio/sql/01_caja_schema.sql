CREATE TYPE estado_caja AS ENUM ('ABIERTA','CERRADA');
CREATE TYPE tipo_movimiento_caja AS ENUM ('INGRESO','EGRESO');
CREATE TYPE categoria_mov_banco AS ENUM ('CIERRE_CAJA_CHICA','TRANSFERENCIA_CLIENTE','PAGO_TRABAJADOR','PAGO_PROVEEDORES','OTRO_INGRESO','OTRO_EGRESO');
CREATE TYPE tipo_cuenta AS ENUM ('PAGAR','COBRAR');
CREATE TYPE tipo_cuenta_pagar AS ENUM ('Deuda','Prestamo');
CREATE TYPE estado_cuenta AS ENUM ('ACTIVA','CANCELADA');

CREATE TABLE cajas_banco (
  id SERIAL PRIMARY KEY, fecha DATE NOT NULL, saldo_inicial NUMERIC(14,2) DEFAULT 0, saldo_actual NUMERIC(14,2) NOT NULL DEFAULT 0,
  estado estado_caja NOT NULL DEFAULT 'ABIERTA', usuario_id INTEGER, usuario_nombre VARCHAR(150), observacion TEXT, activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), cerrado_en TIMESTAMPTZ, cerrado_por_id INTEGER, cerrado_por_nombre VARCHAR(150)
);

CREATE TABLE cajas_chicas (
  id SERIAL PRIMARY KEY, fecha DATE NOT NULL, monto_inicial NUMERIC(14,2) NOT NULL DEFAULT 0, monto_actual NUMERIC(14,2) NOT NULL DEFAULT 0,
  estado estado_caja NOT NULL DEFAULT 'ABIERTA', usuario_id INTEGER, usuario_nombre VARCHAR(150), observacion TEXT, activo BOOLEAN NOT NULL DEFAULT TRUE,
  caja_banco_id INTEGER REFERENCES cajas_banco(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
  cerrado_en TIMESTAMPTZ, cerrado_por_id INTEGER, cerrado_por_nombre VARCHAR(150)
);

CREATE TABLE movimientos_cajas_chicas (
  id SERIAL PRIMARY KEY, caja_chica_id INTEGER NOT NULL REFERENCES cajas_chicas(id) ON DELETE CASCADE, fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tipo tipo_movimiento_caja NOT NULL, descripcion VARCHAR(255) NOT NULL, monto NUMERIC(14,2) NOT NULL, saldo_anterior NUMERIC(14,2) NOT NULL,
  saldo_nuevo NUMERIC(14,2) NOT NULL, factura_id INTEGER, usuario_id INTEGER, usuario_nombre VARCHAR(150), referencia VARCHAR(100), created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE movimientos_cajas_banco (
  id SERIAL PRIMARY KEY, caja_banco_id INTEGER NOT NULL REFERENCES cajas_banco(id) ON DELETE CASCADE, fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tipo tipo_movimiento_caja NOT NULL, categoria categoria_mov_banco NOT NULL, monto NUMERIC(14,2) NOT NULL, saldo_anterior NUMERIC(14,2) NOT NULL,
  saldo_nuevo NUMERIC(14,2) NOT NULL, descripcion VARCHAR(255), referencia_id INTEGER, venta_id INTEGER, usuario_id INTEGER, usuario_nombre VARCHAR(150), created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cuentas (
  id SERIAL PRIMARY KEY, fecha DATE NOT NULL, tipo tipo_cuenta NOT NULL, tipo_cuenta_por_pagar tipo_cuenta_pagar, monto_total NUMERIC(14,2) NOT NULL,
  monto_abonado NUMERIC(14,2) NOT NULL DEFAULT 0, saldo NUMERIC(14,2) NOT NULL, estado estado_cuenta NOT NULL DEFAULT 'ACTIVA', observacion TEXT NOT NULL,
  tercero_nombre VARCHAR(150), tercero_id INTEGER, usuario_id INTEGER, sucursal_id INTEGER, caja_banco_id INTEGER REFERENCES cajas_banco(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cajas_banco_estado ON cajas_banco (estado, fecha DESC);
CREATE INDEX idx_cajas_chicas_estado ON cajas_chicas (estado, fecha DESC);
CREATE INDEX idx_mov_chicas_caja ON movimientos_cajas_chicas (caja_chica_id, fecha DESC);
CREATE INDEX idx_mov_banco_caja ON movimientos_cajas_banco (caja_banco_id, fecha DESC);
CREATE INDEX idx_cuentas_estado ON cuentas (estado, fecha DESC);
