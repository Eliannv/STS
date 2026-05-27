import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const FMT = v => `$${parseFloat(v || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;
const FMT_FECHA = s => s ? new Date(s + 'T00:00:00').toLocaleDateString('es-EC') : '—';

export default function Ingresos() {
  const navigate  = useNavigate();
  const { isAdmin } = useAuth();

  const [lista, setLista]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [buscar, setBuscar]       = useState('');
  const [estado, setEstado]       = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Stats derivados
  const totalFacturas   = lista.length;
  const totalBorradores = lista.filter(i => i.estado === 'BORRADOR').length;
  const totalPagado     = lista
    .filter(i => i.estado === 'FINALIZADO')
    .reduce((sum, i) => sum + parseFloat(i.total || 0), 0);
  const totalItems      = lista.reduce((sum, i) => sum + parseInt(i.total_items || 0), 0);

  const cargar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (buscar)     params.set('buscar',     buscar);
    if (estado)     params.set('estado',     estado);
    if (fechaDesde) params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params.set('fechaHasta', fechaHasta);
    const res = await api.get(`/ingreso/lista${params.toString() ? '?' + params : ''}`);
    if (res.ok) setLista(res.data.resultado || []);
    setLoading(false);
  }, [buscar, estado, fechaDesde, fechaHasta]);

  useEffect(() => {
    const t = setTimeout(cargar, 300);
    return () => clearTimeout(t);
  }, [cargar]);

  async function eliminar(id) {
    if (!confirm('¿Eliminar este ingreso (solo disponible en BORRADOR)?')) return;
    const res = await api.delete('/ingreso/eliminar', { id });
    if (res.ok) cargar();
  }

  function chipEstado(e) {
    if (e === 'FINALIZADO') return { bg: '#d4edda', color: '#155724', label: 'Finalizado' };
    return { bg: '#fff3cd', color: '#856404', label: 'Borrador' };
  }

  return (
    <div className="page">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Ingresos</h1>
          <p className="page-subtitle">Registro de compras y entradas de inventario</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => navigate('/ingresos/nuevo')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo ingreso
          </button>
        )}
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <StatCard
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
          label="Total facturas" value={totalFacturas} color="#3498db" />
        <StatCard
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          label="Total pagado" value={FMT(totalPagado)} color="#27ae60" />
        <StatCard
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>}
          label="Unidades ingresadas" value={totalItems.toLocaleString()} color="#9b59b6" />
        <StatCard
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          label="Pendientes (borrador)" value={totalBorradores} color="#f39c12" />
      </div>

      {/* Filtros */}
      <div className="card" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label className="form-label">Buscar</label>
            <div className="search-bar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input placeholder="Factura, proveedor, ID..." value={buscar} onChange={e => setBuscar(e.target.value)} />
            </div>
          </div>
          <div className="form-group" style={{ flex: '0 0 140px' }}>
            <label className="form-label">Estado</label>
            <select className="form-control" value={estado} onChange={e => setEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="BORRADOR">Borrador</option>
              <option value="FINALIZADO">Finalizado</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: '0 0 150px' }}>
            <label className="form-label">Desde</label>
            <input type="date" className="form-control" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: '0 0 150px' }}>
            <label className="form-label">Hasta</label>
            <input type="date" className="form-control" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
          </div>
          {(buscar || estado || fechaDesde || fechaHasta) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setBuscar(''); setEstado(''); setFechaDesde(''); setFechaHasta(''); }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">{lista.length} ingresos</span>
        </div>
        <div className="table-container">
          {loading ? <div className="spinner-wrapper"><div className="spinner"/></div> : (
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Proveedor</th><th>N° Factura</th>
                  <th>Fecha</th><th>Tipo</th><th>Productos</th>
                  <th>Total</th><th>Estado</th>
                  {isAdmin && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {lista.length === 0
                  ? <tr><td colSpan={9} className="empty-state">Sin ingresos registrados</td></tr>
                  : lista.map(ing => {
                    const chip = chipEstado(ing.estado);
                    return (
                      <tr key={ing.id}>
                        <td>
                          <code style={{ background: '#f0f4ff', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
                            {ing.id_personalizado || `#${ing.id}`}
                          </code>
                        </td>
                        <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ing.proveedor_nombre || <span style={{ color: 'var(--text-muted)' }}>Sin proveedor</span>}
                        </td>
                        <td>{ing.numero_factura}</td>
                        <td>{FMT_FECHA(ing.fecha)}</td>
                        <td>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                            background: ing.tipo_compra === 'CONTADO' ? '#e8f5e9' : '#fce4ec',
                            color: ing.tipo_compra === 'CONTADO' ? '#2e7d32' : '#880e4f',
                          }}>
                            {ing.tipo_compra}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {ing.cantidad_detalles ?? 0} líneas
                        </td>
                        <td><strong>{FMT(ing.total)}</strong></td>
                        <td>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px',
                            borderRadius: 99, background: chip.bg, color: chip.color,
                          }}>
                            {chip.label}
                          </span>
                        </td>
                        {isAdmin && (
                          <td style={{ display: 'flex', gap: 4 }}>
                            {ing.estado === 'BORRADOR' && (
                              <button
                                className="btn-icon"
                                title="Continuar ingreso"
                                onClick={() => navigate(`/ingresos/${ing.id}/productos`)}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                                  <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
                                </svg>
                              </button>
                            )}
                            {ing.estado === 'BORRADOR' && (
                              <button className="btn-icon danger" title="Eliminar" onClick={() => eliminar(ing.id)}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                </svg>
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius-md)',
        background: color + '18', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </p>
        <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
          {value}
        </p>
      </div>
    </div>
  );
}
