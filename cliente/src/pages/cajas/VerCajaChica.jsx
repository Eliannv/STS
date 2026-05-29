import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import RegistrarMovimientoChicaModal from '../../components/cajas/RegistrarMovimientoChicaModal';
import Swal from 'sweetalert2';
import { Lock } from 'lucide-react';

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

function KpiCard({ label, value, color = '#3498db', sub }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e9ecef', borderRadius: 10,
      padding: '16px 20px', borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 11, color: '#6c757d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#2c3e50' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#6c757d', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

const BADGE = {
  ABIERTA: { bg: '#d4edda', color: '#155724' },
  CERRADA: { bg: '#f8d7da', color: '#721c24' },
};

export default function VerCajaChica() {
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
      api.get(`/caja-chica/buscar/${id}`),
      api.get(`/caja-chica/${id}/movimientos`),
    ]);
    if (resCaja.ok) setCaja(resCaja.data.resultado);
    else setError('No se encontró la caja');
    if (resMov.ok) setMovimientos(resMov.data.resultado || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);


  async function cerrarCaja() {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'No podrás revertir esta acción',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, cerrar',
        cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;
    setCerrando(true);
    const res = await api.put('/caja-chica/cerrar', { id: parseInt(id) });
    if (res.ok){
        cargar();
        await Swal.fire({
            title: 'Cerrado',
            text: 'La caja fue cerrada correctamente',
            icon: 'success',
            timer: 3000,
            toast: true,
              position: 'top-end',
            showConfirmButton: false
          });
    } else {
        Swal.fire({
            title: 'Error',
            text: 'No se pudo cerrar la caja',
            icon: 'error',
            timer: 3000,
            toast: true,
                position: 'top-end',
            showConfirmButton: false
        });

      setError(res.data?.resultado || 'Error al cerrar');
      setCerrando(false);
    }
  }

  async function eliminarMovimiento(movId) {
    if (!window.confirm('¿Eliminar este movimiento? El saldo será revertido.')) return;
    const res = await api.delete(`/caja-chica/movimiento/${movId}`);
    if (res.ok) cargar();
    else setError(res.data?.resultado || 'Error al eliminar movimiento');
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 100, flexDirection: 'column', gap: 12 }}>
      <div className="spinner" />
      <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Cargando caja...</span>
    </div>
  );

  if (!caja) return (
    <div className="page">
      {error && <div className="alert alert-error">{error}</div>}
      <button className="btn btn-ghost" onClick={() => navigate('/caja-chica')}>← Volver</button>
    </div>
  );

  const esAbierta   = caja.estado === 'ABIERTA';
  const badgeStyle  = BADGE[caja.estado] || {};
  const resumen     = caja.resumen || {};
  const movsFiltrados = movimientos.filter(m =>
    !buscar || m.descripcion?.toLowerCase().includes(buscar.toLowerCase())
      || m.referencia?.toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <div className="page">

      {/* ═══ HEADER ═══ */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Caja Chica — {FECHA(caja.fecha)}</h1>
            <span style={{ ...badgeStyle, padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>{caja.estado}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
            Abierta por <strong>{caja.usuario_nombre}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {esAbierta && (
            <button className="btn btn-primary" onClick={() => setModalMov(true)}>
              + Registrar Movimiento
            </button>
          )}
          {esAbierta && isAdmin && (
            <button className="btn btn-ghost" onClick={cerrarCaja} disabled={cerrando}
              style={{ borderColor: '#dc3545', color: '#dc3545' }}>
              {cerrando ? 'Cerrando...' : <><Lock size={16} style={{ marginRight: 4 }} /> Cerrar Caja</>}
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => navigate('/caja-chica')}>← Volver</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* ═══ KPIs ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Saldo inicial"    value={FMT(caja.monto_inicial)}          color="#3498db" />
        <KpiCard label="Total ingresos"   value={FMT(resumen.total_ingresos)}       color="#28a745" sub={`${resumen.cant_ingresos || 0} mvtos.`} />
        <KpiCard label="Total egresos"    value={FMT(resumen.total_egresos)}        color="#dc3545" sub={`${resumen.cant_egresos || 0} mvtos.`} />
        <KpiCard label="Saldo actual"     value={FMT(caja.monto_actual)}
          color={parseFloat(caja.monto_actual) < 10 ? '#dc3545' : '#28a745'}
          sub={`${resumen.cantidad_movimientos || 0} mov. total`} />
      </div>

      {/* ═══ ACORDEÓN INFO ═══ */}
      <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 10, marginBottom: 20, overflow: 'hidden' }}>
        <button type="button" onClick={() => setAccordion(!accordion)}
          style={{ width: '100%', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>ℹ Información de la caja</span>
          <span>{accordion ? '▲' : '▼'}</span>
        </button>
        {accordion && (
          <div style={{ borderTop: '1px solid #e9ecef', padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            <InfoRow label="Fecha apertura"  value={FECHA(caja.fecha)} />
            <InfoRow label="Usuario"         value={caja.usuario_nombre} />
            <InfoRow label="Observación"     value={caja.observacion || '—'} />
            {caja.caja_banco_id && <InfoRow label="Caja Banco"   value={`#${caja.caja_banco_id}`} />}
            {caja.estado === 'CERRADA' && (
              <>
                <InfoRow label="Cerrada el"    value={FECHAHORA(caja.cerrado_en)} />
                <InfoRow label="Cerrada por"   value={caja.cerrado_por_nombre || '—'} />
              </>
            )}
          </div>
        )}
      </div>

      {/* ═══ MOVIMIENTOS ═══ */}
      <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Movimientos ({movsFiltrados.length})</h3>
          <input type="text" placeholder="Buscar por descripción o referencia..."
            value={buscar} onChange={e => setBuscar(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid var(--border-color)', borderRadius: 7, fontSize: 13, width: 280 }} />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: '#f8f9fa' }}>
              <tr>
                {['Fecha', 'Tipo', 'Descripción', 'Monto', 'Saldo anterior', 'Saldo nuevo', 'Referencia', isAdmin && esAbierta ? 'Eliminar' : null]
                  .filter(Boolean).map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#495057', borderBottom: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {movsFiltrados.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  {buscar ? 'Sin resultados' : 'Sin movimientos registrados'}
                </td></tr>
              ) : movsFiltrados.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{FECHAHORA(m.fecha)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      background: m.tipo === 'INGRESO' ? '#d4edda' : '#f8d7da',
                      color:      m.tipo === 'INGRESO' ? '#155724' : '#721c24',
                      padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                    }}>{m.tipo}</span>
                  </td>
                  <td style={{ padding: '10px 14px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.descripcion}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: m.tipo === 'INGRESO' ? '#28a745' : '#dc3545' }}>
                    {m.tipo === 'EGRESO' ? '-' : '+'}{FMT(m.monto)}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#6c757d' }}>{FMT(m.saldo_anterior)}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{FMT(m.saldo_nuevo)}</td>
                  <td style={{ padding: '10px 14px', color: '#6c757d' }}>{m.referencia || '—'}</td>
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
        </div>
      </div>

      {/* Modal movimiento */}
      <RegistrarMovimientoChicaModal
        abierto={modalMov}
        cajaChicaId={parseInt(id)}
        saldoActual={parseFloat(caja.monto_actual || 0)}
        onCerrar={() => setModalMov(false)}
        onRegistrado={() => cargar()}
      />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#6c757d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14 }}>{value}</div>
    </div>
  );
}
