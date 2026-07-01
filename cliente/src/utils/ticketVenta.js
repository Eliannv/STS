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

import { Check, TriangleAlert } from 'lucide-react';

const EMPRESA = {
    nombre: 'ÓPTICA MACÍAS PASAJE',
    ruc: '0912477528001',
    ciudad: 'Pasaje - Ecuador',
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

    // Tabla Code128B: cada símbolo = anchos alternados barra/espacio (6 elementos, stop=7)
    // Índice 0–95 = ASCII 32–127, índice 104 = Start B, índice 106 = Stop
    const P = [
        '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312',
        '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222',
        '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131',
        '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321',
        '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
        '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121',
        '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321',
        '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224',
        '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114',
        '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
        '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112',
        '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113',
        '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412',
        '211214', '211232', '2331112',
    ];
    // Start B = índice 104, Stop = índice 106 (último)
    const START_B = 104;
    const STOP = 106;

    const codes = [];
    for (let i = 0; i < texto.length; i++) {
        const idx = texto.charCodeAt(i) - 32; // Code128B: ASCII 32 → 0, ASCII 127 → 95
        if (idx >= 0 && idx <= 95) codes.push(idx);
    }
    if (!codes.length) return '';

    // Checksum: startValue + Σ(value * posición 1-based) mod 103
    let sum = START_B;
    codes.forEach((c, i) => { sum += c * (i + 1); });
    const check = sum % 103;

    // Secuencia final: Start-B + datos + checksum + Stop
    const seq = [P[START_B], ...codes.map(c => P[c]), P[check], P[STOP]];

    const mw = 2; // ancho del módulo en px
    const h = 50; // altura de las barras
    const mx = 8; // margen lateral
    let x = mx;
    let rects = '';

    for (const sym of seq) {
        for (let i = 0; i < sym.length; i++) {
            const w = parseInt(sym[i]) * mw;
            if (i % 2 === 0) rects += `<rect x="${x}" y="0" width="${w}" height="${h}"/>`;
            x += w;
        }
    }

    const totalW = x + mx;
    return `
    <div style="text-align:center;margin-top:6px">
      <svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${h + 14}" style="max-width:100%">
        <rect width="${totalW}" height="${h + 14}" fill="white"/>
        <g fill="black">${rects}</g>}
      </svg>
    </div>`;
}

export function generarHTMLTicket({ venta, items }) {
    const facturaNo = venta.id_personalizado || venta.numero_factura || String(venta.id || '');
    const cliente = venta.nombre_cliente || 'CONSUMIDOR FINAL';
    const metodo = venta.metodo_pago || 'Efectivo';
    const fecha = formatFecha(venta.created_at);
    const subtotal = formatMonto(venta.subtotal);
    const descuento = Number(venta.descuento || 0);
    const total = formatMonto(venta.total);
    const abono = formatMonto(Number(venta.total || 0) - Number(venta.saldo_pendiente || 0));
    const saldo = Number(venta.saldo_pendiente || 0);

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

  const ICONO_CHECK = `✓`;
  const ICONO_ALERTA = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-triangle-alert-icon lucide-triangle-alert"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;

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
  <div class="t-center t-small" style="margin-top:6px; display:flex; align-items:center; justify-content:center; gap:4px;">
    ${parseFloat(saldoNuevo) <= 0 ? `${ICONO_CHECK} DEUDA CANCELADA` : `${ICONO_ALERTA} SALDO PENDIENTE`}
  </div>
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