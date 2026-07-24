/**
 * imprimirReporte.js
 * Utilidad de impresión del reporte de Análisis de Ventas.
 * Diseño basado en el sistema Óptica Macías (ventas-generales.ts),
 * adaptado al backend STS (reportes-servicio · ventas/general).
 *
 * Para impresión de Caja Banco / Caja Chica ver imprimirCaja.js.
 */

const EMPRESA = {
    nombre: 'ÓPTICA MACÍAS PASAJE',
    ruc: '0912477528001',
    ciudad: 'Pasaje · Ecuador',
};

function fmt(v) {
    const n = Number(v ?? 0);
    return isNaN(n) ? '$0.00' : '$' + n.toFixed(2);
}

function fmtFecha(s) {
    if (!s) return '—';
    let d;
    if (s.toDate) d = s.toDate();
    else if (typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)) d = new Date(s + 'T00:00:00');
    else d = new Date(s);
    if (isNaN(d.getTime())) return '—';
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtFechaCorta(s) {
    if (!s) return '';
    let d;
    if (typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)) d = new Date(s + 'T00:00:00');
    else d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' }[c]));
}

function construirFiltrosTexto(filters = {}) {
    const partes = [];
    if (filters.fechaDesde) partes.push(`Desde: ${fmtFechaCorta(filters.fechaDesde)}`);
    if (filters.fechaHasta) partes.push(`Hasta: ${fmtFechaCorta(filters.fechaHasta)}`);
    if (filters.tipoTransaccion && filters.tipoTransaccion !== 'TODAS') {
        const labels = {
            VENTAS: 'Ventas (Facturas)',
            COBROS: 'Pago de deudas',
            VENTAS_COBROS: 'Ventas + Cobros',
        };
        partes.push(`Tipo: ${labels[filters.tipoTransaccion] || filters.tipoTransaccion}`);
    }
    if (filters.estado) partes.push(`Estado: ${filters.estado}`);
    if (filters.metodoPago) partes.push(`Método: ${filters.metodoPago}`);
    if (filters.clienteId) partes.push(`Cliente ID: ${filters.clienteId}`);
    if (filters.usuarioId) partes.push(`Usuario ID: ${filters.usuarioId}`);
    if (filters.sucursalId) partes.push(`Sucursal ID: ${filters.sucursalId}`);
    if (filters.buscarFactura) partes.push(`Factura: ${filters.buscarFactura}`);
    if (filters.buscarCliente) partes.push(`Cliente: ${filters.buscarCliente}`);
    return partes.length > 0
        ? `<div class="filtros">${partes.join(' | ')}</div>`
        : '';
}

function construirFilas(rows = [], columns = []) {
    return rows.map(r => {
        const esCobro = r.tipoTransaccion === 'COBRO';
        const bg = esCobro ? ' style="background-color:#fff3e0;"' : '';
        const celdas = columns.map(col => {
            const raw = r[col.key];
            let val;
            if (col.type === 'currency') val = fmt(raw);
            else if (col.type === 'number') val = Number(raw || 0).toLocaleString('es-EC');
            else if (col.type === 'datetime' || col.type === 'date') val = fmtFecha(raw);
            else if (col.type === 'percentage') val = `${Number(raw || 0).toFixed(2)}%`;
            else val = esc(raw ?? '—');
            const align = (col.type === 'currency' || col.type === 'number') ? ' class="text-right"' : '';
            return `<td${align}>${val}</td>`;
        }).join('');
        return `<tr${bg}>${celdas}</tr>`;
    }).join('');
}

function construirResumen(summaryItems = []) {
    if (!summaryItems || summaryItems.length === 0) return '';
    const itemsHtml = summaryItems.map(({ label, value, isMoney, color }) => {
        let val;
        if (typeof value === 'string' && value.startsWith('$')) {
            val = esc(value);
        } else if (isMoney) {
            val = fmt(value);
        } else {
            val = esc(value);
        }
        const style = color ? ` style="color:${color};font-weight:bold;"` : '';
        return `<div class="resumen-item"><span>${esc(label)}:</span><span${style}>${val}</span></div>`;
    }).join('');
    return `<div class="resumen">
        <h3>RESUMEN</h3>
        ${itemsHtml}
    </div>`;
}

function generarHTML({ rows, columns, summaryItems, filters, titulo }) {
    const fechaReporte = new Date().toLocaleString('es-EC');
    const filtrosTexto = construirFiltrosTexto(filters);
    const cabeceras = columns.map(c => `<th${(c.type === 'currency' || c.type === 'number') ? ' class="text-right"' : ''}>${esc(c.label)}</th>`).join('');
    const filas = construirFilas(rows, columns);
    const resumen = construirResumen(summaryItems);

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reporte de Análisis de Ventas</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; padding: 10px; font-size: 10px; color: #000; background: #fff; }
        .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .header .empresa { font-size: 13px; font-weight: bold; margin-bottom: 3px; text-transform: uppercase; }
        .header h1 { font-size: 15px; margin-bottom: 3px; font-weight: bold; text-transform: uppercase; }
        .header .empresa-info { font-size: 9px; color: #444; }
        .header .subtitulo { font-size: 10px; margin-top: 2px; }
        .fecha-reporte { text-align: right; font-size: 8px; margin-bottom: 10px; }
        .filtros { background: #f5f5f5; padding: 6px 8px; margin-bottom: 12px; font-size: 9px; border: 1px solid #000; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th { background: #000; color: #fff; padding: 6px 4px; text-align: left; font-size: 9px; border: 1px solid #000; }
        td { padding: 5px 4px; border: 1px solid #000; font-size: 9px; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .resumen { border: 2px solid #000; padding: 10px; margin-top: 15px; }
        .resumen h3 { font-size: 11px; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 4px; text-transform: uppercase; }
        .resumen h4 { font-size: 10px; margin: 6px 0 4px 0; font-weight: bold; }
        .resumen-item { display: flex; justify-content: space-between; padding: 3px 0; font-size: 9px; }
        .resumen-item.total { font-weight: bold; font-size: 11px; border-top: 2px solid #000; padding-top: 6px; margin-top: 4px; }
        @media print {
            @page { margin: 0.5cm; size: auto; }
            body { padding: 0; }
            tr { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="empresa">${EMPRESA.nombre}</div>
        <div class="empresa-info">RUC: ${EMPRESA.ruc} · ${EMPRESA.ciudad}</div>
        <h1>${esc(titulo || 'Reporte de Análisis de Ventas')}</h1>
        <div class="subtitulo">Basado en Facturas y Cobros del Sistema</div>
    </div>
    <div class="fecha-reporte">Generado: ${fechaReporte}</div>
    ${filtrosTexto}

    <table>
        <thead>
            <tr>${cabeceras}</tr>
        </thead>
        <tbody>
            ${filas || `<tr><td colspan="${columns.length}" style="text-align:center;padding:10px;">Sin registros para los filtros aplicados.</td></tr>`}
        </tbody>
    </table>

    ${resumen}
</body>
</html>`;
}

export function imprimirAnalisisVentas({ rows, columns, summaryItems, filters = {}, titulo }) {
    if (!rows || rows.length === 0) {
        alert('No hay registros para imprimir.');
        return;
    }

    const html = generarHTML({ rows, columns, summaryItems, filters, titulo });
    const ventana = window.open('', 'PRINT', 'height=800,width=900');
    if (!ventana) {
        alert('No se pudo abrir la ventana de impresión. Verifique que el navegador permita pop-ups.');
        return;
    }

    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();
    ventana.print();
    ventana.addEventListener('afterprint', () => ventana.close());
}

const imprimirReporte = { imprimirAnalisisVentas };
export default imprimirReporte;
