// cliente/src/utils/imprimirEgreso.js
const EMPRESA = {
  nombre: 'ÓPTICA MACÍAS PASAJE',
  ruc: '0912477528001',
  ciudad: 'Pasaje · Ecuador',
};

const escapar = (valor) => String(valor ?? '—')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const dinero = (valor) => Number(valor || 0).toFixed(2);

const fecha = (valor) => {
  if (!valor) return '—';
  const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(String(valor));
  const date = new Date(soloFecha ? `${valor}T00:00:00` : valor);
  return Number.isNaN(date.getTime()) ? String(valor) : date.toLocaleDateString('es-EC');
};

export function imprimirEgreso({
  egreso,
  detalles = [],
  usuarioNombre = '',
  etiquetaTipo = '',
}) {
  const identificador = egreso.id_personalizado || `#${egreso.id || ''}`;
  const costoTotal = detalles.reduce(
    (total, detalle) => total + Number(detalle.subtotal || 0),
    0,
  );
  const filas = detalles.map((detalle) => `
    <tr>
      <td class="code">${escapar(detalle.codigo)}</td>
      <td>${escapar(detalle.nombre)}</td>
      <td class="num">${escapar(detalle.cantidad)}</td>
      <td class="num">$${dinero(detalle.costo_unitario)}</td>
      <td class="num strong">$${dinero(detalle.subtotal)}</td>
    </tr>
  `).join('');

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Egreso de Mercadería ${escapar(identificador)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 18mm 16mm; color: #17212b; font: 12px Arial, sans-serif; }
    .company { text-align: center; }
    .company h1 { margin: 0; font-size: 19px; letter-spacing: .04em; }
    .company p { margin: 4px 0 0; color: #667085; }
    .title { margin: 18px 0; text-align: center; font-size: 16px; text-transform: uppercase; }
    .info { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px 20px; padding: 14px 0; border-top: 1px solid #222; border-bottom: 1px solid #222; }
    .info span { display: block; margin-bottom: 3px; color: #667085; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .info strong { font-size: 12px; }
    .description { margin: 15px 0; padding: 10px 12px; border: 1px solid #d8dee5; background: #f8fafc; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { padding: 8px; border-bottom: 2px solid #aeb7c2; background: #f1f4f7; color: #485563; font-size: 10px; text-align: left; text-transform: uppercase; }
    td { padding: 8px; border-bottom: 1px solid #e5e9ee; }
    .num { text-align: right; }
    .strong { font-weight: 700; }
    .code { color: #59636e; font-family: monospace; }
    .total { width: 310px; margin: 15px 0 0 auto; padding: 12px 14px; border: 1px solid #cbd5df; background: #f5f9fd; text-align: right; }
    .total strong { margin-left: 24px; color: #1d5f91; font-size: 16px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 70px; margin-top: 70px; }
    .signature { padding-top: 8px; border-top: 1px solid #333; text-align: center; }
    footer { margin-top: 28px; padding-top: 9px; border-top: 1px dashed #c8ced5; color: #7a8490; font-size: 10px; text-align: center; }
    @media print { body { padding: 0; } @page { size: A4 portrait; margin: 17mm 15mm; } }
  </style>
</head>
<body>
  <div class="company">
    <h1>${EMPRESA.nombre}</h1>
    <p>RUC ${EMPRESA.ruc} · ${EMPRESA.ciudad}</p>
  </div>
  <h2 class="title">Egreso de Mercadería ${escapar(identificador)}</h2>
  <div class="info">
    <div><span>Tipo</span><strong>${escapar(etiquetaTipo)}</strong></div>
    <div><span>Fecha</span><strong>${escapar(fecha(egreso.fecha))}</strong></div>
    <div><span>Estado</span><strong>${escapar(egreso.estado)}</strong></div>
    <div><span>Usuario</span><strong>${escapar(egreso.usuario_nombre || usuarioNombre)}</strong></div>
    <div><span>Proveedor</span><strong>${escapar(egreso.proveedor_nombre)}</strong></div>
    <div><span>Sucursal</span><strong>${escapar(egreso.sucursal_nombre)}</strong></div>
    <div><span>Ingreso origen</span><strong>${escapar(egreso.documento_referencia || egreso.ingreso_origen_id)}</strong></div>
    <div><span>Estado financiero</span><strong>${escapar(egreso.estado_financiero)}</strong></div>
  </div>
  <div class="description"><strong>Descripción:</strong> ${escapar(egreso.descripcion)}</div>
  <table>
    <thead><tr><th>Código</th><th>Producto</th><th class="num">Cantidad</th><th class="num">Costo Unit.</th><th class="num">Subtotal</th></tr></thead>
    <tbody>${filas || '<tr><td colspan="5" style="text-align:center">Sin productos registrados</td></tr>'}</tbody>
  </table>
  <div class="total">Costo total retirado <strong>$${dinero(egreso.costo_total || costoTotal)}</strong></div>
  <div class="signatures">
    <div class="signature">Elaborado por</div>
    <div class="signature">Autorizado por</div>
  </div>
  <footer>Impreso el ${new Date().toLocaleString('es-EC')} · ${escapar(identificador)}</footer>
</body>
</html>`;

  const ventana = window.open('', 'EGRESO_PRINT', 'width=960,height=760,scrollbars=yes');
  if (!ventana) return false;
  ventana.document.open();
  ventana.document.write(html);
  ventana.document.close();
  ventana.onload = () => {
    ventana.focus();
    ventana.print();
  };
  return true;
}
