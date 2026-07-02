const CARD = {
  background: '#fff', border: '1px solid #e9ecef', borderRadius: 10,
  padding: '18px 20px', marginBottom: 20,
};

const INPUT = {
  padding: '7px 10px', border: '1px solid var(--border-color)',
  borderRadius: 7, fontSize: 13, background: '#fff',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

export default function FilterCard({ titulo, children, onLimpiar, resultado, extra }) {
  return (
    <div style={CARD}>
      {titulo && <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px' }}>{titulo}</h3>}
      {extra && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          {extra}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {children}
      </div>
      {(onLimpiar || resultado) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          {onLimpiar && <button className="btn btn-ghost btn-sm" onClick={onLimpiar}>✕ Limpiar filtros</button>}
          {resultado && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{resultado}</span>}
        </div>
      )}
    </div>
  );
}

export function FilterItem({ label, children, span = 1 }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        gridColumn: `span ${span}`,
      }}
    >
      <label style={{ fontSize: 12, fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}

export const filterInputStyle = { ...INPUT, width: '100%' };
