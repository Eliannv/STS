CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  cedula VARCHAR(20) UNIQUE,
  telefono VARCHAR(30),
  email VARCHAR(150),
  fecha_nacimiento DATE,
  direccion VARCHAR(255),
  pais VARCHAR(60),
  provincia VARCHAR(60),
  ciudad VARCHAR(60),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  tiene_historial_clinico BOOLEAN NOT NULL DEFAULT FALSE,
  tiene_credito BOOLEAN NOT NULL DEFAULT FALSE,
  tiene_deuda BOOLEAN NOT NULL DEFAULT FALSE,
  ultima_actualizacion_deuda TIMESTAMPTZ,
  es_consumidor_final BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE historial_clinico (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  od_esfera NUMERIC(5,2), od_cilindro NUMERIC(5,2), od_eje NUMERIC(6,2),
  od_avsc NUMERIC(5,2), od_avcc NUMERIC(5,2),
  oi_esfera NUMERIC(5,2), oi_cilindro NUMERIC(5,2), oi_eje NUMERIC(6,2),
  oi_avsc NUMERIC(5,2), oi_avcc NUMERIC(5,2),
  dp NUMERIC(5,2), "add" NUMERIC(5,2), de VARCHAR(60), altura NUMERIC(5,2),
  color VARCHAR(60), observacion TEXT,
  armazon_h NUMERIC(5,2), armazon_v NUMERIC(5,2), armazon_dbl NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clientes_nombre ON clientes (apellidos, nombres);
CREATE INDEX idx_clientes_cedula ON clientes (cedula);
CREATE INDEX idx_historial_cliente_id ON historial_clinico (cliente_id, created_at DESC);
