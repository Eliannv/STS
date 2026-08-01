# Sales Technology System

## Descripción del Problema

La Óptica Macías operaba con un sistema basado en Firebase (Firestore + Auth) que presentaba limitaciones significativas en la ejecución de consultas complejas, control de transacciones ACID, generación de reportes financieros y escalabilidad a mediano plazo. La gestión de inventario, ventas, historial clínico de clientes, cajas y cuentas era fragmentada, generando ineficiencias operativas, inconsistencias en los datos y dificultad para obtener indicadores de negocio en tiempo real.

El tráfico del frontend entra por `bff-servicio` en `http://localhost:3000`.

| Servicio | API | PostgreSQL para pgAdmin |
|---|---:|---:|
| usuario-servicio | 3001 | 5433 |
| cliente-servicio | 3002 | 5434 |
| inventario-servicio | 3003 | 5435 |
| facturacion-servicio | 3004 | 5436 |
| caja-servicio | 3005 | 5437 |
| bff-servicio | 3000 | — |

## Contexto

La Óptica Macías es un negocio del sector óptico con múltiples sucursales que requiere gestionar simultáneamente las siguientes áreas operativas:

- Inventario de productos físicos: armazones, lunas, lentes de contacto y líquidos de mantenimiento.
-	Servicios ópticos con historial clínico de pacientes (prescripciones OD/OI).
-	Ventas al contado y a crédito con control de deudas y abonos parciales.
-	Apertura y cierre de cajas chicas y cuentas bancarias diarias.
-	Relación con proveedores: ingresos y egresos de mercadería con trazabilidad Kardex.
-	Usuarios con roles diferenciados: Administrador y Operador.

