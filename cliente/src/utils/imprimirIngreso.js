/**
 * imprimirIngreso.js
 * Genera e imprime la factura de ingreso de inventario.
 * Diseño basado en el sistema Óptica Macías — formato A4.
 */

const EMPRESA = {
    nombre: 'ÓPTICA MACÍAS PASAJE',
    ruc: '0912477528001',
    ciudad: 'Pasaje · Ecuador',
};

function fmt(v) {
    return Number(v || 0).toFixed(2);
}

function fmtFecha(s) {
    if (!s) return '—';

    let d;

    if (s.toDate) {
        // Firebase Timestamp
        d = s.toDate();
    } else if (typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
        // String puro "YYYY-MM-DD" (DATE de Postgres sin hora)
        d = new Date(s + 'T00:00:00');
    } else {
        // Date object, ISO con hora, timestamp numérico, etc.
        d = new Date(s);
    }

    if (isNaN(d.getTime())) return '—';

    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function imprimirIngreso({ ingreso, detalles = [], usuarioNombre = '' }) {
    const idMostrar = ingreso.id_personalizado || String(ingreso.id || '');
    const proveedor = ingreso.proveedor_nombre || '—';
    const guia = ingreso.numero_factura || '—';
    const fecha = fmtFecha(ingreso.fecha);

    const totalUnidades = detalles.reduce((s, d) => s + parseInt(d.stock_ingresado || 0), 0);
    const totalCosto = detalles.reduce((s, d) => s + parseFloat(d.subtotal || 0), 0);

    const tieneAjustes = (ingreso.descuento > 0) || (ingreso.flete > 0) ||
        (ingreso.iva > 0) || (ingreso.total > 0);

    /* ─── Filas de productos ─── */
    const filas = detalles.map((d, i) => {
        const colorTexto = [d.material, d.color].filter(Boolean).join(' - ') || d.color || '—';
        return `
      <tr>
        <td class="td-code">${d.codigo || (i + 1)}</td>
        <td class="td-nombre">${d.nombre || '—'}</td>
        <td>${d.modelo || '—'}</td>
        <td>${colorTexto}</td>
        <td class="td-num">${d.stock_ingresado ?? '—'}</td>
        <td class="td-num">$${fmt(d.costo_unitario)}</td>
        <td class="td-num td-bold">$${fmt(d.subtotal)}</td>
      </tr>`;
    }).join('');

    /* ─── Sección de ajustes (solo si existen) ─── */
    const secAjustes = tieneAjustes ? `
    <div class="ajustes-box">
      <table class="ajustes-table">
        ${ingreso.descuento > 0 ? `<tr><td>Descuento</td><td class="td-num" style="color:#c0392b">-$${fmt(ingreso.descuento)}</td></tr>` : ''}
        ${ingreso.flete     > 0 ? `<tr><td>Flete</td>    <td class="td-num">$${fmt(ingreso.flete)}</td></tr>` : ''}
        ${ingreso.iva       > 0 ? `<tr><td>IVA</td>      <td class="td-num">$${fmt(ingreso.iva)}</td></tr>` : ''}
        <tr class="total-factura-row">
          <td>Total Factura</td>
          <td class="td-num">$${fmt(ingreso.total)}</td>
        </tr>
      </table>
    </div>` : '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Factura de Ingreso ${idMostrar}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12px;
    color: #1a1a1a;
    background: #fff;
    padding: 20mm 18mm 16mm;
  }

  /* ── CABECERA ── */
  .empresa-header {
    text-align: center;
    margin-bottom: 14px;
  }
  .empresa-nombre {
    font-size: 19px;
    font-weight: 800;
    letter-spacing: 0.03em;
    color: #111;
  }
  .empresa-sub {
    font-size: 10.5px;
    color: #666;
    margin-top: 3px;
  }
  .factura-titulo {
    font-size: 15px;
    font-weight: 700;
    text-align: center;
    text-transform: uppercase;
    margin: 12px 0 16px;
    letter-spacing: 0.02em;
  }

  /* ── INFO GRID 4 COLUMNAS ── */
.info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 8px 24px;
    margin-bottom: 14px;
}
.info-cell .lbl {
    font-size: 10px;
    font-weight: 700;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 2px;
}
.info-cell .val {
    font-size: 12.5px;
    color: #111;
}

  /* ── DIVISOR ── */
  hr { border: none; border-top: 1.5px solid #222; margin: 14px 0 16px; }

  /* ── SECCIÓN TÍTULO ── */
  .sec-titulo {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #333;
    margin-bottom: 8px;
  }

  /* ── TABLA DE PRODUCTOS ── */
  .productos-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 18px;
    font-size: 11.5px;
  }
  .productos-table thead tr {
    background: #f2f2f2;
    border-top: 1px solid #bbb;
    border-bottom: 1px solid #bbb;
  }
  .productos-table th {
    padding: 7px 10px;
    font-weight: 700;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #444;
    text-align: left;
  }
  .productos-table td {
    padding: 6px 10px;
    border-bottom: 1px solid #ebebeb;
    color: #222;
    vertical-align: middle;
  }
  .productos-table tbody tr:last-child td { border-bottom: none; }
  .td-code  { font-family: monospace; color: #555; font-size: 11px; }
  .td-nombre { font-weight: 600; }
  .td-num   { text-align: right; white-space: nowrap; }
  .td-bold  { font-weight: 700; }

  /* ── TOTALES FINALES ── */
  .totales-wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: 6px;
  }
  .totales-box {
    width: 280px;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
  }
  .totales-box table { width: 100%; border-collapse: collapse; }
  .totales-box td {
    padding: 6px 12px;
    font-size: 12px;
    border-bottom: 1px solid #eee;
  }
  .totales-box tr:last-child td { border-bottom: none; }
  .totales-box .row-final td {
    font-weight: 700;
    font-size: 13px;
    background: #f0f4ff;
    color: #1a3a8f;
    border-top: 1.5px solid #c5d2f0;
  }
  .totales-box .td-r { text-align: right; }

  /* ── AJUSTES BOX ── */
  .ajustes-box {
    margin-bottom: 18px;
  }
  .ajustes-table { width: 240px; margin-left: auto; border-collapse: collapse; font-size: 12px; }
  .ajustes-table td { padding: 4px 8px; }
  .total-factura-row td {
    font-weight: 700;
    border-top: 1.5px solid #999;
    padding-top: 6px;
    font-size: 13px;
    color: #1a3a8f;
  }

  /* ── PIE ── */
  .pie {
    margin-top: 30px;
    text-align: center;
    font-size: 10px;
    color: #999;
    border-top: 1px dashed #ccc;
    padding-top: 10px;
  }

  @media print {
    body { padding: 0; }
    @page { size: A4 portrait; margin: 18mm 16mm; }
  }
</style>
</head>
<body>

  <!-- ══ CABECERA EMPRESA ══ -->
  <div class="empresa-header">
    <div class="empresa-nombre">${EMPRESA.nombre}</div>
    <div class="empresa-sub">RUC: ${EMPRESA.ruc} &nbsp;|&nbsp; ${EMPRESA.ciudad}</div>
  </div>

  <!-- ══ TÍTULO FACTURA ══ -->
  <div class="factura-titulo">Factura de Ingreso &nbsp;${idMostrar}</div>

  <!-- ══ INFO GENERAL ══ -->
  <div class="info-grid">
    <div class="info-cell">
      <div class="lbl">Proveedor:</div>
      <div class="val">${proveedor}</div>
    </div>
    <div class="info-cell">
      <div class="lbl">Fecha:</div>
      <div class="val">${fecha}</div>
    </div>
    <div class="info-cell">
      <div class="lbl">Guía:</div>
      <div class="val">${guia}</div>
    </div>
    <div class="info-cell">
      <div class="lbl">Digitador:</div>
      <div class="val">${usuarioNombre || '—'}</div>
    </div>
    <div class="info-cell">
      <div class="lbl">Descuento:</div>
      <div class="val">${ingreso.descuento || 0}</div>
    </div>
    <div class="info-cell">
      <div class="lbl">Flete:</div>
      <div class="val">${ingreso.flete || 0}</div>
    </div>
    <div class="info-cell">
      <div class="lbl">IVA:</div>
      <div class="val">${ingreso.iva || 0}</div>
    </div>
    <div class="info-cell">
      <div class="lbl">Total Factura:</div>
      <div class="val">${ingreso.total || 0}</div>
    </div>
  </div>

  <hr>

  <!-- ══ PRODUCTOS ══ -->
  <div class="sec-titulo">Productos Ingresados</div>

  <table class="productos-table">
    <thead>
      <tr>
        <th style="width:60px">ID</th>
        <th>Nombre</th>
        <th style="width:160px">Modelo</th>
        <th style="width:180px">Color</th>
        <th class="td-num" style="width:65px">Cant.</th>
        <th class="td-num" style="width:90px">Costo Unit.</th>
        <th class="td-num" style="width:90px">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${filas || '<tr><td colspan="7" style="text-align:center;color:#aaa;padding:16px">Sin productos registrados</td></tr>'}
    </tbody>
  </table>

  <!-- ══ TOTALES ══ -->
  <div class="totales-wrap">
    <div class="totales-box">
      <table>
        <tr>
          <td>Líneas de producto</td>
          <td class="td-r">${detalles.length}</td>
        </tr>
        <tr>
          <td>Unidades totales</td>
          <td class="td-r">${totalUnidades}</td>
        </tr>
        <tr class="row-final">
          <td>Costo total del ingreso</td>
          <td class="td-r">$${fmt(totalCosto)}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- ══ PIE ══ -->
  <div class="pie">
    ${EMPRESA.nombre} &mdash; Documento generado el ${new Date().toLocaleDateString('es-EC')}
  </div>

</body>
</html>`;

  const w = window.open('', 'INGRESO_PRINT', 'width=900,height=700,scrollbars=yes');
  if (!w) {
    alert('No se pudo abrir la ventana de impresión. Permite ventanas emergentes para este sitio.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.onload = () => {
    w.focus();
    w.print();
    const cerrar = () => { try { w.close(); } catch (_) {} };
    w.addEventListener('afterprint', cerrar);
    setTimeout(cerrar, 4000);
  };
}