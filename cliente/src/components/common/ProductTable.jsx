import TableCard from './TableCard';

const TH = {
  padding: '7px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700,
  color: '#6c757d', textTransform: 'uppercase', letterSpacing: 0.4,
  whiteSpace: 'nowrap', background: '#f8f9fa', borderBottom: '2px solid #dee2e6',
};

const TD = (sel) => ({
  padding: '7px 10px', fontSize: 13, borderBottom: '1px solid #f0f2f5',
  background: sel ? '#eef4ff' : 'inherit', cursor: 'pointer',
});

export default function ProductTable({
  productos, loading, emptyText = 'No se encontraron productos',
  onRowClick, selectedIdx,
  stickyHeader,
  renderCodigo, renderNombre,
  mostrarModelo, mostrarProveedor,
  extraColumns = [],
}) {
  return (
    <TableCard noCard scrollY loading={loading} empty={!loading && productos.length === 0} emptyText={emptyText}>
      {!loading && productos.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={stickyHeader ? { position: 'sticky', top: 0, zIndex: 1 } : undefined}>
            <tr>
              <th style={TH}>Código</th>
              <th style={TH}>Nombre</th>
              {mostrarModelo && <th style={TH}>Modelo</th>}
              <th style={TH}>Grupo</th>
              {mostrarProveedor && <th style={TH}>Proveedor</th>}
              <th style={{ ...TH, textAlign: 'right' }}>Costo</th>
              <th style={{ ...TH, textAlign: 'right' }}>PVP1</th>
              <th style={{ ...TH, textAlign: 'center' }}>Stock</th>
              {extraColumns.map((col, i) => (
                <th key={i} style={{ ...TH, textAlign: col.center ? 'center' : 'left' }}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {productos.map((p, i) => {
              const sel = selectedIdx === i;
              const rowStyle = onRowClick
                ? {
                    background: sel ? '#eef4ff' : 'inherit',
                    cursor: 'pointer',
                    borderLeft: sel ? '3px solid #3498db' : '3px solid transparent',
                  }
                : undefined;
              return (
                <tr
                  key={p.id}
                  onClick={onRowClick ? () => onRowClick(p) : undefined}
                  onMouseEnter={onRowClick ? (e => { if (!sel) e.currentTarget.style.background = '#f5f8ff'; }) : undefined}
                  onMouseLeave={onRowClick ? (e => { if (!sel) e.currentTarget.style.background = 'inherit'; }) : undefined}
                  style={rowStyle}
                  title={onRowClick ? 'Clic para agregar al carrito' : undefined}
                >
                  <td style={{ ...TD(sel), color: '#6c757d', fontSize: 12 }}>
                    {renderCodigo ? renderCodigo(p) : (p.codigo || '—')}
                  </td>
                  <td style={{ ...TD(sel), fontWeight: 600 }}>
                    {renderNombre ? renderNombre(p) : p.nombre}
                  </td>
                  {mostrarModelo && <td style={{ ...TD(sel), color: '#6c757d', fontSize: 12 }}>{p.modelo || '—'}</td>}
                  <td style={{ ...TD(sel), color: '#6c757d', fontSize: 12 }}>{p.grupo || '—'}</td>
                  {mostrarProveedor && <td style={{ ...TD(sel), color: '#6c757d', fontSize: 12 }}>{p.proveedor_nombre || '—'}</td>}
                  <td style={{ ...TD(sel), textAlign: 'right', color: '#6c757d' }}>${parseFloat(p.costo || 0).toFixed(2)}</td>
                  <td style={{ ...TD(sel), textAlign: 'right', fontWeight: 700, color: '#2980b9' }}>${parseFloat(p.pvp1 || 0).toFixed(2)}</td>
                  <td style={{ ...TD(sel), textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, color: (p.stock ?? 0) > 0 ? '#27ae60' : '#e74c3c' }}>{p.stock ?? 0}</span>
                  </td>
                  {extraColumns.map((col, ci) => (
                    <td key={ci} style={{ ...TD(sel), textAlign: col.center ? 'center' : 'left' }}>{col.render(p)}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </TableCard>
  );
}
