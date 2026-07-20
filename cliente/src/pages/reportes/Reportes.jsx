import { DollarSign, Landmark, Package, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import categoriesConfig from '../../config/reportes/categories.config';

const MOCK_INDICATORS = [
  { icon: <DollarSign size={20} />, label: 'Ventas del día',      value: '$1,280.00',   color: '#27ae60', subtext: '4 ventas' },
  { icon: <ShoppingCart size={20} />, label: 'Ventas del mes',    value: '$18,450.00',  color: '#3498db', subtext: '62 ventas' },
  { icon: <Package size={20} />, label: 'Productos registrados',  value: '340',         color: '#e67e22', subtext: '24 sin stock' },
  { icon: <Landmark size={20} />, label: 'Saldo en caja',         value: '$5,320.00',   color: '#1abc9c', subtext: 'Caja chica + banco' },
];

function CategoryCard({ category, onClick }) {
  const Icon = category.icon;

  return (
    <button
      type="button"
      className="card"
      onClick={onClick}
      style={{
        border: '1px solid #e9ecef',
        borderTop: `4px solid ${category.color}`,
        cursor: 'pointer',
        padding: 20,
        textAlign: 'left',
        transition: 'all 0.15s',
      }}
      onMouseEnter={event => {
        event.currentTarget.style.borderColor = category.color;
        event.currentTarget.style.transform = 'translateY(-2px)';
        event.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)';
      }}
      onMouseLeave={event => {
        event.currentTarget.style.borderColor = '#e9ecef';
        event.currentTarget.style.borderTopColor = category.color;
        event.currentTarget.style.transform = '';
        event.currentTarget.style.boxShadow = '';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: category.color,
            background: `${category.color}18`,
          }}
        >
          <Icon size={23} />
        </span>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#212529' }}>{category.title}</span>
      </div>
      <p style={{ minHeight: 38, margin: 0, color: '#6c757d', fontSize: 13, lineHeight: 1.5 }}>
        {category.description}
      </p>
      <div style={{ marginTop: 16, color: category.color, fontSize: 12, fontWeight: 700 }}>
        {category.reports.length} reportes disponibles
      </div>
    </button>
  );
}

export default function Reportes() {
  const navigate = useNavigate();
  const categories = [...categoriesConfig].sort((first, second) => first.order - second.order);

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Consulta información consolidada del sistema.</p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        {MOCK_INDICATORS.map((ind, i) => (
          <StatCard key={i} {...ind} />
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 14,
        }}
      >
        {categories.map(category => (
          <CategoryCard
            key={category.id}
            category={category}
            onClick={() => navigate(`/reportes/${category.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
