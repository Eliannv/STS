CREATE TYPE rol_usuario AS ENUM ('ADMINISTRADOR', 'OPERADOR');

CREATE TABLE sucursales (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  direccion VARCHAR(255),
  telefono VARCHAR(30),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_por_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100),
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  cedula VARCHAR(20),
  fecha_nacimiento DATE,
  rol rol_usuario NOT NULL DEFAULT 'OPERADOR',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  sucursal_id INTEGER REFERENCES sucursales(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sucursales
  ADD CONSTRAINT fk_sucursales_creado_por
  FOREIGN KEY (creado_por_id) REFERENCES usuarios(id) ON DELETE SET NULL;

CREATE INDEX idx_usuarios_nombre ON usuarios (nombre, apellido);
CREATE INDEX idx_usuarios_sucursal_id ON usuarios (sucursal_id);
CREATE INDEX idx_usuarios_activo ON usuarios (activo);
