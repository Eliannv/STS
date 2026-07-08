import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import Swal from 'sweetalert2';
import FormModal from '../../components/common/FormModal';

const FMT = v => `$${parseFloat(v || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;
const FECHAFMT = s => {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const ESTADO_BADGE = {
  PENDIENTE: { bg: '#fff3cd', color: '#856404', label: 'Pendiente' },
  LIQUIDADA: { bg: '#d4edda', color: '#155724', label: 'Liquidada' },
};

const BADGE = {
  display: 'inline-block', padding: '2px 8px', borderRadius: 20,
  fontSize: 11, fontWeight: 600,
};

const cardStyle = {
  background: '#fff', border: '1px solid #e9ecef', borderRadius: 10,
  padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const infoRowStyle = {
  display: 'flex', justifyContent: 'space-between', padding: '8px 0',
  borderBottom: '1px solid #f1f5f9', fontSize: 13,
};

export default function VerVentaTarjeta() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [venta, setVenta] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [observacion, setObservacion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function cargarVenta() {
    try {
      setCargando(true);
      const r = await api.get(`/venta-tarjeta/${id}`);
      if (r.ok) {
        setVenta(r.data.resultado);
      } else {
        Swal.fire('Error', r.data.resultado || 'Error al cargar venta', 'error');
        navigate('/ventas/venta-tarjeta');
      }
    } catch (error) {
      Swal.fire('Error', 'Error al cargar venta tarjeta', 'error');
      navigate('/ventas/venta-tarjeta');
    } finally {
      setCargando(false);
    }
  }

  async function cargarHistorial() {
    try {
      const r = await api.get(`/venta-tarjeta/${id}/historial`);
      if (r.ok) {
        const resultado = r.data.resultado || [];
        setHistorial(Array.isArray(resultado) ? resultado : []);
      }
    } catch (error) {}
  }

  function abrirModal() {
    setMonto(''); setFecha(new Date().toISOString().slice(0, 10));
    setObservacion(''); setError(''); setMostrarModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!monto || parseFloat(monto) <= 0) { setError('El monto debe ser mayor a 0'); return; }
    if (parseFloat(monto) > parseFloat(venta.saldo_pendiente)) { setError(`El monto no puede exceder el saldo pendiente de ${FMT(venta.saldo_pendiente)}`); return; }
    if (!fecha) { setError('La fecha es requerida'); return; }

    setGuardando(true);
    try {
      const r = await api.post(`/venta-tarjeta/${venta.id}/registrar-abono`, {
        monto: parseFloat(monto), fecha, observacion: observacion || null,
      });
      if (r.ok) {
        setMostrarModal(false);
        await cargarVenta();
        await cargarHistorial();
        Swal.fire('Éxito', 'Abono registrado correctamente', 'success');
      } else {
        setError(r.data.resultado || 'Error al registrar abono');
      }
    } catch (error) {
      setError('Error al registrar abono');
    } finally {
      setGuardando(false);
    }
  }

  useEffect(() => {
    cargarVenta();
    cargarHistorial();
  }, [id]);

  if (cargando) {
    return (
      <div className="page">
        <div style={{ padding: 60, textAlign: 'center', color: '#6c757d' }}>Cargando...</div>
      </div>
    );
  }

  if (!venta) {
    return (
      <div className="page">
        <div style={{ padding: 60, textAlign: 'center', color: '#6c757d' }}>Venta no encontrada</div>
      </div>
    );
  }

  const progreso = venta.monto_total > 0 ? (venta.monto_recibido / venta.monto_total) * 100 : 0;

  return (
    <div className="page">

      <div className="page-header" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button className="btn btn-ghost" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }} onClick={() => navigate('/ventas/venta-tarjeta')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            Volver
          </button>
          <h1 className="page-title" style={{ margin: 0 }}>Factura #{venta.factura_id_personalizado || venta.factura_id}</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>{venta.cliente_nombre}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={cardStyle}>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: 12, fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 0.5 }}>Información de la Venta</h3>
            <div style={infoRowStyle}><span style={{ fontWeight: 600, color: '#6c757d' }}>Fecha:</span><span style={{ color: '#212529', textAlign: 'right' }}>{FECHAFMT(venta.fecha_venta)}</span></div>
            <div style={infoRowStyle}><span style={{ fontWeight: 600, color: '#6c757d' }}>Cliente:</span><span style={{ color: '#212529', textAlign: 'right' }}>{venta.cliente_nombre_completo || venta.cliente_nombre}</span></div>
            <div style={infoRowStyle}><span style={{ fontWeight: 600, color: '#6c757d' }}>Banco:</span><span style={{ color: '#212529', textAlign: 'right' }}>{venta.banco || '—'}</span></div>
            <div style={infoRowStyle}><span style={{ fontWeight: 600, color: '#6c757d' }}>Últimos 4 dígitos:</span><span style={{ color: '#212529', textAlign: 'right' }}>{venta.ultimos_cuatro_tarjeta || '—'}</span></div>
            <div style={{ ...infoRowStyle, borderBottom: 'none' }}><span style={{ fontWeight: 600, color: '#6c757d' }}>Observación:</span><span style={{ color: '#212529', textAlign: 'right' }}>{venta.observacion || '—'}</span></div>
          </div>
          <div>
            <h3 style={{ margin: '0 0 14px 0', fontSize: 12, fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 0.5 }}>Estado</h3>
            <span style={{ ...BADGE, padding: '4px 12px', fontSize: 12, background: ESTADO_BADGE[venta.estado]?.bg || '#e9ecef', color: ESTADO_BADGE[venta.estado]?.color || '#495057' }}>
              {ESTADO_BADGE[venta.estado]?.label || venta.estado}
            </span>
          </div>
        </div>

        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Monto Total</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#212529' }}>{FMT(venta.monto_total)}</div>
          </div>

          <div style={{ padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, fontWeight: 600, color: '#495057' }}>
              <span>Recibido del Banco</span>
              <span>{FMT(venta.monto_recibido)}</span>
            </div>
            <div style={{ width: '100%', height: 12, background: '#e9ecef', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${Math.min(progreso, 100)}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', transition: 'width 0.3s', borderRadius: 6 }} />
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6c757d' }}>{progreso.toFixed(1)}%</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Saldo Pendiente</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: venta.saldo_pendiente > 0 ? '#e74c3c' : '#27ae60' }}>{FMT(venta.saldo_pendiente)}</div>
          </div>

          {venta.saldo_pendiente > 0 && (
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={abrirModal}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Registrar Abono
            </button>
          )}
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: 12, fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 0.5 }}>Historial de Depósitos</h3>
        {historial.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#adb5bd', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Sin abonos registrados aún</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#6c757d', borderBottom: '2px solid #dee2e6', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>Fecha</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#6c757d', borderBottom: '2px solid #dee2e6', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>Monto</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#6c757d', borderBottom: '2px solid #dee2e6', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>Observación</th>
              </tr>
            </thead>
            <tbody>
              {historial.map(abono => (
                <tr key={abono.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                  <td style={{ padding: '10px 14px', color: '#6c757d', fontSize: 12 }}>{FECHAFMT(abono.fecha)}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#27ae60' }}>{FMT(abono.monto)}</td>
                  <td style={{ padding: '10px 14px' }}>{abono.observacion || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <FormModal
        abierto={mostrarModal}
        titulo="Registrar Abono del Banco"
        subtitulo={`Saldo pendiente: ${FMT(venta.saldo_pendiente)}`}
        onCerrar={() => setMostrarModal(false)}
        onSubmit={handleSubmit}
        saving={guardando}
        saveLabel="Registrar Abono"
        error={error}
        maxWidth={480}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Monto Recibido del Banco *</label>
            <input type="number" min="0" step="0.01" placeholder="0.00"
              value={monto} onChange={e => { setMonto(e.target.value); setError(''); }}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border-color)', borderRadius: 7, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              disabled={guardando} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Fecha del Depósito *</label>
            <input type="date" value={fecha} onChange={e => { setFecha(e.target.value); setError(''); }}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border-color)', borderRadius: 7, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              disabled={guardando} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Observación (Opcional)</label>
            <textarea placeholder="Ej: Depósito parcial, referencia bancaria, etc." rows={3}
              value={observacion} onChange={e => setObservacion(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border-color)', borderRadius: 7, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }}
              disabled={guardando} />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
