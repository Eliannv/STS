/**
 * Utilidades de exportación a Excel.
 * - exportarProductosExcel: usa xlsx (SheetJS) para generar hoja simple
 * - exportarHistorialExcel: usa ExcelJS para cargar plantilla preservando estilos
 */
import * as XLSX from 'xlsx';

/* ──────────────────────────────────────────────
   Exportar lista de productos
   ────────────────────────────────────────────── */
export function exportarProductosExcel(productos) {
  const filas = productos.map(p => ({
    'Código':     p.codigo       || '',
    'Nombre':     p.nombre       || '',
    'Modelo':     p.modelo       || '',
    'Color':      p.color        || '',
    'Grupo':      p.grupo        || '',
    'Costo':      parseFloat(p.costo || 0),
    'PVP1':       parseFloat(p.pvp1  || 0),
    'Stock':      p.stock        ?? 0,
    'IVA (%)':    p.iva          ?? 0,
    'Estado':     p.activo ? 'Activo' : 'Inactivo',
    'Proveedor':  p.proveedor    || '',
  }));

  const ws = XLSX.utils.json_to_sheet(filas);

  // Ancho de columnas
  ws['!cols'] = [
    { wch: 14 }, { wch: 30 }, { wch: 20 }, { wch: 14 },
    { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 8  },
    { wch: 8  }, { wch: 10 }, { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');

  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `productos_${fecha}.xlsx`);
}

/* ──────────────────────────────────────────────
   Exportar historial clínico — usa plantilla formato_pedidos_michael.xlsx
   Usa ExcelJS para preservar estilos, colores y bordes del template.
   Misma lógica que Optica Macias excel.service.ts → llenarDatosHistorialClinico
   ────────────────────────────────────────────── */

export async function exportarHistorialExcel(historial, cliente) {
  // Importar ExcelJS dinámicamente
  const ExcelJS = (await import('exceljs')).default;

  // 1. Cargar la plantilla desde /public/
  const resp = await fetch('/formato_pedidos_michael.xlsx');
  if (!resp.ok) {
    alert('No se encontró la plantilla formato_pedidos_michael.xlsx en public/');
    return;
  }
  const arrayBuffer = await resp.arrayBuffer();

  // 2. Leer con ExcelJS (preserva estilos, colores, bordes)
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) throw new Error('La plantilla no tiene hojas');

  // 3. Fecha en D1
  const fecha = historial.fecha_chequeo
    ? new Date(historial.fecha_chequeo).toLocaleDateString('es-EC')
    : new Date(historial.created_at || Date.now()).toLocaleDateString('es-EC');
  worksheet.getCell('D1').value = fecha;

  // 4. OD — Ojo Derecho (C3, D3, E3) — valores numéricos crudos
  if (historial.od_esfera   != null && historial.od_esfera   !== '') worksheet.getCell('C3').value = parseFloat(historial.od_esfera);
  if (historial.od_cilindro != null && historial.od_cilindro !== '') worksheet.getCell('D3').value = parseFloat(historial.od_cilindro);
  if (historial.od_eje      != null && historial.od_eje      !== '') worksheet.getCell('E3').value = parseFloat(historial.od_eje);

  // 5. OI — Ojo Izquierdo (C4, D4, E4)
  if (historial.oi_esfera   != null && historial.oi_esfera   !== '') worksheet.getCell('C4').value = parseFloat(historial.oi_esfera);
  if (historial.oi_cilindro != null && historial.oi_cilindro !== '') worksheet.getCell('D4').value = parseFloat(historial.oi_cilindro);
  if (historial.oi_eje      != null && historial.oi_eje      !== '') worksheet.getCell('E4').value = parseFloat(historial.oi_eje);

  // 6. ADD (C5)
  if (historial.add != null && historial.add !== '') worksheet.getCell('C5').value = parseFloat(historial.add);

  // 7. Dp (H3)
  if (historial.dp != null && historial.dp !== '') worksheet.getCell('H3').value = parseFloat(historial.dp);

  // 8. Alt / Altura (H4)
  if (historial.altura != null && historial.altura !== '') worksheet.getCell('H4').value = parseFloat(historial.altura);

  // 9. Armazón: H (J2), V (J3), DM (J4), P=dbl (J5)
  if (historial.armazon_h   != null && historial.armazon_h   !== '') worksheet.getCell('J2').value = parseFloat(historial.armazon_h);
  if (historial.armazon_v   != null && historial.armazon_v   !== '') worksheet.getCell('J3').value = parseFloat(historial.armazon_v);
  if (historial.armazon_dm  != null && historial.armazon_dm  !== '') worksheet.getCell('J4').value = parseFloat(historial.armazon_dm);
  if (historial.armazon_dbl != null && historial.armazon_dbl !== '') worksheet.getCell('J5').value = parseFloat(historial.armazon_dbl);

  // 10. DE — tipo de lente (C6)
  if (historial.de) worksheet.getCell('C6').value = historial.de;

  // 11. Tipo de Armazón (L3)
  if (historial.armazon_tipo) worksheet.getCell('L3').value = historial.armazon_tipo;

  // 12. Nombre del cliente (Q4) — igual que Optica Macias
  const nombreCliente = cliente
    ? `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim()
    : '';
  if (nombreCliente) worksheet.getCell('Q4').value = nombreCliente;

  // 13. Generar y descargar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const suffix = nombreCliente.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'historial';
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `pedido_${suffix}_${fecha.replace(/\//g, '-')}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
