# 📱 Guía de Usuario - Módulo Cobro de Deuda

## Para Operadores de Caja

---

## 🎯 Objetivo
Registrar pagos parciales de facturas pendientes, generar comprobantes y actualizar saldos automáticamente.

---

## 📍 Acceso al Módulo

1. Click en el menú lateral → **Ventas**
2. Seleccionar **Cobro de Deuda** (o ir directo a `/cobro-deuda`)

---

## ⚙️ Cómo Usar - Paso a Paso

### Paso 1: Buscar Cliente

```
┌─────────────────────────────────┐
│ Buscar cliente con deuda...     │ ← Escribir nombre o cédula
└─────────────────────────────────┘
```

- Escribe nombre o cédula
- Sistema filtra automáticamente
- Selecciona de la lista desplegable
- Aparecerá en barra roja: "Con deuda - 3 pendientes"

### Paso 2: Seleccionar Factura

```
FACTURAS PENDIENTES          REGISTRAR ABONO
────────────────────        ──────────────────
┌──────────────────────┐
│ FAC #123 - 2025-06   │    [Factura seleccionada]
│ Total: $500          │    
│ 📌 PENDIENTE $500    │    ID: FAC-0000000123
└──────────────────────┘    Fecha: 19/06/2025 14:30
```

- Haz click en una factura de la lista
- Se destaca con fondo azul
- Aparecen los detalles en el panel derecho

### Paso 3: Ingresar Monto

```
┌─────────────────────────────┐
│ ABONO                       │
│ $ 0.00                      │ ← Escribir monto a cobrar
└─────────────────────────────┘

Botones rápidos:
┌─────────────┬─────────────┐
│ Pagar todo  │    50%      │
│   $500      │   $250      │
└─────────────┴─────────────┘
```

- Escribe el monto exacto
- O usa botones rápidos:
  - **Pagar todo**: Cobra el saldo completo
  - **50%**: Cobra la mitad del saldo

### Paso 4: Seleccionar Método de Pago

```
┌─────────────────────────────┐
│ MÉTODO DE PAGO              │
│ ▼ [Efectivo]                │
│  • Efectivo                 │
│  • Transferencia            │
│  • Tarjeta                  │
└─────────────────────────────┘
```

**Efectivo:**
- Métodos simple
- Sin datos adicionales
- ✅ Se registra inmediatamente

**Transferencia:**
- Solicita: Código de transferencia
- Solicita: Fecha y hora de pago
- ✅ Se registra en Caja Banco

**Tarjeta:**
- Solicita: Últimos 4 dígitos
- Solicita: Fecha y hora de pago
- ✅ Se registra en Caja Banco

### Paso 5: Agregar Referencia (Opcional)

```
┌─────────────────────────────┐
│ Nº DE REFERENCIA (opcional) │
│ ┌────────────────────────┐  │
│ │ TRF-20250619-001234    │  │
│ └────────────────────────┘  │
└─────────────────────────────┘
```

- Para Transferencia: código operación (Banco Pichincha, etc)
- Para Tarjeta: últimos 4 dígitos
- Para Efectivo: observación (opcional)

### Paso 6: Guardar e Imprimir

```
┌──────────────┬────────────────────────┐
│  CANCELAR    │  GUARDAR + IMPRIMIR    │
└──────────────┴────────────────────────┘
```

- Click en **GUARDAR + IMPRIMIR**
- ✅ El sistema:
  1. Registra el abono
  2. Actualiza saldo
  3. Registra en Caja Banco
  4. Abre impresora
  5. Imprime comprobante

---

## 📋 Comprobante de Cobro

El sistema imprime automáticamente:

```
╔════════════════════════════════════════╗
║     ÓPTICA MACÍAS - COMPROBANTE        ║
╠════════════════════════════════════════╣
║                                        ║
║ TIPO DE DOCUMENTO:  ABONO A FACTURA   ║
║ FECHA: 19/06/2025 14:35               ║
║                                        ║
║ ─────────────────────────────────────  ║
║ CLIENTE:  Juan Pérez García            ║
║ CÉDULA:   0705123456-7                 ║
║ ─────────────────────────────────────  ║
║                                        ║
║ FACTURA ORIGINAL:   #0000000123       ║
║ FECHA FACTURA:      15/06/2025        ║
║ MONTO ORIGINAL:     $500.00            ║
║                                        ║
║ ─────────────────────────────────────  ║
║ DETALLES DEL ABONO:                    ║
║                                        ║
║ Saldo anterior:     $500.00            ║
║ Monto cobrado:      $100.00 (✓)        ║
║ ─────────────────────────────────────  ║
║ SALDO NUEVO:        $400.00            ║
║                                        ║
║ MÉTODO DE PAGO:     EFECTIVO           ║
║ USUARIO:            Admin User         ║
║                                        ║
║ ═════════════════════════════════════  ║
║ Vuelto a entregar:  $0.00              ║
║                                        ║
║ Conserve este comprobante              ║
╚════════════════════════════════════════╝
```

---

## ⚡ Ejemplos Comunes

### Ejemplo 1: Cliente Paga el 20% en Efectivo

```
Factura: $500
Pagos anteriores: $100
Saldo: $400

Ingreso: $80 (20% de $400)
Método: Efectivo

Resultado:
├─ Saldo anterior: $400
├─ Pagado: $80
└─ Nuevo saldo: $320
```

### Ejemplo 2: Cliente Completa Pago por Transferencia

```
Factura: $500
Pagos anteriores: $450
Saldo: $50

Ingreso: $50 (Pagar todo)
Método: Transferencia
Ref: TRF-ABC-001

Resultado:
├─ Saldo anterior: $50
├─ Pagado: $50
└─ ✅ FACTURA TOTALMENTE CANCELADA
```

### Ejemplo 3: Cliente da Vuelto

```
Factura: $500
Saldo: $380

Cliente da: $500 en efectivo
Monto cobro: $380

Resultado:
├─ Pagado: $380
├─ Vuelto: $120 ← IMPORTANTE: ENTREGAR AL CLIENTE
└─ Nuevo saldo: $0
```

---

## ✅ Validaciones del Sistema

El sistema NO permitirá:

| Intento | Resultado |
|---------|-----------|
| Monto = $0 | ❌ Error: Debe ser > 0 |
| Monto > Saldo | ❌ Error: Excede pendiente |
| Sin seleccionar factura | ❌ Botón deshabilitado |
| Sin ingresar monto | ❌ Botón deshabilitado |
| Usuario no autenticado | ❌ Requiere login |

---

## 🔍 Ver Historial de Abonos

### Desde la lista de facturas

1. Selecciona un cliente
2. Las facturas muestran cantidad de abonos: `2 abonos`
3. Click en la factura
4. En el panel derecho aparece historial

### Información disponible

- ✅ Fecha y hora de cada abono
- ✅ Monto pagado
- ✅ Método de pago utilizado
- ✅ Usuario que registró
- ✅ Saldo después de cada pago
- ✅ Observaciones

---

## 💡 Tips & Trucos

### ⚡ Abono Rápido (3 clicks)
1. Buscar cliente → click
2. Seleccionar factura → click
3. Click "Pagar todo" → click GUARDAR

### 🎯 Verificar Deuda Total del Cliente
- En la barra roja superior:
  ```
  "3 pendientes · Deuda total: $1,450.00"
  ```

### 📝 Agregar Notas
- Campo "Referencia" es para datos importantes
- Evita confusiones en auditoría

### 🖨️ Si Falla la Impresión
- El abono se registra igual
- Puedes imprimir el comprobante después desde historial

### 🔄 Cambiar de Cliente
- Click en la ✕ roja en barra de cliente
- Vuelve a buscar uno nuevo

---

## ⚠️ Errores Comunes

### Error: "Monto excede saldo pendiente"
**Causa:** Ingresaste más del saldo disponible  
**Solución:** Verifica el saldo en la factura y reduce el monto

### Error: "Factura no encontrada"
**Causa:** Error del sistema (muy raro)  
**Solución:** Recarga la página y reintentas

### No aparece cliente en búsqueda
**Causa:** Cliente no tiene deudas  
**Solución:** Solo aparecen clientes CON deuda pendiente

### Comprobante no imprime
**Causa:** Fallo en impresora  
**Solución:** Verifica que impresora esté encendida y conectada

---

## 📞 Soporte

Si encuentras problemas:

1. **Problema técnico**: Contacta al equipo de IT
2. **Pregunta de negocio**: Consulta al Gerente
3. **Error del sistema**: Anota:
   - Qué intentabas hacer
   - Qué mensaje de error salió
   - Hora y fecha
   - Cliente involucrado

---

## 🎓 Capacitación Rápida

### Sesión 1 (5 min): Lo básico
- ✅ Buscar cliente
- ✅ Seleccionar factura
- ✅ Cobrar en efectivo

### Sesión 2 (10 min): Métodos de pago
- ✅ Transferencia
- ✅ Tarjeta
- ✅ Datos adicionales

### Sesión 3 (10 min): Casos especiales
- ✅ Vuelto
- ✅ Descuentos (futuro)
- ✅ Factura completa

---

## 📊 Reporte Diario

**Para el Cierre de Caja:**

1. Sistema registra automáticamente todos los abonos
2. Caja Banco se actualiza en tiempo real
3. No necesitas hacer nada manual
4. Los movimientos aparecen en "Movimientos Caja Banco"

---

## 🎉 ¡Listo!

Ya sabes cómo usar el módulo Cobro de Deuda.

**Recuerda:**
- ✅ Siempre guarda el comprobante
- ✅ Entrega el comprobante al cliente
- ✅ Verifica el vuelto si aplica
- ✅ Cierra Caja Banco al final del día

---

**Versión:** 1.0  
**Última actualización:** 2025-06-19  
**Para:** Operadores de Caja - STS Óptica Macías
