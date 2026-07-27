// Piezas visuales compartidas por los bloques de la Ficha del Cliente.
// Van en un .jsx aparte de fichaUtils.js porque el build solo transforma JSX
// en archivos con esa extensión.

export const Tarjeta = ({ titulo, children, accion, style }) => (
  <div className="card" style={{ padding: 0, ...style }}>
    {(titulo || accion) && (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid var(--border-light, #f0f2f5)',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>
          {titulo}
        </span>
        {accion}
      </div>
    )}
    <div style={{ padding: 16 }}>{children}</div>
  </div>
);

export const Dato = ({ label, children, ancho }) => (
  <div style={{ minWidth: ancho || 0 }}>
    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 2 }}>
      {label}
    </div>
    <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{children ?? '—'}</div>
  </div>
);

export const Vacio = ({ mensaje, icono }) => (
  <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
    {icono && <div style={{ marginBottom: 8, opacity: 0.5 }}>{icono}</div>}
    <div style={{ fontSize: 13 }}>{mensaje}</div>
  </div>
);
