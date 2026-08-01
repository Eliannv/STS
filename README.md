# Sales Technology System - Óptica Macias

<p align="center"><img width="375" height="375" alt="Logo 20" src="https://github.com/user-attachments/assets/d0a73f72-1878-4d63-b6b2-8f76338f540f" /></p>



## Descripción del Problema

La Óptica Macías operaba con un sistema basado en Firebase (Firestore + Auth) que presentaba limitaciones significativas en la ejecución de consultas complejas, control de transacciones ACID, generación de reportes financieros y escalabilidad a mediano plazo. La gestión de inventario, ventas, historial clínico de clientes, cajas y cuentas era fragmentada, generando ineficiencias operativas, inconsistencias en los datos y dificultad para obtener indicadores de negocio en tiempo real.

## Contexto

La Óptica Macías es un negocio del sector óptico con múltiples sucursales que requiere gestionar simultáneamente las siguientes áreas operativas:

- Inventario de productos físicos: armazones, lunas, lentes de contacto y líquidos de mantenimiento.
-	Servicios ópticos con historial clínico de pacientes (prescripciones OD/OI).
-	Ventas al contado y a crédito con control de deudas y abonos parciales.
-	Apertura y cierre de cajas chicas y cuentas bancarias diarias.
-	Relación con proveedores: ingresos y egresos de mercadería con trazabilidad Kardex.
-	Usuarios con roles diferenciados: Administrador y Operador.

## Justificación Técnica

La migración desde Firebase hacia PostgreSQL con una arquitectura hexagonal (Ports & Adapters) permite alcanzar los siguientes beneficios técnicos:

-	Transacciones ACID para garantizar integridad en operaciones críticas como ventas y movimientos de caja.
-	Separación de responsabilidades mediante capas: Dominio → Aplicación → Infraestructura.
-	Escalabilidad y mantenibilidad facilitada por la independencia del núcleo de dominio frente a cambios tecnológicos.
-	Mayor control de seguridad mediante autenticación JWT, hashing de contraseñas con bcrypt y variables de entorno cifradas.
-	Despliegue reproducible y portable mediante contenedores Docker y docker-compose.

El tráfico del frontend entra por `bff-servicio` en `http://localhost:3000`.

| Servicio | API | PostgreSQL para pgAdmin |
|---|---:|---:|
| usuario-servicio | 3001 | 5433 |
| cliente-servicio | 3002 | 5434 |
| inventario-servicio | 3003 | 5435 |
| facturacion-servicio | 3004 | 5436 |
| caja-servicio | 3005 | 5437 |
| reportes-servicio | 3006 | — |
| bff-servicio | 3000 | — |

## Características principales

- Gestión de clientes e historial clínico.
- Control de ventas al contado, crédito y pagos mixtos.
- Gestión de compras a proveedores.
- Control de inventario mediante Kardex y Ledger de movimientos.
- Gestión de cuentas por cobrar y cuentas por pagar.
- Administración de cajas chicas y cajas bancarias.
- Dashboard e indicadores en tiempo real.
- Gestión multisucursal con aislamiento por sucursal.
- Autenticación JWT y control de roles.

## Arquitectura
El sistema está construido mediante una arquitectura de microservicios siguiendo el patrón Hexagonal (Ports & Adapters).

### Comunicación

Complejidad estructural de Card y Glass a nivel arquitectónico: ΣS(i) = 75 · ΣD(i) = 132,74 · ΣC(i) = 207,74.

<img width="996" height="479" alt="image" src="https://github.com/user-attachments/assets/36217190-3b3f-449e-a35d-2098c6bd7be3" />

## Tecnologías

### Frontend

- React
- Vite
- React Router
- Axios
- Tailwind CSS
- SweetAlert2

### Backend

- Node.js
- Express
- PostgreSQL
- JWT
- bcrypt
- Docker
- Docker Compose

### Base de datos

- PostgreSQL

### Arquitectura

- Microservicios
- Arquitectura Hexagonal
- Ports & Adapters

## Estructura del proyecto

```text
src/
├── dominio/
│   ├── entidades/          (29 archivos)
│   ├── filtros/            (4 archivos)
│   └── servicios/          (7 archivos)
│
├── aplicacion/
│   ├── dto/                (20 archivos)
│   ├── puertos/
│   │   ├── entrada/        (23 archivos)
│   │   └── salida/         (51 archivos)
│   └── uses-cases/
│       ├── command/        (24 archivos)
│       └── query/          (25 archivos)
│
└── infraestructura/
    ├── adaptador-entrada/  (29 archivos)
    ├── adaptador-salida/   (55 archivos)
    ├── base-dato/          (5 archivos)
    ├── contenedor/         (22 archivos)
    ├── middleware/         (31 archivos)
    ├── modelos/            (17 archivos)
    ├── rutas/              (27 archivos)
    └── servicio/           (2 workers)
```

**Convención de nomenclatura.- El nombre del archivo indica su capa y su rol sin abrirlo.**

## Usuario de prueba

Administrador

Correo:
admin@optica.com

Contraseña:
AdminTemporal_2026!

## Flujo principal desde el backend

<img width="1426" height="467" alt="image" src="https://github.com/user-attachments/assets/abc41d7a-8876-4594-a16b-d8653c2564ef" />


## Funcionalidades

- [x] Inicio de sesión JWT
- [x] Gestión de usuarios
- [x] Gestión de clientes
- [x] Historial clínico
- [x] Gestión de inventario
- [x] Kardex
- [x] Compras
- [x] Ventas
- [x] Cuentas por cobrar
- [x] Cuentas por pagar
- [x] Dashboard
- [x] Multisucursal
- [x] Control de roles

## Capturas

### Login

<img width="1920" height="1119" alt="Login STS" src="https://github.com/user-attachments/assets/fe447261-5c47-4436-99d7-9c6541a49410" />

### Dashboard

<img width="1600" height="1008" alt="WhatsApp Image 2026-07-25 at 06 41 29" src="https://github.com/user-attachments/assets/6186e709-1dea-42ef-a029-a3acbb6b2a9c" />

### Venta

<img width="1920" height="1119" alt="Crear Venta" src="https://github.com/user-attachments/assets/328dcbb5-8e99-48ba-aa65-2ba50e2c7d98" />

<img width="1600" height="1015" alt="Impresion Ticket" src="https://github.com/user-attachments/assets/cc1af72c-f5cd-4fe5-a465-a0c85dd5910f" />

### Ficha del Cliente

<table>
<tr>
<td width="50%">
<img src="https://github.com/user-attachments/assets/114d4de2-a27c-4fad-9c67-199d369b8e44" width="100%">
</td>

<td width="50%">
<img src="https://github.com/user-attachments/assets/bbe77db4-0481-4344-a759-a083796010c3" width="100%">
</td>
</tr>

<tr>
<td width="50%">
<img src="https://github.com/user-attachments/assets/81b189fb-9b72-4cd6-a60f-aa0fdaf19666" width="100%">
</td>

<td width="50%">
<img src="https://github.com/user-attachments/assets/c9c922ca-6f12-448b-ab0d-e6e6515b1603" width="100%">
</td>
</tr>
</table>

<p align="center">
<img src="https://github.com/user-attachments/assets/f5f0bb06-0959-4b35-a26c-24f45de433fc" width="70%">
</p>
