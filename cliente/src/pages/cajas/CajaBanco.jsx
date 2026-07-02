import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import AbrirCajaBancoModal from '../../components/cajas/AbrirCajaBancoModal';
import StatCard from '../../components/common/StatCard';
import FilterCard, { FilterItem, filterInputStyle } from '../../components/common/FilterCard';

const FMT   = v => `$${parseFloat(v || 0).toFixed(2)}`;
const FECHA = s => {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00');
  return isNaN(d) ? s : d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const ESTADO_BADGE = {
  ABIERTA: { bg: '#d4edda', color: '#155724' },
  CERRADA: { bg: '#f8d7da', color: '#721c24' },
};

export default function CajaBanco() {
  const navigate    = useNavigate();
  const { isAdmin } = useAuth();

  const [lista,         setLista]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filtroEstado,  setFiltroEstado]  = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [modalAbrir,    setModalAbrir]    = useState(false);
  const [page,          setPage]          = useState(0);
  const [hasNext,       setHasNext]       = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroEstado)     params.set('estado',     filtroEstado);
    if (filtroFechaDesde) params.set('fechaDesde', filtroFechaDesde);
    if (filtroFechaHasta) params.set('fechaHasta', filtroFechaHasta);
    params.set('limit',  '21');
    params.set('offset', String(page * 20));
    const res = await api.get(`/caja-banco/lista?${params}`);
    if (res.ok) {
      const data = res.data.resultado || [];
      setHasNext(data.length > 20);
      setLista(data.slice(0, 20));
    }
    setLoading(false);
  }, [filtroEstado, filtroFechaDesde, filtroFechaHasta, page]);

  useEffect(() => { setPage(0); }, [filtroEstado, filtroFechaDesde, filtroFechaHasta]);
  useEffect(() => { cargar(); }, [cargar]);

  function limpiarFiltros() {
    setFiltroEstado(''); setFiltroFechaDesde(''); setFiltroFechaHasta('');
  }

  // KPIs (de la página actual)
  const totalCajas       = lista.length;
  const cajasAbiertas    = lista.filter(c => c.estado === 'ABIERTA').length;
  const saldoTotalActual = lista.reduce((s, c) => s + parseFloat(c.saldo_actual || 0), 0);
  const saldoTotalInicial = lista.reduce((s, c) => s + parseFloat(c.saldo_inicial || 0), 0);

  return (
    <div className="page">

      {/* ═══ HEADER ═══ */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Caja Banco</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>Registro de ingresos y egresos financieros</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setModalAbrir(true)}>
            + Abrir Caja Banco
          </button>
        )}
      </div>

      {/* ═══ KPIs ═══ */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 20 }}>
          <StatCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>}
            label="Total cajas" value={totalCajas} color="#3498db" />
          <StatCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>}
            label="Abiertas" value={cajasAbiertas} color="#28a745" subtext={`${totalCajas - cajasAbiertas} cerradas`} />
          <StatCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
            label="Saldo total" value={FMT(saldoTotalActual)} color="#17a2b8" />
          <StatCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>}
            label="Capital inicial" value={FMT(saldoTotalInicial)} color="#6c757d" />
        </div>
      )}

      <FilterCard
        titulo="Filtros de Búsqueda"
        onLimpiar={limpiarFiltros}
        resultado={!loading ? `${lista.length} caja${lista.length !== 1 ? 's' : ''} encontrada${lista.length !== 1 ? 's' : ''}` : ''}
      >
        <FilterItem label="Estado">
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={filterInputStyle}>
            <option value="">Todos</option>
            <option value="ABIERTA">Abierta</option>
            <option value="CERRADA">Cerrada</option>
          </select>
        </FilterItem>
        <FilterItem label="Fecha desde">
          <input type="date" value={filtroFechaDesde} onChange={e => setFiltroFechaDesde(e.target.value)} style={filterInputStyle} />
        </FilterItem>
        <FilterItem label="Fecha hasta">
          <input type="date" value={filtroFechaHasta} onChange={e => setFiltroFechaHasta(e.target.value)} style={filterInputStyle} />
        </FilterItem>
      </FilterCard>

      {/* ═══ LOADING ═══ */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, flexDirection: 'column', gap: 12 }}>
          <div className="spinner" />
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Cargando cajas banco...</span>
        </div>
      )}

      {/* ═══ TABLA ═══ */}
      {!loading && (
        <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  {['Fecha', 'Estado', 'Saldo inicial', 'Saldo actual', 'Usuario', 'Cerrado por', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: '#495057', borderBottom: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                      No hay cajas banco registradas
                    </td>
                  </tr>
                ) : lista.map(caja => {
                  const badge = ESTADO_BADGE[caja.estado] || {};
                  return (
                    <tr key={caja.id} style={{ borderBottom: '1px solid #f0f0f0' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '12px 14px', fontWeight: 500 }}>{FECHA(caja.fecha)}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ ...badge, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
                          {caja.estado}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>{FMT(caja.saldo_inicial)}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: parseFloat(caja.saldo_actual) > 0 ? '#28a745' : '#dc3545' }}>
                        {FMT(caja.saldo_actual)}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#6c757d' }}>{caja.usuario_nombre || '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#6c757d' }}>{caja.cerrado_por_nombre || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => navigate(`/caja-banco/${caja.id}`)}>
                          Ver detalle →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '10px 20px', borderTop: '1px solid #dee2e6' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>← Anterior</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={!hasNext}>Siguiente →</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal abrir caja */}
      <AbrirCajaBancoModal
        abierto={modalAbrir}
        onCerrar={() => setModalAbrir(false)}
        onAbierta={caja => { cargar(); navigate(`/caja-banco/${caja.id}`); }}
      />
    </div>
  );
}
