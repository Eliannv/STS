/**
 * imprimirCaja.js
 * Genera e imprime el reporte de Caja Banco o Caja Chica.
 * Diseño basado en el sistema Óptica Macías (ver-caja.ts L1125+),
 * adaptado al backend STS (caja-banco-servicio / caja-chica-servicio).
 *
 * Uso:
 *   imprimirCaja({ caja, movimientos, tipoCaja: 'BANCO', cajasChicas, resumen })
 *   imprimirCaja({ caja, movimientos, tipoCaja: 'CHICA', resumen })
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
    if (typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)) d = new Date(s + 'T00:00:00');
    else d = new Date(s);
    if (isNaN(d.getTime())) return '—';
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' }[c]));
}

const CAMPO = (objeto, camel, snake, fallback = null) => objeto?.[camel] ?? objeto?.[snake] ?? fallback;

const CATEGORIAS_CAJA = {
    APERTURA: 'Apertura',
    REPOSICION_CAJA_CHICA: 'Reposición Caja Chica',
    TRANSFERENCIA_ENTRADA: 'Ingreso desde Caja Chica',
    DEVOLUCION_CAJA_CHICA: 'Devolución Caja Chica',
    TRANSFERENCIA_CLIENTE: 'Transferencia de cliente',
    VENTA_EFECTIVO: 'Venta en efectivo',
    VENTA_TRANSFERENCIA: 'Venta por transferencia',
    COBRO_DEUDA_EFECTIVO: 'Cobro de deuda',
    COBRO_DEUDA_TRANSFERENCIA: 'Cobro por transferencia',
    ACREDITACION_TARJETA: 'Acreditación de tarjeta',
    COMISION_BANCARIA: 'Comisión bancaria',
    RETENCION_BANCARIA: 'Retención bancaria',
    PAGO_PROVEEDOR: 'Pago a proveedor',
    AJUSTE: 'Ajuste',
    OTRO_INGRESO: 'Otro ingreso',
    OTRO_EGRESO: 'Otro egreso',
};

function etiquetaCategoria(categoria) {
    return CATEGORIAS_CAJA[categoria] || categoria || '—';
}

function construirFilaMovimiento(movimiento) {
    const esEgreso = movimiento.tipo === 'EGRESO';
    const bg = esEgreso ? ' style="background-color:#ffebee;"' : '';
    const fecha = fmtFecha(CAMPO(movimiento, 'fechaOperacion', 'fecha_operacion', movimiento.fecha));
    const categoria = esc(etiquetaCategoria(movimiento.categoria));
    const descripcion = esc(movimiento.descripcion || movimiento.observacion || '—');
    const refTipo = CAMPO(movimiento, 'referenciaTipo', 'referencia_tipo');
    const refCodigo = CAMPO(movimiento, 'referenciaCodigo', 'referencia_codigo');
    const referencia = esc([refTipo, refCodigo].filter(Boolean).join(' · ') || '—');
    const signo = esEgreso ? '−' : '+';
    const color = esEgreso ? '#dc3545' : '#28a745';
    const monto = `${signo}${fmt(movimiento.monto)}`;
    const saldoAnt = fmt(CAMPO(movimiento, 'saldoAnterior', 'saldo_anterior'));
    const saldoNuevo = fmt(CAMPO(movimiento, 'saldoNuevo', 'saldo_nuevo'));
    const usuario = esc(CAMPO(movimiento, 'usuarioNombre', 'usuario_nombre', '—'));
    return `<tr${bg}>
        <td>${fecha}</td>
        <td>${categoria}</td>
        <td>${descripcion}</td>
        <td>${referencia}</td>
        <td class="text-right" style="color:${color};font-weight:bold;">${monto}</td>
        <td class="text-right">${saldoAnt}</td>
        <td class="text-right">${saldoNuevo}</td>
        <td>${usuario}</td>
    </tr>`;
}

function construirInfoCaja(caja) {
    const fechaApertura = fmtFecha(caja.fecha_apertura || caja.created_at);
    const fechaCierre = caja.cerrado_en ? fmtFecha(caja.cerrado_en) : (caja.estado === 'ABIERTA' ? 'En curso' : '—');
    const filas = [
        ['Estado de Caja', esc(caja.estado || '—')],
        ['Fecha', fmtFecha(caja.fecha)],
        ['Apertura', fechaApertura],
        ['Cierre', fechaCierre],
        ['Abierta por', esc(caja.usuario_nombre || '—')],
        ['Cerrada por', esc(caja.cerrado_por_nombre || '—')],
    ];
    return `<div class="info-caja">
        ${filas.map(([k, v]) => `<div class="info-row"><span class="info-label">${k}:</span><span>${v}</span></div>`).join('')}
    </div>`;
}

function construirResumenCaja(caja, resumen, tipoCaja) {
    const saldoInicialKey = tipoCaja === 'BANCO' ? 'saldo_inicial' : 'monto_inicial';
    const saldoActualKey = tipoCaja === 'BANCO' ? 'saldo_actual' : 'monto_actual';
    const saldoInicial = fmt(caja[saldoInicialKey]);
    const saldoActual = fmt(caja[saldoActualKey]);
    const ingresos = resumen?.ingresos ?? 0;
    const egresos = resumen?.egresos ?? 0;
    const balance = ingresos - egresos;

    const item = (label, valor, opciones = {}) => {
        const cls = opciones.total ? 'resumen-item total' : (opciones.subtotal ? 'resumen-item subtotal' : 'resumen-item');
        const style = opciones.color ? ` style="color:${opciones.color};font-weight:bold;"` : '';
        return `<div class="${cls}"><span>${esc(label)}:</span><span${style}>${valor}</span></div>`;
    };

    return `<div class="resumen">
        <h3>RESUMEN FINANCIERO</h3>
        ${item('Saldo inicial', saldoInicial)}
        ${item('Total ingresos', '+' + fmt(ingresos), { color: '#28a745' })}
        ${item('Total egresos', '−' + fmt(egresos), { color: '#dc3545' })}
        ${item('Balance neto', (balance >= 0 ? '+' : '−') + fmt(Math.abs(balance)), {
            color: balance >= 0 ? '#28a745' : '#dc3545',
            subtotal: true,
        })}
        ${item(tipoCaja === 'BANCO' ? 'Saldo actual de Caja Banco' : 'Monto actual de Caja Chica', saldoActual, { total: true })}
    </div>`;
}

function construirTablaCajasChicas(cajasChicas) {
    if (!cajasChicas || cajasChicas.length === 0) {
        return `<div class="seccion-titulo seccion-cajas-chicas">CAJAS CHICAS ASOCIADAS</div>
        <p style="font-size: 9px; color: #666; margin-bottom: 15px;">No hay cajas chicas asociadas a este período.</p>`;
    }
    const filas = cajasChicas.map(item => {
        const saldoFinal = item.saldo_contado_cierre ?? item.monto_actual;
        return `<tr>
            <td>${fmtFecha(item.fecha)}</td>
            <td>${esc(item.estado || '—')}</td>
            <td>${esc(item.usuario_nombre || '—')}</td>
            <td>${esc(item.cerrado_por_nombre || '—')}</td>
            <td class="text-right">${fmt(item.monto_inicial)}</td>
            <td class="text-right">${fmt(saldoFinal)}</td>
        </tr>`;
    }).join('');
    return `<div class="seccion-titulo seccion-cajas-chicas">CAJAS CHICAS ASOCIADAS</div>
    <table>
        <thead><tr>
            <th>Fecha</th><th>Estado</th><th>Abierta por</th><th>Cerrada por</th>
            <th class="text-right">Saldo Inicial</th><th class="text-right">Saldo Final</th>
        </tr></thead>
        <tbody>${filas}</tbody>
    </table>`;
}

function generarHTMLCaja({ caja, movimientos, tipoCaja, cajasChicas, resumen }) {
    const fechaReporte = new Date().toLocaleString('es-EC');
    const tituloCaja = tipoCaja === 'BANCO' ? 'REPORTE DE CAJA BANCO' : 'REPORTE DE CAJA CHICA';
    const tieneMovimientos = movimientos && movimientos.length > 0;
    const filasMovimientos = tieneMovimientos
        ? movimientos.map(construirFilaMovimiento).join('')
        : '<tr><td colspan="8" style="text-align:center;padding:10px;">Sin movimientos registrados.</td></tr>';

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>${tituloCaja}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; padding: 10px; font-size: 10px; color: #000; background: #fff; }
        .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .header .empresa { font-size: 13px; font-weight: bold; margin-bottom: 3px; text-transform: uppercase; }
        .header .empresa-info { font-size: 9px; color: #444; margin-bottom: 4px; }
        .header h1 { font-size: 15px; font-weight: bold; text-transform: uppercase; }
        .fecha-generado { text-align: right; font-size: 8px; margin-bottom: 10px; }
        .info-caja { background: #f5f5f5; padding: 8px; margin-bottom: 12px; font-size: 9px; border: 1px solid #000; }
        .info-caja .info-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
        .info-caja .info-label { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th { background: #000; color: #fff; padding: 6px 4px; text-align: left; font-size: 9px; border: 1px solid #000; }
        td { padding: 5px 4px; border: 1px solid #000; font-size: 9px; }
        .text-right { text-align: right; }
        .seccion-titulo { font-size: 10px; font-weight: bold; margin: 15px 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .seccion-cajas-chicas { margin-top: 20px; padding-top: 15px; border-top: 2px solid #000; }
        .resumen { border: 2px solid #000; padding: 10px; margin-top: 20px; }
        .resumen h3 { font-size: 11px; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 4px; text-transform: uppercase; }
        .resumen-item { display: flex; justify-content: space-between; padding: 3px 0; font-size: 9px; }
        .resumen-item.total { font-weight: bold; font-size: 11px; border-top: 2px solid #000; padding-top: 6px; margin-top: 4px; }
        .resumen-item.subtotal { font-weight: bold; font-size: 10px; border-top: 1px solid #000; padding-top: 4px; margin-top: 2px; }
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
        <h1>${tituloCaja}</h1>
    </div>
    <div class="fecha-generado">Generado: ${fechaReporte}</div>

    ${construirInfoCaja(caja)}

    <table>
        <thead><tr>
            <th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Referencia</th>
            <th class="text-right">Monto</th><th class="text-right">Saldo Ant.</th><th class="text-right">Saldo Nuevo</th><th>Usuario</th>
        </tr></thead>
        <tbody>${filasMovimientos}</tbody>
    </table>

    ${tipoCaja === 'BANCO' ? construirTablaCajasChicas(cajasChicas) : ''}

    ${construirResumenCaja(caja, resumen, tipoCaja)}
</body>
</html>`;
}

export function imprimirCaja({ caja, movimientos, tipoCaja = 'BANCO', cajasChicas = [], resumen = {} }) {
    if (!caja) {
        alert('No hay datos de caja para imprimir.');
        return;
    }
    if (!['BANCO', 'CHICA'].includes(tipoCaja)) {
        alert('tipoCaja debe ser "BANCO" o "CHICA".');
        return;
    }

    const html = generarHTMLCaja({ caja, movimientos, tipoCaja, cajasChicas, resumen });
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

export default imprimirCaja;
