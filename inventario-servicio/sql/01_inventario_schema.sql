CREATE TYPE tipo_control_stock AS ENUM ('NORMAL', 'ILIMITADO');
CREATE TYPE categoria_catalogo AS ENUM ('LUNA', 'LENTE_CONTACTO', 'LIQUIDO', 'SERVICIO');
CREATE TYPE tipo_compra AS ENUM ('CONTADO', 'CREDITO');
CREATE TYPE estado_ingreso AS ENUM ('BORRADOR', 'FINALIZADO', 'ANULADO');
CREATE TYPE tipo_detalle_ingreso AS ENUM ('EXISTENTE', 'NUEVO');
CREATE TYPE motivo_egreso AS ENUM ('DEVOLUCION_PROVEEDOR','PRODUCTO_DANADO','AJUSTE_INVENTARIO','DONACION','USO_INTERNO','PERDIDA_ROBO','OTRO');
CREATE TYPE tipo_movimiento_stock AS ENUM ('INGRESO','AJUSTE','ANULACION','VENTA NORMAL','VENTA','SALIDA','ELIMINACION','VENTA_EDITADA','COMPRA_EDITADA');
CREATE TYPE naturaleza_movimiento_stock AS ENUM ('ENTRADA','SALIDA','NEUTRO');
CREATE TYPE tipo_kardex_stock AS ENUM ('INVENTARIO_INICIAL','COMPRA','VENTA','DEVOLUCION_CLIENTE','DEVOLUCION_PROVEEDOR','EGRESO','AJUSTE','TRANSFERENCIA_ENTRADA','TRANSFERENCIA_SALIDA','ANULACION_VENTA','ANULACION_COMPRA','ANULACION_EGRESO','REVALORIZACION','COMPENSACION');

CREATE SEQUENCE seq_id_ingresos START 1 INCREMENT 1 NO CYCLE;
CREATE OR REPLACE FUNCTION gen_id_ingreso() RETURNS CHAR(10) LANGUAGE SQL AS $$ SELECT LPAD(nextval('seq_id_ingresos')::TEXT, 10, '0') $$;

CREATE TABLE proveedores (
  id SERIAL PRIMARY KEY, codigo VARCHAR(30), nombre VARCHAR(150) NOT NULL, representante VARCHAR(100), ruc VARCHAR(20) NOT NULL,
  telefono_principal VARCHAR(30), telefono_secundario VARCHAR(30), codigo_lugar VARCHAR(20), direccion VARCHAR(255), fecha_ingreso DATE,
  saldo NUMERIC(14,2) DEFAULT 0, activo BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE productos (
  id SERIAL PRIMARY KEY, id_interno INTEGER UNIQUE, codigo VARCHAR(50) NOT NULL, nombre VARCHAR(150) NOT NULL, modelo VARCHAR(100), color VARCHAR(60), grupo VARCHAR(60),
  stock INTEGER NOT NULL DEFAULT 0, tipo_control_stock tipo_control_stock NOT NULL DEFAULT 'NORMAL', costo NUMERIC(14,2) DEFAULT 0,
  pvp1 NUMERIC(14,2) DEFAULT 0, iva NUMERIC(5,2) DEFAULT 0, precio_con_iva NUMERIC(14,2) DEFAULT 0,
  proveedor_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL, ingreso_id INTEGER, observacion TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE catalogo_items (
  id SERIAL PRIMARY KEY, nombre VARCHAR(150) NOT NULL, categoria categoria_catalogo NOT NULL, precio NUMERIC(14,2) DEFAULT 0,
  iva NUMERIC(5,2) DEFAULT 0, precio_con_iva NUMERIC(14,2) DEFAULT 0, activo BOOLEAN NOT NULL DEFAULT TRUE, observacion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ingresos (
  id SERIAL PRIMARY KEY, id_personalizado CHAR(10) UNIQUE DEFAULT gen_id_ingreso(), proveedor_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,
  proveedor_nombre VARCHAR(150), numero_factura VARCHAR(50) NOT NULL, fecha DATE NOT NULL, tipo_compra tipo_compra NOT NULL DEFAULT 'CONTADO',
  observacion TEXT, descuento NUMERIC(14,2) DEFAULT 0, flete NUMERIC(14,2) DEFAULT 0, iva NUMERIC(14,2) DEFAULT 0, total NUMERIC(14,2) DEFAULT 0,
  estado estado_ingreso NOT NULL DEFAULT 'BORRADOR', usuario_id INTEGER, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE detalle_ingresos (
  id SERIAL PRIMARY KEY, ingreso_id INTEGER NOT NULL REFERENCES ingresos(id) ON DELETE CASCADE, producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
  tipo tipo_detalle_ingreso NOT NULL, codigo VARCHAR(50), nombre VARCHAR(150), modelo VARCHAR(100), color VARCHAR(60), grupo VARCHAR(60), pvp1 NUMERIC(14,2), observacion TEXT, stock_ingresado INTEGER NOT NULL DEFAULT 0,
  costo_unitario NUMERIC(14,2) DEFAULT 0, subtotal NUMERIC(14,2) DEFAULT 0
);
ALTER TABLE productos ADD CONSTRAINT fk_productos_ingreso FOREIGN KEY (ingreso_id) REFERENCES ingresos(id) ON DELETE SET NULL;

CREATE TABLE egresos_mercaderia (
  id SERIAL PRIMARY KEY, motivo motivo_egreso NOT NULL, descripcion TEXT NOT NULL, fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(), usuario_id INTEGER,
  usuario_nombre VARCHAR(150), costo_total NUMERIC(14,2) DEFAULT 0, proveedor_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,
  proveedor_nombre VARCHAR(150), sucursal_id INTEGER, sucursal_nombre VARCHAR(100), documento_referencia VARCHAR(100), created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE detalle_egresos (
  id SERIAL PRIMARY KEY, egreso_id INTEGER NOT NULL REFERENCES egresos_mercaderia(id) ON DELETE CASCADE, producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
  nombre VARCHAR(150), modelo VARCHAR(100), color VARCHAR(60), grupo VARCHAR(60), cantidad INTEGER NOT NULL DEFAULT 1, costo_unitario NUMERIC(14,2) DEFAULT 0, subtotal NUMERIC(14,2) DEFAULT 0
);

CREATE TABLE movimientos_stock (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  producto_codigo VARCHAR(50),
  producto_nombre VARCHAR(150),
  grupo_producto VARCHAR(60),
  sucursal_id INTEGER,
  sucursal_nombre VARCHAR(100),
  tipo tipo_movimiento_stock NOT NULL,
  naturaleza naturaleza_movimiento_stock NOT NULL,
  tipo_movimiento tipo_kardex_stock NOT NULL,
  origen VARCHAR(30) NOT NULL,
  cantidad INTEGER NOT NULL,
  costo_unitario NUMERIC(14,2),
  precio_venta NUMERIC(14,2),
  costo_promedio_anterior NUMERIC(14,4),
  costo_promedio_nuevo NUMERIC(14,4),
  stock_anterior INTEGER NOT NULL,
  stock_nuevo INTEGER NOT NULL,
  referencia_id INTEGER,
  referencia_tipo VARCHAR(50),
  referencia_codigo VARCHAR(50),
  usuario_id INTEGER,
  usuario_nombre VARCHAR(150),
  fecha_operacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  operacion_id VARCHAR(100) NOT NULL,
  idempotency_key VARCHAR(180) NOT NULL,
  movimiento_revertido_id INTEGER REFERENCES movimientos_stock(id) ON DELETE RESTRICT,
  motivo VARCHAR(150),
  observacion TEXT,
  trace_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_movimiento_cantidad_positiva CHECK (cantidad > 0),
  CONSTRAINT chk_movimiento_stock_no_negativo CHECK (stock_anterior >= 0 AND stock_nuevo >= 0)
);

CREATE INDEX idx_productos_busqueda ON productos (nombre, codigo, modelo, color);
CREATE INDEX idx_productos_proveedor ON productos (proveedor_id);
CREATE INDEX idx_ingresos_fecha ON ingresos (fecha DESC);
CREATE INDEX idx_movimientos_producto ON movimientos_stock (producto_id, created_at DESC);
CREATE INDEX idx_movimientos_sucursal ON movimientos_stock (sucursal_id, fecha_operacion DESC);
CREATE INDEX idx_movimientos_referencia ON movimientos_stock (referencia_tipo, referencia_id);
CREATE INDEX idx_movimientos_operacion ON movimientos_stock (operacion_id);
CREATE UNIQUE INDEX uq_movimientos_idempotency ON movimientos_stock (idempotency_key);
CREATE UNIQUE INDEX uq_movimiento_reversion ON movimientos_stock (movimiento_revertido_id) WHERE movimiento_revertido_id IS NOT NULL;

CREATE OR REPLACE FUNCTION impedir_mutacion_movimiento_stock() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'movimientos_stock es un ledger inmutable; registre un movimiento compensatorio';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_movimientos_stock_inmutables
BEFORE UPDATE OR DELETE ON movimientos_stock
FOR EACH ROW EXECUTE FUNCTION impedir_mutacion_movimiento_stock();

CREATE OR REPLACE FUNCTION impedir_stock_fuera_ledger() RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('app.movimiento_stock_autorizado', TRUE) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'El stock y costo del producto solo pueden cambiar mediante el servicio de movimientos';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_productos_stock_solo_ledger
BEFORE UPDATE OF stock, costo ON productos
FOR EACH ROW
WHEN (OLD.stock IS DISTINCT FROM NEW.stock OR OLD.costo IS DISTINCT FROM NEW.costo)
EXECUTE FUNCTION impedir_stock_fuera_ledger();
