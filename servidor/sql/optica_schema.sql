-- ============================================================
-- ÓPTICA MACÍAS — Esquema PostgreSQL
-- Migración desde Firebase (Firestore + Auth)
-- ============================================================

-- ─────────────────────────────────────
-- TIPOS ENUM
-- ─────────────────────────────────────
CREATE TYPE rol_usuario          AS ENUM ('ADMINISTRADOR', 'OPERADOR');
CREATE TYPE tipo_control_stock   AS ENUM ('NORMAL', 'ILIMITADO');
CREATE TYPE categoria_catalogo   AS ENUM ('LUNA', 'LENTE_CONTACTO', 'LIQUIDO', 'SERVICIO');
CREATE TYPE tipo_compra          AS ENUM ('CONTADO', 'CREDITO');
CREATE TYPE estado_ingreso       AS ENUM ('BORRADOR', 'FINALIZADO');
CREATE TYPE tipo_detalle_ingreso AS ENUM ('EXISTENTE', 'NUEVO');
CREATE TYPE motivo_egreso        AS ENUM (
  'DEVOLUCION_PROVEEDOR','PRODUCTO_DANADO','AJUSTE_INVENTARIO',
  'DONACION','USO_INTERNO','PERDIDA_ROBO','OTRO'
);
CREATE TYPE tipo_movimiento_stock AS ENUM (
  'INGRESO','AJUSTE','ANULACION','VENTA NORMAL',
  'VENTA','SALIDA','ELIMINACION','VENTA_EDITADA','COMPRA_EDITADA'
);
CREATE TYPE tipo_venta           AS ENUM ('CONTADO','CREDITO');
CREATE TYPE estado_pago          AS ENUM ('PAGADA','PENDIENTE');
CREATE TYPE estado_credito       AS ENUM ('ACTIVO','CANCELADO');
CREATE TYPE estado_caja          AS ENUM ('ABIERTA','CERRADA');
CREATE TYPE tipo_movimiento_caja AS ENUM ('INGRESO','EGRESO');
CREATE TYPE categoria_mov_banco  AS ENUM (
  'CIERRE_CAJA_CHICA','TRANSFERENCIA_CLIENTE','PAGO_TRABAJADOR',
  'PAGO_PROVEEDORES','OTRO_INGRESO','OTRO_EGRESO'
);
CREATE TYPE estado_venta_tarjeta AS ENUM ('PENDIENTE','LIQUIDADA');
CREATE TYPE tipo_cuenta          AS ENUM ('PAGAR','COBRAR');
CREATE TYPE tipo_cuenta_pagar    AS ENUM ('Deuda','Prestamo');
CREATE TYPE estado_cuenta        AS ENUM ('ACTIVA','CANCELADA');

-- ─────────────────────────────────────
-- SECUENCIAS para IDs personalizados (10 dígitos)
-- ─────────────────────────────────────
CREATE SEQUENCE seq_id_facturas  START 1 INCREMENT 1 NO CYCLE;
CREATE SEQUENCE seq_id_ingresos  START 1 INCREMENT 1 NO CYCLE;

CREATE OR REPLACE FUNCTION gen_id_personalizado(seq_name TEXT)
RETURNS CHAR(10) LANGUAGE plpgsql AS $$
BEGIN
  RETURN LPAD(nextval(seq_name)::TEXT, 10, '0');
END;
$$;

-- ─────────────────────────────────────
-- 1. SUCURSALES
-- ─────────────────────────────────────
CREATE TABLE sucursales (
  id             SERIAL        PRIMARY KEY,
  codigo         VARCHAR(20)   NOT NULL UNIQUE,
  nombre         VARCHAR(100)  NOT NULL,
  activo         BOOLEAN       NOT NULL DEFAULT TRUE,
  direccion      VARCHAR(255),
  telefono       VARCHAR(30),
  fecha_creacion TIMESTAMPTZ   DEFAULT NOW(),
  creado_por_id  INTEGER       -- FK a usuarios (se agrega con ALTER)
);

-- ─────────────────────────────────────
-- 2. USUARIOS
-- ─────────────────────────────────────
CREATE TABLE usuarios (
  id              SERIAL        PRIMARY KEY,
  nombre          VARCHAR(100)  NOT NULL,
  apellido        VARCHAR(100),
  email           VARCHAR(150)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255)  NOT NULL,
  cedula          VARCHAR(20),
  fecha_nacimiento DATE,
  rol             rol_usuario   NOT NULL DEFAULT 'OPERADOR',
  activo          BOOLEAN       NOT NULL DEFAULT TRUE,
  sucursal_id     INTEGER       REFERENCES sucursales(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- FK circular sucursales → usuarios
ALTER TABLE sucursales
  ADD CONSTRAINT fk_sucursales_creado_por
  FOREIGN KEY (creado_por_id) REFERENCES usuarios(id) ON DELETE SET NULL;

-- ─────────────────────────────────────
-- 3. CLIENTES
-- ─────────────────────────────────────
CREATE TABLE clientes (
  id                         SERIAL        PRIMARY KEY,
  nombres                    VARCHAR(100)  NOT NULL,
  apellidos                  VARCHAR(100)  NOT NULL,
  cedula                     VARCHAR(20)   UNIQUE,
  telefono                   VARCHAR(30),
  email                      VARCHAR(150),
  fecha_nacimiento           DATE,
  direccion                  VARCHAR(255),
  pais                       VARCHAR(60),
  provincia                  VARCHAR(60),
  ciudad                     VARCHAR(60),
  activo                     BOOLEAN       NOT NULL DEFAULT TRUE,
  tiene_historial_clinico    BOOLEAN       NOT NULL DEFAULT FALSE,
  tiene_credito              BOOLEAN       NOT NULL DEFAULT FALSE,
  tiene_deuda                BOOLEAN       NOT NULL DEFAULT FALSE,
  ultima_actualizacion_deuda TIMESTAMPTZ,
  es_consumidor_final        BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at                 TIMESTAMPTZ   DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ   DEFAULT NOW()
);

-- ─────────────────────────────────────
-- 4. HISTORIAL CLÍNICO
-- ─────────────────────────────────────
CREATE TABLE historial_clinico (
  id           SERIAL      PRIMARY KEY,
  cliente_id   INTEGER     NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  od_esfera    NUMERIC(5,2),
  od_cilindro  NUMERIC(5,2),
  od_eje       NUMERIC(6,2),
  od_avsc      NUMERIC(5,2),
  od_avcc      NUMERIC(5,2),
  oi_esfera    NUMERIC(5,2),
  oi_cilindro  NUMERIC(5,2),
  oi_eje       NUMERIC(6,2),
  oi_avsc      NUMERIC(5,2),
  oi_avcc      NUMERIC(5,2),
  dp           NUMERIC(5,2),
  "add"        NUMERIC(5,2),
  de           VARCHAR(60),
  altura       NUMERIC(5,2),
  color        VARCHAR(60),
  observacion  TEXT,
  armazon_h    NUMERIC(5,2),
  armazon_v    NUMERIC(5,2),
  armazon_dbl  NUMERIC(5,2),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────
-- 5. PROVEEDORES
-- ─────────────────────────────────────
CREATE TABLE proveedores (
  id                  SERIAL        PRIMARY KEY,
  codigo              VARCHAR(30),
  nombre              VARCHAR(150)  NOT NULL,
  representante       VARCHAR(100),
  ruc                 VARCHAR(20)   NOT NULL,
  telefono_principal  VARCHAR(30),
  telefono_secundario VARCHAR(30),
  codigo_lugar        VARCHAR(20),
  direccion           VARCHAR(255),
  fecha_ingreso       DATE,
  saldo               NUMERIC(14,2) DEFAULT 0,
  activo              BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ   DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   DEFAULT NOW()
);

-- ─────────────────────────────────────
-- 6. PRODUCTOS
-- ─────────────────────────────────────
CREATE TABLE productos (
  id                 SERIAL             PRIMARY KEY,
  id_interno         INTEGER            UNIQUE,
  codigo             VARCHAR(50)        NOT NULL,
  nombre             VARCHAR(150)       NOT NULL,
  modelo             VARCHAR(100),
  color              VARCHAR(60),
  grupo              VARCHAR(60),
  stock              INTEGER            NOT NULL DEFAULT 0,
  tipo_control_stock tipo_control_stock NOT NULL DEFAULT 'NORMAL',
  costo              NUMERIC(14,2)      DEFAULT 0,
  pvp1               NUMERIC(14,2)      DEFAULT 0,
  iva                NUMERIC(5,2)       DEFAULT 0,
  precio_con_iva     NUMERIC(14,2)      DEFAULT 0,
  proveedor_id       INTEGER            REFERENCES proveedores(id) ON DELETE SET NULL,
  ingreso_id         INTEGER,
  observacion        TEXT,
  activo             BOOLEAN            NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ        DEFAULT NOW(),
  updated_at         TIMESTAMPTZ        DEFAULT NOW()
);

-- ─────────────────────────────────────
-- 7. CATÁLOGO (ítems sin stock físico)
-- ─────────────────────────────────────
CREATE TABLE catalogo_items (
  id             SERIAL             PRIMARY KEY,
  nombre         VARCHAR(150)       NOT NULL,
  categoria      categoria_catalogo NOT NULL,
  precio         NUMERIC(14,2)      DEFAULT 0,
  iva            NUMERIC(5,2)       DEFAULT 0,
  precio_con_iva NUMERIC(14,2)      DEFAULT 0,
  activo         BOOLEAN            NOT NULL DEFAULT TRUE,
  observacion    TEXT,
  created_at     TIMESTAMPTZ        DEFAULT NOW(),
  updated_at     TIMESTAMPTZ        DEFAULT NOW()
);

-- ─────────────────────────────────────
-- 8. INGRESOS (compras a proveedor)
-- ─────────────────────────────────────
CREATE TABLE ingresos (
  id               SERIAL         PRIMARY KEY,
  id_personalizado CHAR(10)       UNIQUE DEFAULT gen_id_personalizado('seq_id_ingresos'),
  proveedor_id     INTEGER        REFERENCES proveedores(id) ON DELETE SET NULL,
  proveedor_nombre VARCHAR(150),
  numero_factura   VARCHAR(50)    NOT NULL,
  fecha            DATE           NOT NULL,
  tipo_compra      tipo_compra    NOT NULL DEFAULT 'CONTADO',
  observacion      TEXT,
  descuento        NUMERIC(14,2)  DEFAULT 0,
  flete            NUMERIC(14,2)  DEFAULT 0,
  iva              NUMERIC(14,2)  DEFAULT 0,
  total            NUMERIC(14,2)  DEFAULT 0,
  estado           estado_ingreso NOT NULL DEFAULT 'BORRADOR',
  usuario_id       INTEGER        REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ    DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    DEFAULT NOW()
);

-- ─────────────────────────────────────
-- 9. DETALLE INGRESOS
-- ─────────────────────────────────────
CREATE TABLE detalle_ingresos (
  id              SERIAL               PRIMARY KEY,
  ingreso_id      INTEGER              NOT NULL REFERENCES ingresos(id) ON DELETE CASCADE,
  producto_id     INTEGER              REFERENCES productos(id) ON DELETE SET NULL,
  tipo            tipo_detalle_ingreso NOT NULL,
  codigo          VARCHAR(50),
  nombre          VARCHAR(150),
  grupo           VARCHAR(60),
  stock_ingresado INTEGER              NOT NULL DEFAULT 0,
  costo_unitario  NUMERIC(14,2)        DEFAULT 0,
  subtotal        NUMERIC(14,2)        DEFAULT 0
);

ALTER TABLE productos
  ADD CONSTRAINT fk_productos_ingreso
  FOREIGN KEY (ingreso_id) REFERENCES ingresos(id) ON DELETE SET NULL;

-- ─────────────────────────────────────
-- 10. EGRESOS DE MERCADERÍA
-- ─────────────────────────────────────
CREATE TABLE egresos_mercaderia (
  id                   SERIAL        PRIMARY KEY,
  motivo               motivo_egreso NOT NULL,
  descripcion          TEXT          NOT NULL,
  fecha                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  usuario_id           INTEGER       REFERENCES usuarios(id) ON DELETE SET NULL,
  usuario_nombre       VARCHAR(150),
  costo_total          NUMERIC(14,2) DEFAULT 0,
  proveedor_id         INTEGER       REFERENCES proveedores(id) ON DELETE SET NULL,
  proveedor_nombre     VARCHAR(150),
  sucursal_id          INTEGER       REFERENCES sucursales(id) ON DELETE SET NULL,
  sucursal_nombre      VARCHAR(100),
  documento_referencia VARCHAR(100),
  created_at           TIMESTAMPTZ   DEFAULT NOW()
);

-- ─────────────────────────────────────
-- 11. DETALLE EGRESOS
-- ─────────────────────────────────────
CREATE TABLE detalle_egresos (
  id             SERIAL        PRIMARY KEY,
  egreso_id      INTEGER       NOT NULL REFERENCES egresos_mercaderia(id) ON DELETE CASCADE,
  producto_id    INTEGER       REFERENCES productos(id) ON DELETE SET NULL,
  nombre         VARCHAR(150),
  modelo         VARCHAR(100),
  color          VARCHAR(60),
  grupo          VARCHAR(60),
  cantidad       INTEGER       NOT NULL DEFAULT 1,
  costo_unitario NUMERIC(14,2) DEFAULT 0,
  subtotal       NUMERIC(14,2) DEFAULT 0
);

-- ─────────────────────────────────────
-- 12. MOVIMIENTOS DE STOCK (Kardex)
-- ─────────────────────────────────────
CREATE TABLE movimientos_stock (
  id              SERIAL                PRIMARY KEY,
  producto_id     INTEGER               NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  producto_nombre VARCHAR(150),
  grupo_producto  VARCHAR(60),
  sucursal_id     INTEGER               REFERENCES sucursales(id) ON DELETE SET NULL,
  tipo            tipo_movimiento_stock NOT NULL,
  cantidad        INTEGER               NOT NULL,
  costo_unitario  NUMERIC(14,2),
  precio_venta    NUMERIC(14,2),
  stock_anterior  INTEGER               NOT NULL,
  stock_nuevo     INTEGER               NOT NULL,
  referencia_id   INTEGER,
  referencia_tipo VARCHAR(50),
  observacion     TEXT,
  created_at      TIMESTAMPTZ           DEFAULT NOW()
);

-- ─────────────────────────────────────
-- 13. FACTURAS
-- ─────────────────────────────────────
CREATE TABLE facturas (
  id                   SERIAL      PRIMARY KEY,
  id_personalizado     CHAR(10)    UNIQUE DEFAULT gen_id_personalizado('seq_id_facturas'),
  cliente_id           INTEGER     NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  historial_clinico_id INTEGER     REFERENCES historial_clinico(id) ON DELETE SET NULL,
  cliente_nombre       VARCHAR(200),
  historial_snapshot   JSONB,
  subtotal             NUMERIC(14,2) NOT NULL DEFAULT 0,
  subtotal_bruto       NUMERIC(14,2),
  iva                  NUMERIC(14,2) DEFAULT 0,
  total                NUMERIC(14,2) NOT NULL DEFAULT 0,
  metodo_pago          VARCHAR(30)   NOT NULL,
  codigo_transferencia VARCHAR(100),
  es_credito           BOOLEAN       NOT NULL DEFAULT FALSE,
  abonado              NUMERIC(14,2) DEFAULT 0,
  saldo_pendiente      NUMERIC(14,2) DEFAULT 0,
  estado_credito       estado_credito,
  tipo_venta           tipo_venta    NOT NULL DEFAULT 'CONTADO',
  estado_pago          estado_pago   NOT NULL DEFAULT 'PAGADA',
  observacion          TEXT,
  fecha                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  usuario_id           INTEGER       REFERENCES usuarios(id) ON DELETE SET NULL,
  sucursal_id          INTEGER       REFERENCES sucursales(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ   DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   DEFAULT NOW()
);

-- ─────────────────────────────────────
-- 14. DETALLE FACTURAS
-- ─────────────────────────────────────
CREATE TABLE detalle_facturas (
  id               SERIAL        PRIMARY KEY,
  factura_id       INTEGER       NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  producto_id      INTEGER,
  catalogo_item_id INTEGER       REFERENCES catalogo_items(id) ON DELETE SET NULL,
  nombre           VARCHAR(150)  NOT NULL,
  tipo             VARCHAR(60),
  codigo           VARCHAR(50),
  id_interno       INTEGER,
  cantidad         INTEGER       NOT NULL DEFAULT 1,
  precio_unitario  NUMERIC(14,2) NOT NULL DEFAULT 0,
  total            NUMERIC(14,2) NOT NULL DEFAULT 0,
  es_servicio      BOOLEAN       NOT NULL DEFAULT FALSE
);

-- ─────────────────────────────────────
-- 15. FACTURAS DEUDAS (cobros/abonos)
-- ─────────────────────────────────────
CREATE TABLE facturas_deudas (
  id                       SERIAL        PRIMARY KEY,
  factura_id               INTEGER       NOT NULL REFERENCES facturas(id) ON DELETE RESTRICT,
  factura_id_personalizado CHAR(10),
  cliente_id               INTEGER       NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  cliente_nombre           VARCHAR(200)  NOT NULL,
  metodo_pago              VARCHAR(30)   NOT NULL,
  cliente_telefono         VARCHAR(30),
  fecha_pago               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  monto_pagado             NUMERIC(14,2) NOT NULL,
  total_factura            NUMERIC(14,2) NOT NULL,
  saldo_restante           NUMERIC(14,2) NOT NULL,
  codigo_transferencia     VARCHAR(100),
  ultimos_cuatro_tarjeta   CHAR(4),
  estado_pago              estado_pago   NOT NULL DEFAULT 'PENDIENTE',
  es_credito               BOOLEAN       NOT NULL DEFAULT TRUE,
  usuario_id               INTEGER       REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at               TIMESTAMPTZ   DEFAULT NOW()
);

-- ─────────────────────────────────────
-- 16. CAJAS BANCO
-- ─────────────────────────────────────
CREATE TABLE cajas_banco (
  id                 SERIAL      PRIMARY KEY,
  fecha              DATE        NOT NULL,
  saldo_inicial      NUMERIC(14,2) DEFAULT 0,
  saldo_actual       NUMERIC(14,2) NOT NULL DEFAULT 0,
  estado             estado_caja   NOT NULL DEFAULT 'ABIERTA',
  usuario_id         INTEGER       REFERENCES usuarios(id) ON DELETE SET NULL,
  usuario_nombre     VARCHAR(150),
  observacion        TEXT,
  activo             BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ   DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   DEFAULT NOW(),
  cerrado_en         TIMESTAMPTZ,
  cerrado_por_id     INTEGER       REFERENCES usuarios(id) ON DELETE SET NULL,
  cerrado_por_nombre VARCHAR(150)
);

-- ─────────────────────────────────────
-- 17. CAJAS CHICAS
-- ─────────────────────────────────────
CREATE TABLE cajas_chicas (
  id                 SERIAL      PRIMARY KEY,
  fecha              DATE        NOT NULL,
  monto_inicial      NUMERIC(14,2) NOT NULL DEFAULT 0,
  monto_actual       NUMERIC(14,2) NOT NULL DEFAULT 0,
  estado             estado_caja   NOT NULL DEFAULT 'ABIERTA',
  usuario_id         INTEGER       REFERENCES usuarios(id) ON DELETE SET NULL,
  usuario_nombre     VARCHAR(150),
  observacion        TEXT,
  activo             BOOLEAN       NOT NULL DEFAULT TRUE,
  caja_banco_id      INTEGER       REFERENCES cajas_banco(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ   DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   DEFAULT NOW(),
  cerrado_en         TIMESTAMPTZ,
  cerrado_por_id     INTEGER       REFERENCES usuarios(id) ON DELETE SET NULL,
  cerrado_por_nombre VARCHAR(150)
);

-- ─────────────────────────────────────
-- 18. MOVIMIENTOS CAJAS CHICAS
-- ─────────────────────────────────────
CREATE TABLE movimientos_cajas_chicas (
  id             SERIAL               PRIMARY KEY,
  caja_chica_id  INTEGER              NOT NULL REFERENCES cajas_chicas(id) ON DELETE CASCADE,
  fecha          TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  tipo           tipo_movimiento_caja NOT NULL,
  descripcion    VARCHAR(255)         NOT NULL,
  monto          NUMERIC(14,2)        NOT NULL,
  saldo_anterior NUMERIC(14,2)        NOT NULL,
  saldo_nuevo    NUMERIC(14,2)        NOT NULL,
  factura_id     INTEGER              REFERENCES facturas(id) ON DELETE SET NULL,
  usuario_id     INTEGER              REFERENCES usuarios(id) ON DELETE SET NULL,
  usuario_nombre VARCHAR(150),
  referencia     VARCHAR(100),
  created_at     TIMESTAMPTZ          DEFAULT NOW()
);

-- ─────────────────────────────────────
-- 19. MOVIMIENTOS CAJAS BANCO
-- ─────────────────────────────────────
CREATE TABLE movimientos_cajas_banco (
  id             SERIAL               PRIMARY KEY,
  caja_banco_id  INTEGER              NOT NULL REFERENCES cajas_banco(id) ON DELETE CASCADE,
  fecha          TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  tipo           tipo_movimiento_caja NOT NULL,
  categoria      categoria_mov_banco  NOT NULL,
  monto          NUMERIC(14,2)        NOT NULL,
  saldo_anterior NUMERIC(14,2)        NOT NULL,
  saldo_nuevo    NUMERIC(14,2)        NOT NULL,
  descripcion    VARCHAR(255),
  referencia_id  INTEGER,
  venta_id       INTEGER              REFERENCES facturas(id) ON DELETE SET NULL,
  usuario_id     INTEGER              REFERENCES usuarios(id) ON DELETE SET NULL,
  usuario_nombre VARCHAR(150),
  created_at     TIMESTAMPTZ          DEFAULT NOW()
);

-- ─────────────────────────────────────
-- 20. VENTAS TARJETA
-- ─────────────────────────────────────
CREATE TABLE ventas_tarjeta (
  id                       SERIAL               PRIMARY KEY,
  factura_id               INTEGER              NOT NULL REFERENCES facturas(id) ON DELETE RESTRICT,
  factura_id_personalizado CHAR(10),
  cliente_id               INTEGER              NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  cliente_nombre           VARCHAR(200),
  fecha_venta              TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  monto_total              NUMERIC(14,2)        NOT NULL,
  monto_recibido           NUMERIC(14,2)        NOT NULL DEFAULT 0,
  saldo_pendiente          NUMERIC(14,2)        NOT NULL,
  estado                   estado_venta_tarjeta NOT NULL DEFAULT 'PENDIENTE',
  ultimos_cuatro_tarjeta   CHAR(4),
  banco                    VARCHAR(80),
  numero_lote              VARCHAR(50),
  observacion              TEXT,
  cuenta_banco_id          INTEGER              REFERENCES cajas_banco(id) ON DELETE SET NULL,
  created_at               TIMESTAMPTZ          DEFAULT NOW(),
  updated_at               TIMESTAMPTZ          DEFAULT NOW()
);

-- ─────────────────────────────────────
-- 21. ABONOS VENTAS TARJETA
-- ─────────────────────────────────────
CREATE TABLE abonos_ventas_tarjeta (
  id               SERIAL        PRIMARY KEY,
  venta_tarjeta_id INTEGER       NOT NULL REFERENCES ventas_tarjeta(id) ON DELETE CASCADE,
  fecha            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  monto            NUMERIC(14,2) NOT NULL,
  observacion      TEXT,
  created_at       TIMESTAMPTZ   DEFAULT NOW()
);

-- ─────────────────────────────────────
-- 22. CUENTAS (por pagar / por cobrar)
-- ─────────────────────────────────────
CREATE TABLE cuentas (
  id                    SERIAL           PRIMARY KEY,
  fecha                 DATE             NOT NULL,
  tipo                  tipo_cuenta      NOT NULL,
  tipo_cuenta_por_pagar tipo_cuenta_pagar,
  monto_total           NUMERIC(14,2)    NOT NULL,
  monto_abonado         NUMERIC(14,2)    NOT NULL DEFAULT 0,
  saldo                 NUMERIC(14,2)    NOT NULL,
  estado                estado_cuenta    NOT NULL DEFAULT 'ACTIVA',
  observacion           TEXT             NOT NULL,
  tercero_nombre        VARCHAR(150),
  tercero_id            INTEGER,
  usuario_id            INTEGER          REFERENCES usuarios(id) ON DELETE SET NULL,
  sucursal_id           INTEGER          REFERENCES sucursales(id) ON DELETE SET NULL,
  caja_banco_id         INTEGER          REFERENCES cajas_banco(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ      DEFAULT NOW(),
  updated_at            TIMESTAMPTZ      DEFAULT NOW()
);

-- ─────────────────────────────────────
-- ÍNDICES
-- ─────────────────────────────────────
CREATE INDEX idx_clientes_cedula          ON clientes(cedula);
CREATE INDEX idx_clientes_activo          ON clientes(activo);
CREATE INDEX idx_clientes_tiene_deuda     ON clientes(tiene_deuda) WHERE tiene_deuda = TRUE;
CREATE INDEX idx_historial_clinico_cliente ON historial_clinico(cliente_id);
CREATE INDEX idx_productos_activo         ON productos(activo);
CREATE INDEX idx_productos_grupo          ON productos(grupo);
CREATE INDEX idx_productos_proveedor      ON productos(proveedor_id);
CREATE INDEX idx_ingresos_proveedor       ON ingresos(proveedor_id);
CREATE INDEX idx_ingresos_fecha           ON ingresos(fecha);
CREATE INDEX idx_detalle_ingresos_ingreso ON detalle_ingresos(ingreso_id);
CREATE INDEX idx_egresos_fecha            ON egresos_mercaderia(fecha);
CREATE INDEX idx_detalle_egresos_egreso   ON detalle_egresos(egreso_id);
CREATE INDEX idx_mov_stock_producto       ON movimientos_stock(producto_id);
CREATE INDEX idx_mov_stock_tipo           ON movimientos_stock(tipo);
CREATE INDEX idx_mov_stock_created_at     ON movimientos_stock(created_at);
CREATE INDEX idx_facturas_cliente         ON facturas(cliente_id);
CREATE INDEX idx_facturas_fecha           ON facturas(fecha);
CREATE INDEX idx_facturas_estado_pago     ON facturas(estado_pago);
CREATE INDEX idx_facturas_usuario         ON facturas(usuario_id);
CREATE INDEX idx_detalle_facturas_factura ON detalle_facturas(factura_id);
CREATE INDEX idx_facturas_deudas_factura  ON facturas_deudas(factura_id);
CREATE INDEX idx_facturas_deudas_cliente  ON facturas_deudas(cliente_id);
CREATE INDEX idx_facturas_deudas_fecha    ON facturas_deudas(fecha_pago);
CREATE INDEX idx_cajas_chicas_fecha       ON cajas_chicas(fecha);
CREATE INDEX idx_cajas_chicas_estado      ON cajas_chicas(estado);
CREATE INDEX idx_mov_cajas_chicas_caja    ON movimientos_cajas_chicas(caja_chica_id);
CREATE INDEX idx_cajas_banco_fecha        ON cajas_banco(fecha);
CREATE INDEX idx_cajas_banco_estado       ON cajas_banco(estado);
CREATE INDEX idx_mov_cajas_banco_caja     ON movimientos_cajas_banco(caja_banco_id);
CREATE INDEX idx_mov_cajas_banco_cat      ON movimientos_cajas_banco(categoria);
CREATE INDEX idx_ventas_tarjeta_estado    ON ventas_tarjeta(estado);
CREATE INDEX idx_ventas_tarjeta_cliente   ON ventas_tarjeta(cliente_id);
CREATE INDEX idx_cuentas_tipo             ON cuentas(tipo);
CREATE INDEX idx_cuentas_estado           ON cuentas(estado);
