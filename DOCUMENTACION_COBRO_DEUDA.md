# Módulo Cobro de Deuda - Documentación de Implementación

## 📋 Resumen Ejecutivo

Se ha implementado un módulo completo de **Cobro de Deuda (Cuentas por Cobrar)** en el proyecto STS siguiendo la arquitectura hexagonal. El sistema permite registrar abonos parciales a facturas pendientes, con integración automática a Caja Banco y generación de comprobantes.

---

## 🏗️ Arquitectura Implementada

### Patrón: Hexagonal (Puertos y Adaptadores)

```
ENTRADA (HTTP) → Controlador → Use Case (Lógica)
                                    ↓
                            Adaptadores (BD)
                                    ↓
                              PostgreSQL
```

### Flujo Principal

```
Cliente Frontend (POST /cobro-deuda/registrar-abono)
  ↓
CobroDeudaControlador
  ↓
CobroDeudaCommandUsesCase
  ↓
CobroDeudaPgsCommandAdaptador
  ├─ INSERT facturas_deudas (registrar abono)
  ├─ UPDATE facturas (actualizar saldo)
  ├─ UPDATE clientes (actualizar bandera tiene_deuda)
  └─ Registrar en CajaBancoCommandUC (integración)
```

---

## 📁 Archivos Creados

### Backend (/servidor/src/)

#### Dominio
- **`dominio/entidades/CobroDeuda.js`**
  - Entidad que representa un abono/pago parcial
  - Propiedades: id, facturaId, fechaPago, montoPagado, metodoPago, usuarioId, saldoAnterior, saldoNuevo

#### Aplicación - DTOs
- **`aplicacion/dto/CobroDeudaDTO.js`**
  - DTO para validación y normalización de datos
  - Implementa getters para cada propiedad

#### Aplicación - Use Cases
- **`aplicacion/uses-cases/command/CobroDeudaCommandUsesCase.js`**
  - `registrarAbono(datos)`: Registra un abono con validaciones
  - `registrarMultipleAbonos(abonos)`: Carga masiva de abonos
  - Valida montoPagado > 0 y facturaId requerido

- **`aplicacion/uses-cases/query/CobroDeudaQueryUsesCase.js`**
  - `facturasPendientes(clienteId, filtros)`: Lista facturas con saldo pendiente
  - `abonosPorFactura(facturaId)`: Historial de abonos
  - `abonoPorId(id)`: Obtiene un abono específico
  - `resumenClienteDeuda(clienteId)`: Deuda total del cliente
  - `listaAbonos(filtros)`: Lista general con filtros

#### Aplicación - Puertos (Interfaces)
- **`aplicacion/puertos/entrada/CobroDeudaEntradaPuerto.js`**
  - Define contrato que implementa el Controlador

- **`aplicacion/puertos/salida/CobroDeudaCommandSalidaPuerto.js`**
  - Define contrato para operaciones de escritura

- **`aplicacion/puertos/salida/CobroDeudaQuerySalidaPuerto.js`**
  - Define contrato para operaciones de lectura

#### Infraestructura - Adaptadores
- **`infraestructura/adaptador-entrada/CobroDeudaControlador.js`**
  - Maneja peticiones HTTP
  - Integración con Caja Banco
  - Métodos:
    - `registrarAbono(req, res)`: POST /cobro-deuda/registrar-abono
    - `facturasPendientes(req, res)`: GET /cobro-deuda/facturas-pendientes
    - `abonosPorFactura(req, res)`: GET /cobro-deuda/facturas/:facturaId/abonos
    - `obtenerAbono(req, res)`: GET /cobro-deuda/abonos/:abonoId
    - `resumenDeuda(req, res)`: GET /cobro-deuda/cliente/:clienteId/resumen
    - `listaAbonos(req, res)`: GET /cobro-deuda/lista-abonos

- **`infraestructura/adaptador-salida/CobroDeudaPgsCommandAdaptador.js`**
  - Implementa persistencia de abonos
  - Lógica transaccional (BEGIN/COMMIT/ROLLBACK)
  - Operaciones:
    1. Lock pesimista en factura (FOR UPDATE)
    2. Validación de monto
    3. INSERT en facturas_deudas
    4. UPDATE en facturas (abonado, saldo_pendiente, estado_pago)
    5. UPDATE en clientes (tiene_deuda flag)

- **`infraestructura/adaptador-salida/CobroDeudaPgsQueryAdaptador.js`**
  - Consultas optimizadas con JOINs
  - Filtros dinámicos
  - Campos calculados (cantidad_abonos, total_abonado, etc.)

#### Infraestructura - Contenedor (IoC)
- **`infraestructura/contenedor/CobroDeudaContenedor.js`**
  - Inyección de dependencias
  - Instancia singleton del controlador

#### Infraestructura - Rutas
- **`infraestructura/rutas/moduloCobroDeudaRutas.js`**
  - Router Express con autenticación
  - Registra todos los endpoints

#### App Principal
- **`app.js`** (MODIFICADO)
  - Importa `cobroDeudaRutas`
  - Registra ruta: `app.use('/api/cobro-deuda', cobroDeudaRutas)`

### Frontend (/cliente/src/)

#### Páginas
- **`pages/ventas/CobrarDeuda.jsx`** (ACTUALIZADO)
  - Interfaz de cobro de deudas mejorada
  - Cambio de API: usa nuevo endpoint `/cobro-deuda/registrar-abono`
  - Validaciones en cliente:
    - Monto no puede exceder saldo pendiente
    - Monto debe ser > 0
  - Integración de impresión de comprobante

---

## 🔌 Endpoints API

### Base URL: `/api/cobro-deuda`

#### 1. Registrar Abono
```http
POST /registrar-abono
Content-Type: application/json
Authorization: Bearer <token>

{
  "facturaId": 123,
  "montoPagado": 100.00,
  "metodoPago": "Efectivo",  // o "Transferencia", "Tarjeta"
  "fechaPago": "2025-06-19T14:30:00",  // opcional
  "observacion": "Primer abono",  // opcional
  "saldoAnterior": 200.00,  // informativo
  "saldoNuevo": 100.00  // informativo
}

Respuesta 201:
{
  "estado": "ok",
  "resultado": {
    "id": 456,
    "factura": {...},
    "abono": {...},
    "facturaCompleta": false  // true si estado_pago = 'PAGADA'
  }
}
```

#### 2. Listar Facturas Pendientes
```http
GET /facturas-pendientes?clienteId=123&buscar=FAC&fechaDesde=2025-01-01
Authorization: Bearer <token>

Respuesta 200:
{
  "estado": "ok",
  "resultado": [
    {
      "id": 1,
      "id_personalizado": "0000000123",
      "cliente_id": 50,
      "total": 500.00,
      "abonado": 150.00,
      "saldo_pendiente": 350.00,
      "estado_pago": "PENDIENTE",
      "cantidad_abonos": 2,
      "total_abonado": 150.00,
      ...
    }
  ]
}
```

#### 3. Obtener Abonos de Factura
```http
GET /facturas/123/abonos
Authorization: Bearer <token>

Respuesta 200:
{
  "estado": "ok",
  "resultado": [
    {
      "id": 1,
      "factura_id": 123,
      "fecha_pago": "2025-06-19T14:30:00",
      "monto_pagado": 100.00,
      "metodo_pago": "Efectivo",
      "usuario_nombre": "Admin User",
      "observacion": "Primer abono",
      "saldo_restante": 400.00
    }
  ]
}
```

#### 4. Obtener Abono Específico
```http
GET /abonos/456
Authorization: Bearer <token>

Respuesta 200: Detalle completo del abono
```

#### 5. Resumen de Deuda del Cliente
```http
GET /cliente/50/resumen
Authorization: Bearer <token>

Respuesta 200:
{
  "estado": "ok",
  "resultado": {
    "facturas_pendientes": 3,
    "monto_total_deuda": 1500.00,
    "monto_total_pagado": 500.00,
    "monto_saldo_pendiente": 1000.00,
    "total_abonos_registrados": 5,
    "ultimo_abono_fecha": "2025-06-19T14:30:00",
    "total_cobrado": 500.00
  }
}
```

#### 6. Lista General de Abonos
```http
GET /lista-abonos?clienteId=50&fechaDesde=2025-06-01&metodoPago=Efectivo
Authorization: Bearer <token>

Respuesta 200: Array de abonos con filtros aplicados
```

---

## 🗄️ Cambios en Base de Datos

### Tabla FACTURAS_DEUDAS (EXISTENTE - AHORA POBLADA)

```sql
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
  observacion              TEXT,  -- NUEVA COLUMNA
  created_at               TIMESTAMPTZ   DEFAULT NOW()
);
```

### Tabla FACTURAS (CAMBIOS DE LÓGICA)

**Antes:**
- `estado_pago` siempre era 'PAGADA' al crear
- `saldo_pendiente` se calculaba como 0

**Ahora:**
- Si `tipo_venta = 'CREDITO'`: `estado_pago = 'PENDIENTE'` y `saldo_pendiente > 0`
- Si `tipo_venta = 'CONTADO'`: `estado_pago = 'PAGADA'` y `saldo_pendiente = 0`
- Campo `abonado` se actualiza con cada abono parcial

### Tabla CLIENTES (CAMBIOS DE LÓGICA)

- Flag `tiene_deuda` se actualiza dinámicamente según si hay facturas con `estado_pago = 'PENDIENTE'`
- Columna `ultima_actualizacion_deuda` se registra al registrar un abono

---

## 💰 Integración con Caja Banco

Cuando se registra un abono, se genera automáticamente un movimiento en `movimientos_cajas_banco`:

```javascript
// En CobroDeudaControlador.registrarAbono()
{
  cajaBancoId:    cajaAbierta.id,
  tipo:           'INGRESO',
  categoria:      'TRANSFERENCIA_CLIENTE', // según método pago
  descripcion:    'Cobro de Deuda - Factura #...',
  monto:          montoPagado,
  ventaId:        null,
  usuarioId:      usuario.id,
  usuarioNombre:  usuario.nombre,
  referencia:     'ABONO-<id>' // para rastreo
}
```

### Condiciones:
- ✅ Se registra si hay caja banco abierta
- ✅ Se registra para métodos: Efectivo, Transferencia, Tarjeta
- ✅ No impide el abono si falla (log warning)

---

## 🔐 Seguridad y Validaciones

### En Backend (Adaptador)

1. **Lock Pesimista**: `SELECT ... FOR UPDATE` en la factura
   - Evita condiciones de carrera (race conditions)
   - Transacción ACID completa

2. **Validaciones de Monto**
   - `montoPagado > 0`: No permite $0
   - `montoPagado <= saldoPendiente`: No permite cobrar más del saldo
   - Redondeo a 2 decimales

3. **Validaciones de Factura**
   - Factura debe existir
   - Cliente debe existir (FK)
   - Usuario debe existir (FK)

### En Frontend (CobrarDeuda.jsx)

1. Validación: `abonoNum > 0`
2. Validación: `abonoNum <= saldoPendiente`
3. Campo abono requiere entrada manual (no predeterminado)

### Middleware

- `authMiddleware()`: Requiere token válido
- Todos los endpoints están protegidos

---

## 📊 Casos de Uso

### Caso 1: Cliente Compra a Crédito

```
1. Ejecutor: Cliente paga en TARJETA_CREDITO
2. FacturaControlador.crear()
   - Crea factura con tipo_venta='CREDITO'
   - abonado=0, saldo_pendiente=total, estado_pago='PENDIENTE'
3. Factura aparece en "Facturas Pendientes"
```

### Caso 2: Primer Abono Parcial

```
1. Ejecutor: Operador selecciona factura pendiente
2. Ingresa $100 de $500 deudados
3. CobroDeudaControlador.registrarAbono()
   - INSERT facturas_deudas (monto=100, saldo_restante=400)
   - UPDATE facturas (abonado=100, saldo_pendiente=400, estado_pago='PENDIENTE')
   - INSERT movimientos_cajas_banco (ingreso $100)
4. Imprime comprobante con: original $500, pagado $100, saldo $400
```

### Caso 3: Factura Totalmente Cancelada

```
1. Último abono: $400 (completando los $500)
2. CobroDeudaPgsCommandAdaptador:
   - Detecta: nuevoSaldo = 500 - 400 = 0
   - Establece: estado_pago='PAGADA', saldo_pendiente=0
3. Factura sale de "Facturas Pendientes"
4. Cliente.tiene_deuda = FALSE (si no hay más pendientes)
5. Comprobante muestra: "FACTURA TOTALMENTE CANCELADA"
```

---

## 🧪 Pruebas Manuales

### 1. Crear Factura a Crédito (Terminal)

```bash
curl -X POST http://localhost:3000/api/factura/crear \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "clienteId": 1,
    "nombreCliente": "Juan Pérez",
    "tipo": "CREDITO",
    "metodoPago": "TARJETA_CREDITO",
    "subtotal": 400,
    "descuento": 0,
    "total": 500,
    "saldoPendiente": 500,
    "items": [...]
  }'
```

### 2. Listar Facturas Pendientes

```bash
curl http://localhost:3000/api/cobro-deuda/facturas-pendientes?clienteId=1 \
  -H "Authorization: Bearer <token>"
```

### 3. Registrar Abono

```bash
curl -X POST http://localhost:3000/api/cobro-deuda/registrar-abono \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "facturaId": 1,
    "montoPagado": 100,
    "metodoPago": "Efectivo",
    "observacion": "Primer pago"
  }'
```

---

## 📝 Cambios Realizados en Archivos Existentes

### 1. `app.js`
- ✅ Importación: `import cobroDeudaRutas from './infraestructura/rutas/moduloCobroDeudaRutas.js'`
- ✅ Registro: `app.use('/api/cobro-deuda', cobroDeudaRutas)`

### 2. `CobrarDeuda.jsx`
- ✅ Cambio de endpoint: `api.post('/cobro-deuda/registrar-abono', {...})`
- ✅ Eliminada lógica de edición directa de factura
- ✅ Validación mejorada: `abonoNum <= saldoActual`

---

## 🚀 Cómo Usar desde Frontend

### Opción 1: Módulo Cobro de Deuda (Página Completa)

```jsx
// En router
<Route path="/cobro-deuda" element={<CobrarDeuda />} />

// Usar
navigate('/cobro-deuda');
```

### Opción 2: Registrar Abono Programáticamente

```jsx
import { api } from '../../api/api';

async function cobrarDeuda(facturaId, monto, metodo) {
  const res = await api.post('/cobro-deuda/registrar-abono', {
    facturaId,
    montoPagado: monto,
    metodoPago: metodo,
  });
  
  if (res.ok) {
    console.log('Abono registrado:', res.data.resultado);
  }
}
```

### Opción 3: Ver Facturas Pendientes

```jsx
const [pendientes, setPendientes] = useState([]);

useEffect(() => {
  api.get('/cobro-deuda/facturas-pendientes?clienteId=1').then(r => {
    if (r.ok) setPendientes(r.data.resultado);
  });
}, []);
```

---

## 📦 Dependencias (Sin nuevas requeridas)

El proyecto usa:
- Express.js (ya presente)
- PostgreSQL (ya presente)
- Arquitectura Hexagonal (ya implementada)

---

## ⚠️ Notas Importantes

1. **Transacciones ACID**: Todos los abonos son atómicos (todo o nada)
2. **Locks**: Se usa lock pesimista en facturas para evitar race conditions
3. **Auditoría**: Cada abono registra usuario_id y timestamp
4. **Reversibilidad**: Los abonos NO se pueden eliminar (solo marcables como anulados si se implementa)
5. **Caja Banco**: Movimientos se crean automáticamente (no afecta si falla)

---

## 🔍 Validaciones Implementadas

### En CobroDeudaCommandUsesCase.registrarAbono()
```javascript
❌ if (!facturaId) → error: 'facturaId es requerido'
❌ if (montoPagado <= 0) → error: 'El monto pagado debe ser mayor a 0'
```

### En CobroDeudaPgsCommandAdaptador.registrarAbono()
```javascript
❌ if (factura no existe) → error: 'Factura no encontrada'
❌ if (montoPagado > saldoPendiente) → error con ambos montos
❌ if (validaciones BD fallan) → ROLLBACK transacción
```

### En CobroDeudaControlador.registrarAbono()
```javascript
✅ usuario_id se obtiene de req.usuario.id (autenticado)
✅ fechaPago se normaliza a ISO
✅ Caja Banco: no impide abono si falla (log warning)
```

---

## 📞 Soporte y Troubleshooting

### Error: "Factura no encontrada"
- Verificar que facturaId sea válido
- Confirmar que la factura existe en BD

### Error: "Monto ... excede saldo pendiente"
- Validar en cliente antes de enviar
- Recalcular saldo_pendiente

### Error: "No hay caja banco abierta"
- Es warning, no impide el abono
- Verificar que Caja Banco esté abierta para que se registre movimiento

### Falta movimiento en Caja Banco
- Verificar logs del servidor
- Confirmar que caja banco esté abierta en esa fecha
- Revisar permisos del usuario

---

## 🎯 Próximas Mejoras (Recomendadas)

1. **Anulación de Abonos**: Agregar endpoint DELETE con auditoría
2. **Alertas**: Notificar por email cuando factura vence
3. **Reportes**: Reporte de cobros por día/mes/método
4. **Descuentos**: Permitir descuentos automáticos por pronto pago
5. **Proyecciones**: Predecir ingresos basado en pagos parciales
6. **Dunning**: Recordatorios automáticos de pagos vencidos

---

## ✅ Resumen de Implementación

| Aspecto | Estado |
|--------|--------|
| **Entidades** | ✅ CobroDeuda creada |
| **DTOs** | ✅ CobroDeudaDTO implementado |
| **Use Cases** | ✅ Command y Query listos |
| **Puertos** | ✅ Entrada, Command, Query |
| **Adaptadores** | ✅ Pgs Command y Query |
| **Controlador** | ✅ Todos los endpoints |
| **Rutas** | ✅ Registradas en app.js |
| **Frontend** | ✅ CobrarDeuda.jsx actualizado |
| **Caja Banco** | ✅ Integrada automáticamente |
| **Validaciones** | ✅ Backend y Frontend |
| **Documentación** | ✅ Completa |

---

**Versión:** 1.0  
**Fecha:** 2025-06-19  
**Autor:** Sistema STS - Módulo Cobro de Deuda
