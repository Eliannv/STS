import { FileBarChart, Search, X } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import categoriesConfig from '../../config/reportes/categories.config';
import reportsConfig from '../../config/reportes/reports.config';
import { useState } from 'react';

const STATE_STY = {
  disponible:    { bg: '#d4edda', color: '#155724', label: 'Disponible' },
  beta:          { bg: '#fff3cd', color: '#856404', label: 'Beta' },
  proximamente:  { bg: '#e9ecef', color: '#6c757d', label: 'Próximamente' },
};

function stateBadge(enabled, beta) {
  if (!enabled) return STATE_STY.proximamente;
  if (beta)     return STATE_STY.beta;
  return STATE_STY.disponible;
}

function ReportCard({ report, onClick }) {
  const st = stateBadge(report.enabled, report.beta);

  return (
    <div
      className="card"
      role="button"
      tabIndex={report.enabled ? 0 : -1}
      onClick={report.enabled ? onClick : undefined}
      onKeyDown={event => {
        if (report.enabled && (event.key === 'Enter' || event.key === ' ')) onClick();
      }}
      style={{
        minHeight: 132,
        padding: 18,
        opacity: report.enabled ? 1 : 0.55,
        cursor: report.enabled ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#3498db',
            background: '#3498db18',
          }}
        >
          <FileBarChart size={18} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#212529', fontSize: 15, fontWeight: 700 }}>{report.title}</div>
          <div style={{ color: '#6c757d', fontSize: 12, lineHeight: 1.5, marginTop: 6 }}>{report.description}</div>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 10px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            background: st.bg,
            color: st.color,
          }}
        >
          {st.label}
        </span>
      </div>
    </div>
  );
}

export default function ReportCategory() {
  const navigate = useNavigate();
  const { categoria } = useParams();
  const category = categoriesConfig.find(item => item.id === categoria);

  const [busqueda, setBusqueda] = useState('');

  if (!category) return <Navigate to="/reportes" replace />;

  const raw = reportsConfig[category.id];
  const reports = (category.reports || [])
    .map(reportId => raw?.[reportId])
    .filter(Boolean)
    .filter(report => {
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      return (report.title || '').toLowerCase().includes(q)
          || (report.description || '').toLowerCase().includes(q);
    });

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <Breadcrumb items={[
            { label: 'Reportes', href: '/reportes' },
            { label: category.title },
          ]} />
          <h1 className="page-title">{category.title}</h1>
          <p className="page-subtitle">{category.description}</p>
        </div>
      </div>

      <div style={{ marginBottom: 16, position: 'relative' }}>
        <Search
          size={15}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#adb5bd',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Buscar reportes..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{
            width: '100%',
            maxWidth: 360,
            height: 36,
            padding: '0 32px 0 36px',
            border: '1px solid #dee2e6',
            borderRadius: 8,
            fontSize: 13,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {busqueda && (
          <button
            type="button"
            onClick={() => setBusqueda('')}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: '#adb5bd',
              lineHeight: 0,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 14,
        }}
      >
        {reports.length === 0 ? (
          <p style={{ color: '#adb5bd', fontSize: 13, gridColumn: '1 / -1', textAlign: 'center', padding: 32 }}>
            No se encontraron reportes que coincidan con la búsqueda.
          </p>
        ) : (
          reports.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              onClick={() => navigate(`/reportes/${category.id}/${report.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
