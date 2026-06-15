/**
 * ticketVenta.js
 * Función reutilizable para imprimir el ticket de una venta.
 * Compatible con 80mm (punto de venta) usando la misma estructura del sistema Óptica Macías.
 *
 * Uso:
 *   import { imprimirTicketVenta } from '../utils/ticketVenta';
 *   imprimirTicketVenta({ venta, items });
 *
 * Parámetros:
 *   venta  — objeto con { id_personalizado, numero_factura, nombre_cliente, metodo_pago,
 *              subtotal, descuento, total, saldo_pendiente, created_at, tipo }
 *   items  — array de { codigo, nombre, cantidad, precio_unitario, precio_total }
 *             (puede ser vacío si se imprime desde historial sin items)
 */

const EMPRESA = {
  nombre:   'ÓPTICA MACÍAS PASAJE',
  ruc:      '0912477528001',
  ciudad:   'Pasaje - Ecuador',
  telefono: '0990391361',
};

function formatFecha(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatMonto(n) {
  return Number(n || 0).toFixed(2);
}

function generarCodigoBarras(texto) {
  if (!texto) return '';
  // SVG simple de barras (Code128-like visual) usando líneas negras y blancas
  // Para producción real se puede usar JsBarcode, pero aquí usamos un fallback visual
  return `<div style="font-family:monospace;font-size:11px;letter-spacing:2px;text-align:center;margin-top:4px">${texto}</div>`;
}

export function generarHTMLTicket({ venta, items }) {
  const facturaNo = venta.id_personalizado || venta.numero_factura || String(venta.id || '');
  const cliente   = venta.nombre_cliente   || 'CONSUMIDOR FINAL';
  const metodo    = venta.metodo_pago      || 'Efectivo';
  const fecha     = formatFecha(venta.created_at);
  const subtotal  = formatMonto(venta.subtotal);
  const descuento = Number(venta.descuento || 0);
  const total     = formatMonto(venta.total);
  const abono     = formatMonto(Number(venta.total || 0) - Number(venta.saldo_pendiente || 0));
  const saldo     = Number(venta.saldo_pendiente || 0);

  const itemsRows = (items || []).map(it => `
    <tr>
      <td style="padding:1px 3px">${it.codigo || ''}</td>
      <td style="padding:1px 3px;max-width:90px;word-wrap:break-word">${it.nombre || ''}</td>
      <td style="padding:1px 3px;text-align:center">${it.cantidad || 1}</td>
      <td style="padding:1px 3px;text-align:right">${formatMonto(it.precio_unitario)}</td>
      <td style="padding:1px 3px;text-align:right">${formatMonto(it.precio_total)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Ticket Venta</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    width: 80mm;
    padding: 4mm 3mm;
    color: #000;
  }
  .t-center  { text-align: center; }
  .t-bold    { font-weight: bold; }
  .t-small   { font-size: 10px; }
  .t-large   { font-size: 14px; }
  .t-hr      { border:none; border-top: 1px dashed #000; margin: 4px 0; }
  .t-kv      { display:flex; justify-content:space-between; margin: 1px 0; }
  .t-kv span { flex: 1; }
  .t-kv span:last-child { text-align:right; }
  table.items { width:100%; border-collapse:collapse; }
  table.items thead th { font-size:10px; border-bottom: 1px solid #000; padding: 1px 3px; }
  table.items thead th:nth-child(1) { text-align:left; }
  table.items thead th:nth-child(2) { text-align:left; }
  table.items thead th:nth-child(3) { text-align:center; }
  table.items thead th:nth-child(4) { text-align:right; }
  table.items thead th:nth-child(5) { text-align:right; }
  table.items tbody td { font-size:11px; vertical-align:top; }
  @media print {
    @page { margin: 0; size: 80mm auto; }
    body { padding: 2mm; }
  }
</style>
</head>
<body>
  <!-- ENCABEZADO -->
  <div class="t-center t-bold t-large">${EMPRESA.nombre}</div>
  <div class="t-center t-small">RUC: ${EMPRESA.ruc}</div>
  <div class="t-center t-small">${EMPRESA.ciudad}</div>
  <div class="t-center t-small">Telf: ${EMPRESA.telefono}</div>

  <hr class="t-hr">

  <!-- DATOS FACTURA -->
  <div class="t-bold">FACTURA No: ${facturaNo}</div>
  <div>Fecha: ${fecha}</div>
  <div>Cliente: ${cliente}</div>
  <div>Método pago: ${metodo}</div>

  <hr class="t-hr">

  <!-- ITEMS -->
  <table class="items">
    <thead>
      <tr>
        <th>COD</th>
        <th>NOMBRE</th>
        <th>CNT</th>
        <th>P.U</th>
        <th>P.T</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows || '<tr><td colspan="5" style="text-align:center;padding:4px;font-size:10px">Sin detalle</td></tr>'}
    </tbody>
  </table>

  <hr class="t-hr">

  <!-- TOTALES -->
  <div class="t-kv"><span>Subtotal*</span><span>$${subtotal}</span></div>
  ${descuento > 0 ? `<div class="t-kv"><span>Descuento</span><span>-$${formatMonto(descuento)}</span></div>` : ''}
  <div class="t-kv t-bold"><span>TOTAL</span><span>$${total}</span></div>
  <div class="t-kv"><span>Abono</span><span>$${abono}</span></div>
  ${saldo > 0 ? `<div class="t-kv t-bold"><span>Saldo pendiente</span><span>$${formatMonto(saldo)}</span></div>` : ''}

  <hr class="t-hr">

  <!-- PIE -->
  <div class="t-center t-small">*IVA incluido en los precios</div>
  <div class="t-center t-small" style="margin-top:4px">Gracias por su compra</div>
  <div class="t-center t-small">Conserve su factura</div>

  <hr class="t-hr">

  <!-- CÓDIGO -->
  ${generarCodigoBarras(facturaNo)}
</body>
</html>`;
}

/**
 * Abre ventana emergente e imprime el ticket de venta.
 *
 * @param {object} params
 * @param {object} params.venta  — datos de la venta guardada
 * @param {Array}  params.items  — líneas del carrito (productos/servicios)
 */
export function imprimirTicketVenta({ venta, items = [] }) {
  const html = generarHTMLTicket({ venta, items });

  const w = window.open('', 'TICKET_VENTA', 'height=700,width=400,scrollbars=yes');
  if (!w) {
    alert('No se pudo abrir la ventana de impresión. Permite ventanas emergentes para este sitio.');
    return;
  }

  w.document.open();
  w.document.write(html);
  w.document.close();

  // Esperar carga completa antes de imprimir
  w.onload = () => {
    w.focus();
    w.print();
    // Cerrar automáticamente tras imprimir (o en 3s como fallback)
    const safeClose = () => { try { w.close(); } catch (_) {} };
    w.addEventListener('afterprint', safeClose);
    setTimeout(safeClose, 3000);
  };
}

/* ─────────────── TICKET ABONO / COBRO DEUDA ─────────────── */

function generarHTMLTicketAbono({ factura, abono, saldoAnterior, saldoNuevo, cliente, metodoPago, referencia, fechaPago }) {
  const facturaNo   = factura.id_personalizado || String(factura.id || '');
  const clienteNom  = cliente?.nombres ? `${cliente.nombres} ${cliente.apellidos}` : (factura.cliente_nombre || 'CONSUMIDOR FINAL');
  const fecha       = formatFecha(fechaPago || new Date().toISOString());
  const abonadoPrev = formatMonto(parseFloat(factura.total || 0) - parseFloat(saldoAnterior || 0));
  const abonadoTotal = formatMonto(parseFloat(factura.total || 0) - parseFloat(saldoNuevo || 0));

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Comprobante Abono</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Courier New',Courier,monospace; font-size:12px; width:80mm; padding:4mm 3mm; color:#000; }
  .t-center { text-align:center; }
  .t-bold   { font-weight:bold; }
  .t-small  { font-size:10px; }
  .t-large  { font-size:14px; }
  .t-hr     { border:none; border-top:1px dashed #000; margin:4px 0; }
  .t-kv     { display:flex; justify-content:space-between; margin:1px 0; }
  .t-kv span{ flex:1; }
  .t-kv span:last-child{ text-align:right; }
  @media print { @page { margin:0; size:80mm auto; } body { padding:2mm; } }
</style>
</head>
<body>
  <div class="t-center t-bold t-large">${EMPRESA.nombre}</div>
  <div class="t-center t-small">RUC: ${EMPRESA.ruc}</div>
  <div class="t-center t-small">${EMPRESA.ciudad}</div>
  <div class="t-center t-small">Telf: ${EMPRESA.telefono}</div>
  <hr class="t-hr">
  <div class="t-center t-bold">COMPROBANTE DE ABONO</div>
  <hr class="t-hr">
  <div class="t-small">
    <div><b>FACTURA No:</b> ${facturaNo}</div>
    <div><b>Fecha:</b> ${fecha}</div>
    <div><b>Cliente:</b> ${clienteNom}</div>
    ${cliente?.telefono ? `<div><b>Tel:</b> ${cliente.telefono}</div>` : ''}
    <div><b>Método pago:</b> ${metodoPago || 'Efectivo'}</div>
    ${referencia ? `<div><b>Referencia:</b> ${referencia}</div>` : ''}
  </div>
  <hr class="t-hr">
  <div class="t-kv t-small"><span>Total factura</span><span>$${formatMonto(factura.total)}</span></div>
  <div class="t-kv t-small"><span>Abonado anterior</span><span>$${abonadoPrev}</span></div>
  <div class="t-kv t-small"><span>Abono realizado</span><span>$${formatMonto(abono)}</span></div>
  <div class="t-kv t-small"><span>Abonado total</span><span>$${abonadoTotal}</span></div>
  <hr class="t-hr">
  <div class="t-kv t-bold"><span>SALDO</span><span>$${formatMonto(saldoNuevo)}</span></div>
  <div class="t-center t-small" style="margin-top:6px">${parseFloat(saldoNuevo) <= 0 ? '✅ DEUDA CANCELADA' : '⚠️ SALDO PENDIENTE'}</div>
  <hr class="t-hr">
  <div class="t-center t-small">Gracias</div>
  <div class="t-center t-small">Conserve este comprobante</div>
  <hr class="t-hr">
  ${generarCodigoBarras(facturaNo)}
</body>
</html>`;
}

/**
 * Abre ventana emergente e imprime el comprobante de abono.
 *
 * @param {object} params
 * @param {object} params.factura       — objeto factura con id, total, etc.
 * @param {number} params.abono         — monto abonado ahora
 * @param {number} params.saldoAnterior — saldo antes del abono
 * @param {number} params.saldoNuevo    — saldo después del abono
 * @param {object} params.cliente       — objeto cliente { nombres, apellidos, telefono }
 * @param {string} params.metodoPago    — método de pago
 * @param {string} [params.referencia]  — código de transferencia o dígitos tarjeta
 * @param {string} [params.fechaPago]   — ISO string de la fecha real del pago
 */
export function imprimirTicketAbono({ factura, abono, saldoAnterior, saldoNuevo, cliente, metodoPago, referencia, fechaPago }) {
  const html = generarHTMLTicketAbono({ factura, abono, saldoAnterior, saldoNuevo, cliente, metodoPago, referencia, fechaPago });
  const w = window.open('', 'TICKET_ABONO', 'height=700,width=400,scrollbars=yes');
  if (!w) { alert('No se pudo abrir la ventana de impresión. Permite ventanas emergentes.'); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.onload = () => {
    w.focus(); w.print();
    const safeClose = () => { try { w.close(); } catch (_) {} };
    w.addEventListener('afterprint', safeClose);
    setTimeout(safeClose, 3000);
  };
}

/* ─────────────── TICKET REIMPRIMIR FACTURA ─────────────── */

/**
 * Genera y abre el ticket de impresión para una factura existente
 * (para reimprimir desde VerFactura).
 *
 * @param {object} factura — objeto factura con todos sus campos
 * @param {Array}  items   — array de ítems de la factura
 */
export function imprimirTicketFactura({ factura, items = [] }) {
  const ventaObj = {
    id:               factura.id,
    id_personalizado: factura.id_personalizado,
    numero_factura:   factura.numero_factura,
    nombre_cliente:   factura.cliente_nombre,
    metodo_pago:      factura.metodo_pago,
    subtotal:         factura.subtotal,
    descuento:        factura.descuento,
    total:            factura.total,
    saldo_pendiente:  factura.saldo_pendiente,
    created_at:       factura.fecha_pago || factura.created_at,
    tipo:             factura.tipo,
  };
  const itemsObj = (items || []).map(it => ({
    codigo:          it.idInterno || it.codigo || '',
    nombre:          it.nombre,
    cantidad:        it.cantidad,
    precio_unitario: it.precio_unitario || it.precioUnitario || 0,
    precio_total:    it.precio_total    || it.precioTotal    || 0,
  }));
  imprimirTicketVenta({ venta: ventaObj, items: itemsObj });
}
