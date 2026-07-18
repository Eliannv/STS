# Sistema Óptica Macías

## Entorno activo

El entorno de microservicios se ejecuta con:

```powershell
docker compose up -d
```

El tráfico del frontend entra por `bff-servicio` en `http://localhost:3000`.

| Servicio | API | PostgreSQL para pgAdmin |
|---|---:|---:|
| usuario-servicio | 3001 | 5433 |
| cliente-servicio | 3002 | 5434 |
| inventario-servicio | 3003 | 5435 |
| facturacion-servicio | 3004 | 5436 |
| caja-servicio | 3005 | 5437 |
| bff-servicio | 3000 | — |

## Respaldo legado

`servidor/` conserva el monolito original y está desactivado por defecto mediante el perfil Compose `legacy`.
