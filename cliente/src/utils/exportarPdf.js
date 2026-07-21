const currencyFormatter = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function displayValue(value, type) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return value.nombre || value.descripcion || value.label || value.codigo || '—';
  if (type === 'currency') return currencyFormatter.format(Number(value) || 0);
  if (type === 'number') return new Intl.NumberFormat('es-EC').format(Number(value) || 0);
  if (type === 'date' || type === 'datetime') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('es-EC');
  }
  return String(value);
}

function rowsHtml(items) {
  return items.map(item => `<div class="field"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></div>`).join('');
}

export function exportarKardexPdf({ product, productFields, indicators, indicatorDefinitions, filters, filterDefinitions, columns, rows, generatedAt }) {
  const popup = window.open('', '_blank', 'width=1200,height=800');
  if (!popup) {
    window.alert('Permite las ventanas emergentes para exportar el reporte a PDF.');
    return;
  }

  const productData = product ? productFields.map(field => ({ label: field.label, value: displayValue(product[field.key], field.type) })) : [];
  const summaryData = indicatorDefinitions.map(item => ({ label: item.label, value: displayValue(indicators?.[item.key], item.type) }));
  const filterData = filterDefinitions.map(filter => ({
    label: filter.label,
    value: filter.options?.find(option => String(option.value) === String(filters?.[filter.key]))?.label || displayValue(filters?.[filter.key]),
  }));
  const tableHead = columns.map(column => `<th>${escapeHtml(column.label)}</th>`).join('');
  const tableBody = rows.map(row => `<tr>${columns.map(column => `<td>${escapeHtml(displayValue(row[column.key], column.type))}</td>`).join('')}</tr>`).join('');

  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Kardex ${escapeHtml(product?.codigo || 'general')}</title><style>
    @page { size: landscape; margin: 12mm; } * { box-sizing: border-box; } body { font-family: Arial, sans-serif; color: #243447; margin: 0; font-size: 10px; }
    h1 { margin: 0 0 4px; font-size: 20px; } h2 { margin: 18px 0 8px; padding-bottom: 5px; border-bottom: 1px solid #ccd5dd; font-size: 13px; }
    .generated { color: #6c757d; margin-bottom: 12px; } .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
    .field { border: 1px solid #dce3e9; border-radius: 5px; padding: 7px; } .field span { display: block; color: #6c757d; font-size: 8px; text-transform: uppercase; margin-bottom: 3px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 8px; } th, td { border: 1px solid #d5dde5; padding: 5px; text-align: left; } th { background: #eef3f7; white-space: nowrap; }
    .empty { padding: 25px; text-align: center; color: #6c757d; border: 1px solid #d5dde5; }
  </style></head><body>
    <h1>Kardex</h1><div class="generated">Generado: ${escapeHtml(new Date(generatedAt).toLocaleString('es-EC'))}</div>
    ${product ? `<h2>Ficha del producto</h2><div class="grid">${rowsHtml(productData)}</div>` : ''}
    ${summaryData.length ? `<h2>Indicadores</h2><div class="grid">${rowsHtml(summaryData)}</div>` : ''}
    <h2>Filtros utilizados</h2><div class="grid">${rowsHtml(filterData)}</div>
    <h2>Movimientos</h2>${rows.length ? `<table><thead><tr>${tableHead}</tr></thead><tbody>${tableBody}</tbody></table>` : '<div class="empty">No existen movimientos para los filtros seleccionados.</div>'}
  </body></html>`);
  popup.document.close();
  popup.focus();
  setTimeout(() => popup.print(), 250);
}
