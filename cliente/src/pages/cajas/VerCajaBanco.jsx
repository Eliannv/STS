import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import RegistrarMovimientoBancoModal from '../../components/cajas/RegistrarMovimientoBancoModal';
import StatCard from '../../components/common/StatCard';
import TableCard from '../../components/common/TableCard';

const FMT   = v => `$${parseFloat(v || 0).toFixed(2)}`;
const FECHA = s => {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00');
  return isNaN(d) ? s : d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
const FECHAHORA = s => {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const CATEGORIA_LABEL = {
  CIERRE_CAJA_CHICA: 'Cierre caja chica',
  TRANSFERENCIA_CLIENTE: 'Transferencia de cliente',
  OTRO_INGRESO: 'Otros ingresos',
  PAGO_PROVEEDORES: 'Pago proveedores',
  PAGO_TRABAJADOR: 'Pago trabajador',
  OTRO_EGRESO: 'Otros egresos',
};

const BADGE = {
  ABIERTA: { bg: '#d4edda', color: '#155724' },
  CERRADA: { bg: '#f8d7da', color: '#721c24' },
};

function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#6c757d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14 }}>{value}</div>
    </div>
  );
}

export default function VerCajaBanco() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { isAdmin } = useAuth();

  const [caja,        setCaja]        = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [buscar,      setBuscar]      = useState('');
  const [accordion,   setAccordion]   = useState(false);
  const [modalMov,    setModalMov]    = useState(false);
  const [cerrando,    setCerrando]    = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [resCaja, resMov] = await Promise.all([
      api.get(`/caja-banco/buscar/${id}`),
      api.get(`/caja-banco/${id}/movimientos`),
    ]);
    if (resCaja.ok) setCaja(resCaja.data.resultado);
    else setError('No se encontró la caja banco');
    if (resMov.ok) setMovimientos(resMov.data.resultado || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  async function cerrarCaja() {
    if (!window.confirm('¿Cerrar esta caja banco? Esta acción no se puede deshacer.')) return;
    setCerrando(true);
    const res = await api.put('/caja-banco/cerrar', { cajaBancoId: parseInt(id) });
    if (res.ok) cargar();
    else setError(res.data?.resultado || 'Error al cerrar');
    setCerrando(false);
  }

  async function eliminarMovimiento(movId) {
    if (!window.confirm('¿Eliminar este movimiento? El saldo será revertido.')) return;
    const res = await api.delete(`/caja-banco/movimiento/${movId}`);
    if (res.ok) cargar();
    else setError(res.data?.resultado || 'Error al eliminar movimiento');
  }

  if (loading) return (
    <div className="page"><div className="spinner-wrapper"><div className="spinner" /><span style={{ marginLeft: 10, color: 'var(--text-muted)', fontSize: 14 }}>Cargando caja banco...</span></div></div>
  );

  if (!caja) return (
    <div className="page">
      {error && <div className="alert alert-error">{error}</div>}
      <button className="btn btn-ghost" onClick={() => navigate('/caja-banco')}>← Volver</button>
    </div>
  );

  const esAbierta = caja.estado === 'ABIERTA';
  const badgeStyle = BADGE[caja.estado] || {};
  const resumen   = caja.resumen || {};

  const movsFiltrados = movimientos.filter(m =>
    !buscar
    || m.descripcion?.toLowerCase().includes(buscar.toLowerCase())
    || m.referencia?.toLowerCase().includes(buscar.toLowerCase())
    || CATEGORIA_LABEL[m.categoria]?.toLowerCase().includes(buscar.toLowerCase())
  );

  const resumenCat = movimientos.reduce((acc, m) => {
    const key = m.categoria || 'OTROS';
    acc[key] = (acc[key] || 0) + parseFloat(m.monto || 0);
    return acc;
  }, {});

  return (
    <div className="page">

      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 className="page-title" style={{ margin: 0 }}>Caja Banco — {FECHA(caja.fecha)}</h1>
            <span style={{ ...badgeStyle, padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>{caja.estado}</span>
          </div>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Registrada por <strong>{caja.usuario_nombre}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {esAbierta && (
            <button className="btn btn-primary" onClick={() => setModalMov(true)}>+ Registrar Movimiento</button>
          )}
          {esAbierta && isAdmin && (
            <button className="btn btn-ghost" onClick={cerrarCaja} disabled={cerrando}
              style={{ borderColor: '#dc3545', color: '#dc3545' }}>
              {cerrando ? 'Cerrando...' : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Cerrar Caja</>
              )}
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => navigate('/caja-banco')}>← Volver</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
          label="Saldo inicial" value={FMT(caja.saldo_inicial)} color="#3498db" subtext={`${resumen.cantidad_movimientos || 0} mov. total`} />
        <StatCard icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
          label="Total ingresos" value={FMT(resumen.total_ingresos)} color="#27ae60" subtext={`${resumen.cant_ingresos || 0} mvtos.`} />
        <StatCard icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>}
          label="Total egresos" value={FMT(resumen.total_egresos)} color="#e74c3c" subtext={`${resumen.cant_egresos || 0} mvtos.`} />
        <StatCard icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          label="Saldo actual" value={FMT(caja.saldo_actual)}
          color={parseFloat(caja.saldo_actual) >= 0 ? '#27ae60' : '#e74c3c'} />
      </div>

      <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 10, marginBottom: 20, overflow: 'hidden' }}>
        <button type="button" onClick={() => setAccordion(!accordion)}
          style={{ width: '100%', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Información de la caja</span>
          <span style={{ fontSize: 12, color: '#adb5bd' }}>{accordion ? '▲' : '▼'}</span>
        </button>
        {accordion && (
          <div style={{ borderTop: '1px solid #e9ecef', padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            <InfoRow label="Fecha apertura" value={FECHA(caja.fecha)} />
            <InfoRow label="Usuario"        value={caja.usuario_nombre} />
            <InfoRow label="Observación"    value={caja.observacion || '—'} />
            {caja.estado === 'CERRADA' && (
              <>
                <InfoRow label="Cerrada el"  value={FECHAHORA(caja.cerrado_en)} />
                <InfoRow label="Cerrada por" value={caja.cerrado_por_nombre || '—'} />
              </>
            )}
          </div>
        )}
      </div>

      {Object.keys(resumenCat).length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 10, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e9ecef' }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Resumen por Categoría</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: 16 }}>
            {Object.entries(resumenCat).map(([cat, total]) => (
              <div key={cat} style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8, padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 140 }}>
                <span style={{ fontSize: 11, color: '#6c757d', fontWeight: 600 }}>{CATEGORIA_LABEL[cat] || cat}</span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{FMT(total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <TableCard scrollY
        header={
          <>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Movimientos ({movsFiltrados.length})</span>
            <input type="text" placeholder="Buscar por descripción, referencia o categoría..."
              value={buscar} onChange={e => setBuscar(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid var(--border-color)', borderRadius: 7, fontSize: 13, width: 260 }} />
          </>
        }
        loading={false}
        empty={movsFiltrados.length === 0}
        emptyText={buscar ? 'Sin resultados' : 'Sin movimientos registrados'}
        hidePagination
      >
        <table>
          <thead>
            <tr>
              {['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto', 'Saldo ant.', 'Saldo nuevo', 'Ref.', isAdmin && esAbierta ? 'Elim.' : null]
                .filter(Boolean).map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#6c757d', borderBottom: '2px solid #dee2e6', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
            </tr>
          </thead>
          <tbody>
            {movsFiltrados.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontSize: 12, color: '#6c757d' }}>{FECHAHORA(m.fecha)}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{
                    background: m.tipo === 'INGRESO' ? '#d4edda' : '#f8d7da',
                    color:      m.tipo === 'INGRESO' ? '#155724' : '#721c24',
                    display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  }}>{m.tipo}</span>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ background: '#e9ecef', color: '#495057', display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {CATEGORIA_LABEL[m.categoria] || m.categoria || '—'}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.descripcion}</td>
                <td style={{ padding: '10px 14px', fontWeight: 600, color: m.tipo === 'INGRESO' ? '#27ae60' : '#e74c3c' }}>
                  {m.tipo === 'EGRESO' ? '-' : '+'}{FMT(m.monto)}
                </td>
                <td style={{ padding: '10px 14px', color: '#6c757d', fontSize: 12 }}>{FMT(m.saldo_anterior)}</td>
                <td style={{ padding: '10px 14px', fontWeight: 500 }}>{FMT(m.saldo_nuevo)}</td>
                <td style={{ padding: '10px 14px', color: '#6c757d', fontSize: 12 }}>{m.referencia || '—'}</td>
                {isAdmin && esAbierta && (
                  <td style={{ padding: '10px 14px' }}>
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => eliminarMovimiento(m.id)}
                      style={{ color: '#dc3545', borderColor: '#dc3545', padding: '2px 8px', fontSize: 12 }}>
                      ✕
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <RegistrarMovimientoBancoModal
        abierto={modalMov}
        cajaBancoId={parseInt(id)}
        saldoActual={parseFloat(caja.saldo_actual || 0)}
        onCerrar={() => setModalMov(false)}
        onRegistrado={() => cargar()}
      />
    </div>
  );
}
