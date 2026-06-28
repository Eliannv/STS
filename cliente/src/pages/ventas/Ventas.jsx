import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import StatCard from '../../components/common/StatCard';

const FMT  = v => `$${parseFloat(v || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;
const FECHA = s => {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const ESTADO = {
  PAGADA:    { bg: '#d4edda', color: '#155724', label: 'Pagada'   },
  PENDIENTE: { bg: '#fff3cd', color: '#856404', label: 'Pendiente'},
  ANULADA:   { bg: '#f8d7da', color: '#721c24', label: 'Anulada'  },
};
const TIPO = {
  CONTADO: { bg: '#e3f0ff', color: '#1a56db', label: 'Contado' },
  CREDITO: { bg: '#f3e8ff', color: '#7c3aed', label: 'Crédito' },
};

export default function Ventas() {
  const navigate    = useNavigate();
  const { isAdmin } = useAuth();

  const [lista,      setLista]      = useState([]);
  const [hasNext,    setHasNext]    = useState(false);
  const [page,       setPage]       = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [buscar,     setBuscar]     = useState('');
  const [estado,     setEstado]     = useState('');
  const [tipo,       setTipo]       = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Stats derivados
  const totalVentas   = lista.length;
  const totalPagadas  = lista.filter(v => v.estado === 'PAGADA').length;
  const totalPendientes = lista.filter(v => v.estado === 'PENDIENTE').length;
  const totalFacturado = lista.reduce((s, v) => s + parseFloat(v.total || 0), 0);
  const totalDeuda     = lista.reduce((s, v) => s + parseFloat(v.saldo_pendiente || 0), 0);

  const cargar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (buscar)     params.set('buscar',     buscar);
    if (estado)     params.set('estado',     estado);
    if (tipo)       params.set('tipo',       tipo);
    if (fechaDesde) params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params.set('fechaHasta', fechaHasta);
    params.set('limit',  '16');
    params.set('offset', String(page * 15));
    const res = await api.get(`/factura/lista?${params}`);
    if (res.ok) {
      const data = Array.isArray(res.data.resultado) ? res.data.resultado : [];
      setHasNext(data.length > 15);
      setLista(data.slice(0, 15));
    }
    setLoading(false);
  }, [buscar, estado, tipo, fechaDesde, fechaHasta, page]);

  useEffect(() => { setPage(0); }, [buscar, estado, tipo, fechaDesde, fechaHasta]);
  useEffect(() => { const t = setTimeout(cargar, 300); return () => clearTimeout(t); }, [cargar]);

  async function handleEliminar(id) {
  const confirm = await Swal.fire({
    title: "Eliminar venta",
    text: "¿Eliminar esta venta? Esta acción no se puede revertir.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#d33",
    reverseButtons: true,
  });

  if (!confirm.isConfirmed) return;

  const res = await api.delete('/factura/eliminar', { id });

  if (res.ok) {
    cargar();
    Swal.fire({
      title: "Venta eliminada",
      icon: "success",
      timer: 3000,
            toast: true,
              position: 'top-end',
            showConfirmButton: false
    });
  } else {
    Swal.fire({
      title: "No se pudo eliminar",
      text: res.data?.resultado || "Error al eliminar",
      icon: "error",
      timer: 3000,
            toast: true,
              position: 'top-end',
            showConfirmButton: false
    });
  }
}

  async function handleCobrar(v) {
    navigate(`/facturas/cobrar?clienteId=${v.cliente_id}`);
  }

  function limpiarFiltros() {
    setBuscar(''); setEstado(''); setTipo(''); setFechaDesde(''); setFechaHasta('');
  }

  const hayFiltros = buscar || estado || tipo || fechaDesde || fechaHasta;

  return (
    <div className="page">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Ventas</h1>
          <p className="page-subtitle">Registro de facturas y cobros</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/facturas/cobrar')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
              <path d="M9 12h6"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Cobrar deuda
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/facturas/nueva')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva venta
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        <StatCard icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
          label="Total ventas" value={totalVentas} color="#3498db" />
        <StatCard icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          label="Pagadas" value={totalPagadas} color="#27ae60" />
        <StatCard icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          label="Pendientes" value={totalPendientes} color="#f39c12" />
        <StatCard icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          label="Total facturado" value={FMT(totalFacturado)} color="#8e44ad" />
        <StatCard icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
          label="Deuda total" value={FMT(totalDeuda)} color={totalDeuda > 0 ? '#e74c3c' : '#27ae60'} />
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
              <input placeholder="Factura, cliente, ID..." value={buscar} onChange={e => setBuscar(e.target.value)} />
            </div>
          </div>
          <div className="form-group" style={{ flex: '0 0 140px' }}>
            <label className="form-label">Estado</label>
            <select className="form-control" value={estado} onChange={e => setEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="PAGADA">Pagada</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: '0 0 160px' }}>
            <label className="form-label">Tipo</label>
            <select className="form-control" value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="">Todos</option>
              <option value="CONTADO">Contado</option>
              <option value="CREDITO">Crédito</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: '0 0 140px' }}>
            <label className="form-label">Desde</label>
            <input type="date" className="form-control" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: '0 0 140px' }}>
            <label className="form-label">Hasta</label>
            <input type="date" className="form-control" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="card-header" style={hayFiltros ? { padding: '16px 20px' } : { padding: 0, border: 'none' }}>
          {hayFiltros && (
            <button className="btn btn-ghost btn-sm" onClick={limpiarFiltros} >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Limpiar
            </button>
          )}
        </div>
        <div className="table-container">
          {loading ? (
            <div className="spinner-wrapper"><div className="spinner" /></div>
          ) : lista.length === 0 ? (
            <div className="empty-state">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" style={{ marginBottom: 8 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p>No se encontraron ventas</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Método Pago</th>
                  <th>Tipo</th>
                  <th>Total</th>
                  <th>Saldo Pendiente</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(v => {
                  const est = ESTADO[v.estado] || ESTADO.PENDIENTE;
                  const tip = TIPO[v.tipo]     || TIPO.CONTADO;
                  return (
                    <tr key={v.id}>
                      <td>
                        <code style={{ background: '#f0f4ff', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                          {v.id_personalizado || v.id}
                        </code>
                      </td>
                      <td>
                        <button
                          onClick={() => navigate(`/clientes/${v.cliente_id}/ficha`)}
                          style={{ background: 'none', border: 'none', padding: 0, color: '#1a56db', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                        >
                          {v.cliente_nombre || '—'}
                        </button>
                        {v.cedula && <div style={{ fontSize: 11, color: '#6c757d' }}>{v.cedula}</div>}
                      </td>
                      <td style={{ fontSize: 12, color: '#6c757d' }}>{FECHA(v.created_at)}</td>
                      <td style={{ fontSize: 13 }}>{v.metodo_pago || '—'}</td>
                      <td>
                        <span style={{ ...BADGE, background: tip.bg, color: tip.color }}>{tip.label}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{FMT(v.total)}</td>
                      <td>
                        {parseFloat(v.saldo_pendiente) > 0
                          ? <span style={{ color: '#e74c3c', fontWeight: 700 }}>{FMT(v.saldo_pendiente)}</span>
                          : <span style={{ color: '#27ae60', fontWeight: 700 }}>✓ {FMT(0)}</span>
                        }
                      </td>
                      <td>
                        <span style={{ ...BADGE, background: est.bg, color: est.color }}>{est.label}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {parseFloat(v.saldo_pendiente) > 0 && (
                            <button className="btn btn-ghost btn-sm" onClick={() => handleCobrar(v)} title="Marcar como pagada">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                              </svg>
                            </button>
                          )}
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/facturas/${v.id}`)} title="Ver factura">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                          {isAdmin && (
                            <button className="btn-icon danger" onClick={() => handleEliminar(v.id)} title="Eliminar venta">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {/* Paginación */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '10px 20px', borderTop: '1px solid #e9ecef' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>← Anterior</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={!hasNext}>Siguiente →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const BADGE = {
  display: 'inline-block', padding: '2px 8px', borderRadius: 20,
  fontSize: 11, fontWeight: 600,
};
