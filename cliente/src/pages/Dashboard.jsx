import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { usuario } = useAuth();

  const cards = [
    { label: 'Clientes',          color: '#3498db', route: '/clientes',   icon: '👥' },
    { label: 'Historial Clínico', color: '#27ae60', route: '/historial',  icon: '📋' },
    { label: 'Productos',         color: '#9b59b6', route: '/productos',  icon: '📦' },
    { label: 'Proveedores',       color: '#e67e22', route: '/proveedores',icon: '🚚' },
    { label: 'Sucursales',        color: '#1abc9c', route: '/sucursales', icon: '🏠' },
    { label: 'Usuarios',          color: '#e74c3c', route: '/usuarios',   icon: '👤' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bienvenido, {usuario?.nombre}</h1>
          <p className="page-subtitle">Sistema de Gestión — Óptica Macías</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        {cards.map(card => (
          <a key={card.route} href={card.route} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: '24px 20px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{card.icon}</div>
              <div style={{ width: 40, height: 4, background: card.color, borderRadius: 2, margin: '0 auto 12px' }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{card.label}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
