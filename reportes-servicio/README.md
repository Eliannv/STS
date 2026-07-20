# reportes-servicio

Microservicio de consulta y composición de reportes. No posee base de datos propia y solamente consume las APIs REST de los demás microservicios.

## Contrato estándar

Todos los endpoints de reportes devuelven el mismo contrato estándar. El primer flujo validado funcionalmente es `GET /api/v1/reportes/ventas/general` y su respuesta exitosa tiene esta forma:

```json
{
  "success": true,
  "report": {
    "id": "ventas-generales",
    "title": "Ventas generales",
    "shortTitle": "Ventas",
    "generatedAt": "2026-07-20T00:00:00.000Z",
    "summary": {},
    "filters": {},
    "columns": [],
    "rows": [],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalRows": 0,
      "totalPages": 0
    }
  }
}
```

Los demás endpoints reutilizan la misma envoltura y sus casos de uso conservan la lógica existente. Sus columnas y filas se irán refinando progresivamente sin cambiar el contrato.

## Endpoints

Todos requieren `Authorization: Bearer <token>` y están publicados bajo `/api/v1/reportes`:

- `GET /ventas/general`
- `GET /kardex/producto/:productoId`
- `GET /kardex/fecha`
- `GET /inventario/actual`
- `GET /inventario/valorizado`
- `GET /inventario/sin-stock`
- `GET /inventario/stock-minimo`
- `GET /ventas/mas-vendidos`
- `GET /ventas/menos-vendidos`
- `GET /compras/proveedor`
- `GET /ingresos/mercaderia`
- `GET /egresos/mercaderia`
- `GET /ventas/fecha`
- `GET /ventas/sucursal`
- `GET /ventas/usuario`
- `GET /ventas/cliente`
- `GET /utilidad/ventas`
- `GET /caja/flujo`
- `GET /cuentas-cobrar/estado`
- `GET /dashboard/indicadores`
