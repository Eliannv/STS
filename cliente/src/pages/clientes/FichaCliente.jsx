import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import HistorialFormModal from '../../components/historial/HistorialFormModal';
import HistorialListModal from '../../components/historial/HistorialListModal';
import ClienteFormModal from '../../components/clientes/ClienteFormModal';
import StatCard from '../../components/common/StatCard';

/* --- helpers --- */
function fmtFecha(f) {
  if (!f) return '—';
  const d = new Date(f + (f.includes('T') ? '' : 'T00:00:00'));
  return isNaN(d) ? f : d.toLocaleDateString('es-EC');
}
function fmtMoney(v) {
  const n = parseFloat(v ?? 0);
  return isNaN(n) ? '$0.00' : '$' + n.toFixed(2);
}
const BADGE = (bg, color) => ({
  display: 'inline-block', padding: '2px 10px', borderRadius: 20,
  fontSize: 11, fontWeight: 600, background: bg, color,
});
const ESTADO_BADGE = {
  PAGADA:    { bg: '#d4edda', color: '#155724' },
  PENDIENTE: { bg: '#fff3cd', color: '#856404' },
  ANULADA:   { bg: '#f8d7da', color: '#721c24' },
};
const TIPO_BADGE = {
  CONTADO: { bg: '#e3f0ff', color: '#1a56db' },
  CREDITO: { bg: '#fce8ff', color: '#7c3aed' },
};

/* --- VentaFormModal (inline) --- */
function VentaFormModal({ abierto, editandoId, ventaInicial, clienteId, onCerrar, onGuardado }) {
  const EMPTY = {
    metodoPago: 'EFECTIVO', tipo: 'CONTADO', estado: 'PENDIENTE',
    subtotal: '', descuento: '0', total: '', saldoPendiente: '', observacion: '',
  };
  const [form, setForm] = useState(EMPTY);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  useEffect(() => {
    if (!abierto) return;
    if (ventaInicial) {
      setForm({
        metodoPago:     ventaInicial.metodo_pago    ?? 'EFECTIVO',
        tipo:           ventaInicial.tipo             ?? 'CONTADO',
        estado:         ventaInicial.estado           ?? 'PENDIENTE',
        subtotal:       ventaInicial.subtotal         ?? '',
        descuento:      ventaInicial.descuento        ?? '0',
        total:          ventaInicial.total            ?? '',
        saldoPendiente: ventaInicial.saldo_pendiente  ?? '',
        observacion:    ventaInicial.observacion      ?? '',
      });
    } else {
      setForm(EMPTY);
    }
    setErrorModal('');
  }, [abierto, ventaInicial]);

  async function guardar() {
    if (form.total === '' && form.total !== 0) {
      setErrorModal('El campo Total es requerido.');
      return;
    }
    setGuardando(true);
    setErrorModal('');
    const body = {
      clienteId:      clienteId,
      metodoPago:     form.metodoPago,
      tipo:           form.tipo,
      estado:         form.estado,
      subtotal:       parseFloat(form.subtotal)       || 0,
      descuento:      parseFloat(form.descuento)      || 0,
      total:          parseFloat(form.total)          || 0,
      saldoPendiente: parseFloat(form.saldoPendiente) || 0,
      observacion:    form.observacion || null,
    };
    const res = editandoId
      ? await api.put('/factura/editar', { ...body, id: editandoId })
      : await api.post('/factura/crear', body);
    setGuardando(false);
    if (res.ok) { onGuardado(); onCerrar(); }
    else setErrorModal(res.data?.resultado || 'Error al guardar la venta.');
  }

  if (!abierto) return null;
  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: 20 }}>{editandoId ? 'Editar venta' : 'Nueva venta'}</h2>
        {errorModal && <div className="alert alert-error" style={{ marginBottom: 12 }}>{errorModal}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: 'span 2' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Método de pago *</span>
            <select className="input" value={form.metodoPago} onChange={e => setForm(p => ({ ...p, metodoPago: e.target.value }))}>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="TARJETA">Tarjeta</option>
              <option value="CREDITO">A crédito</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Tipo</span>
            <select className="input" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
              <option value="CONTADO">Contado</option>
              <option value="CREDITO">Crédito</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Estado</span>
            <select className="input" value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))}>
              <option value="PENDIENTE">Pendiente</option>
              <option value="PAGADA">Pagada</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Subtotal</span>
            <input type="number" step="0.01" min="0" className="input" value={form.subtotal}
              onChange={e => {
                const s = parseFloat(e.target.value) || 0;
                const d = parseFloat(form.descuento) || 0;
                const t = Math.max(0, s - d).toFixed(2);
                setForm(p => ({ ...p, subtotal: e.target.value, total: t, saldoPendiente: t }));
              }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Descuento</span>
            <input type="number" step="0.01" min="0" className="input" value={form.descuento}
              onChange={e => {
                const d = parseFloat(e.target.value) || 0;
                const s = parseFloat(form.subtotal) || 0;
                const t = Math.max(0, s - d).toFixed(2);
                setForm(p => ({ ...p, descuento: e.target.value, total: t }));
              }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Total *</span>
            <input type="number" step="0.01" min="0" className="input" value={form.total}
              onChange={e => setForm(p => ({ ...p, total: e.target.value }))} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Saldo pendiente</span>
            <input type="number" step="0.01" min="0" className="input" value={form.saldoPendiente}
              onChange={e => setForm(p => ({ ...p, saldoPendiente: e.target.value }))} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: 'span 2' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Observación</span>
            <textarea className="input" rows="2" value={form.observacion}
              onChange={e => setForm(p => ({ ...p, observacion: e.target.value }))} />
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button className="btn" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando...' : editandoId ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================= */
/*                    COMPONENTE PRINCIPAL                         */
/* ============================================================= */
export default function FichaCliente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [cliente, setCliente] = useState(null);
  const [historiales, setHistoriales] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loadingCliente, setLoadingCliente] = useState(true);
  const [loadingHistoriales, setLoadingHistoriales] = useState(false);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('informacion');

  const [formHistorialAbierto, setFormHistorialAbierto] = useState(false);
  const [editandoHistorialId, setEditandoHistorialId] = useState(null);
  const [historialSeleccionado, setHistorialSeleccionado] = useState(null);

  const [modalEditarCliente, setModalEditarCliente] = useState(false);

  const [formVentaAbierto, setFormVentaAbierto] = useState(false);
  const [editandoVentaId, setEditandoVentaId] = useState(null);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

  const FILE_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text-icon lucide-file-text"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`;
  const CALENDAR_DAYS = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-days-icon lucide-calendar-days"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>`;
  const USER = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-icon lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';



  const cargarCliente = useCallback(async () => {
    setLoadingCliente(true);
    const res = await api.get('/cliente/buscar/' + id);
    if (res.ok) setCliente(res.data.resultado);
    else setError('No se pudo cargar el cliente.');
    setLoadingCliente(false);
  }, [id]);

  useEffect(() => { cargarCliente(); }, [cargarCliente]);

  const cargarHistoriales = useCallback(async () => {
    setLoadingHistoriales(true);
    const res = await api.get('/historial-clinico/cliente/' + id);
    if (res.ok) setHistoriales(res.data.resultado || []);
    setLoadingHistoriales(false);
  }, [id]);

  useEffect(() => {
    if (tab === 'historial') cargarHistoriales();
  }, [tab, cargarHistoriales]);

  const cargarVentas = useCallback(async () => {
    setLoadingVentas(true);
    const [resV, resR] = await Promise.all([
      api.get('/factura/cliente/' + id),
      api.get('/factura/resumen/' + id),
    ]);
    if (resV.ok) setVentas(Array.isArray(resV.data.resultado) ? resV.data.resultado : []);
    if (resR.ok && resR.data.resultado && typeof resR.data.resultado === 'object') setResumen(resR.data.resultado);
    setLoadingVentas(false);
  }, [id]);

  useEffect(() => {
    if (tab === 'facturas') cargarVentas();
  }, [tab, cargarVentas]);

  async function eliminarVenta(vid) {
    if (!confirm('¿Eliminar esta venta?')) return;
    const res = await api.delete('/factura/eliminar', { id: vid });
    if (res.ok) cargarVentas();
  }

  async function cobrarVenta(vid) {
    if (!confirm('¿Marcar esta venta como PAGADA?')) return;
    const res = await api.put('/factura/cobrar/' + vid);
    if (res.ok) cargarVentas();
  }

  const statsHistorial = (() => {
    if (!historiales.length) return null;
    const fechas = historiales.map(h => h.fecha_chequeo || h.created_at).filter(Boolean)
      .map(f => new Date(f)).filter(d => !isNaN(d));
    const doctores = historiales.map(h => h.doctor).filter(Boolean);
    const frecDoctor = doctores.length
      ? Object.entries(doctores.reduce((acc, d) => { acc[d] = (acc[d] || 0) + 1; return acc; }, {}))
          .sort((a, b) => b[1] - a[1])[0][0]
      : '—';
    return {
      total: historiales.length,
      primero: fechas.length ? fmtFecha(fechas.reduce((a, b) => a < b ? a : b).toISOString()) : '—',
      ultimo:  fechas.length ? fmtFecha(fechas.reduce((a, b) => a > b ? a : b).toISOString()) : '—',
      doctor:  frecDoctor,
    };
  })();

  if (loadingCliente) return (
    <div className="page"><div className="spinner-wrapper"><div className="spinner" /></div></div>
  );
  if (error || !cliente) return (
    <div className="page">
      <div className="alert alert-error">{error || 'Cliente no encontrado.'}</div>
      <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => navigate('/clientes')}>← Volver</button>
    </div>
  );

  const tieneHistorial = cliente.tiene_historial_clinico;

  return (
    <div className="page">

      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #1a3a5c, #2980b9)',
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        padding: '20px 28px', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{cliente.nombres} {cliente.apellidos}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 6, fontSize: 13, opacity: 0.88 }}>
              {cliente.cedula && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <path d="M16 10h2"/><path d="M16 14h2"/><circle cx="9" cy="11" r="2"/>
                  <path d="M6.17 15a3 3 0 0 1 5.66 0"/>
                </svg>{cliente.cedula}
              </span>}
              {cliente.telefono && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 6.18 2 2 0 0 1 7 4h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L11.09 11a16 16 0 0 0 5.91 5.91l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>{cliente.telefono}
              </span>}
              {cliente.email && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>{cliente.email}
              </span>}
              <span style={BADGE(tieneHistorial ? 'rgba(46,204,113,0.25)' : 'rgba(255,255,255,0.12)', tieneHistorial ? '#a9f0c9' : 'rgba(255,255,255,0.7)')}>
                {tieneHistorial ? '✓ Con historial' : 'Sin historial'}
              </span>
              {cliente.tiene_deuda && <span style={BADGE('rgba(255,150,0,0.3)', '#ffd080')}>⚠ Con deuda</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setModalEditarCliente(true)} style={{
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>Editar
          </button>
          <button onClick={() => navigate('/clientes')} style={{
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
            </svg>Volver
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{
        background: '#fff', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)',
        display: 'flex', gap: 0,
      }}>
        {[
          { key: 'informacion', label: 'Información',
            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
            badge: null },
          { key: 'historial', label: 'Historial Clínico',
            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M10 13h4"/><path d="M10 17h4"/></svg>,
            badge: tieneHistorial ? { text: '✓', color: '#27ae60' } : null },
          { key: 'facturas', label: 'Facturación',
            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>,
            badge: cliente.tiene_deuda ? { text: '!', color: '#e67e22' } : null },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px',
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            color: tab === t.key ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderBottom: tab === t.key ? '2px solid var(--primary-color)' : '2px solid transparent',
            transition: 'all 0.15s',
          }}>
            {t.icon}{t.label}
            {t.badge && <span style={{
              background: t.badge.color, color: '#fff', borderRadius: 10,
              padding: '1px 6px', fontSize: 10, fontWeight: 700, minWidth: 16, textAlign: 'center',
            }}>{t.badge.text}</span>}
          </button>
        ))}
      </div>

      {/* CONTENIDO */}
      <div style={{
        background: '#fff', border: '1px solid var(--border-color)',
        borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', padding: 28,
      }}>

        {/* TAB INFORMACION */}
        {tab === 'informacion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <section>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Información Personal
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px 24px' }}>
                <InfoItem label="Nombres">{cliente.nombres || '—'}</InfoItem>
                <InfoItem label="Apellidos">{cliente.apellidos || '—'}</InfoItem>
                <InfoItem label="Cédula">{cliente.cedula || '—'}</InfoItem>
                <InfoItem label="Teléfono">{cliente.telefono || '—'}</InfoItem>
                <InfoItem label="Email">{cliente.email || '—'}</InfoItem>
                <InfoItem label="Fecha de Nacimiento">{fmtFecha(cliente.fecha_nacimiento)}</InfoItem>
              </div>
            </section>
            <div style={{ borderTop: '1px solid var(--border-color)' }} />
            <section>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                Ubicación
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px 24px' }}>
                <InfoItem label="País">{cliente.pais || '—'}</InfoItem>
                <InfoItem label="Provincia">{cliente.provincia || '—'}</InfoItem>
                <InfoItem label="Ciudad">{cliente.ciudad || '—'}</InfoItem>
                <InfoItem label="Dirección">{cliente.direccion || '—'}</InfoItem>
              </div>
            </section>
            <div style={{ borderTop: '1px solid var(--border-color)' }} />
            <section>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Estado
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px 24px' }}>
                <InfoItem label="Historial Clínico">
                  <span style={BADGE(tieneHistorial ? '#d4edda' : '#fff3cd', tieneHistorial ? '#155724' : '#856404')}>
                    {tieneHistorial ? 'Registrado' : 'Sin historial'}
                  </span>
                </InfoItem>
                <InfoItem label="Crédito Personal">
                  <span style={BADGE(cliente.tiene_credito ? '#d4edda' : '#f8f9fa', cliente.tiene_credito ? '#155724' : '#6c757d')}>
                    {cliente.tiene_credito ? 'Con crédito' : 'Sin crédito'}
                  </span>
                </InfoItem>
                <InfoItem label="Deuda">
                  <span style={BADGE(cliente.tiene_deuda ? '#fff3cd' : '#f8f9fa', cliente.tiene_deuda ? '#856404' : '#6c757d')}>
                    {cliente.tiene_deuda ? '⚠ Con deuda' : 'Sin deuda'}
                  </span>
                </InfoItem>
                <InfoItem label="Estado">
                  <span style={BADGE(cliente.activo ? '#d4edda' : '#f8d7da', cliente.activo ? '#155724' : '#721c24')}>
                    {cliente.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </InfoItem>
                <InfoItem label="Registrado el">{fmtFecha(cliente.created_at)}</InfoItem>
              </div>
            </section>
          </div>
        )}

        {/* TAB HISTORIAL */}
        {tab === 'historial' && (
          <div>
            {/* Stats Historial */}
            {!loadingHistoriales && statsHistorial && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 24 }}>
                <StatCard
                  icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>}
                  label="Total registros" value={statsHistorial.total} color="#3498db" />
                <StatCard
                  icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h2"/></svg>}
                  label="Primer chequeo" value={statsHistorial.primero} color="#27ae60" />
                <StatCard
                  icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M16 14h2"/></svg>}
                  label="Último chequeo" value={statsHistorial.ultimo} color="#f39c12" />
                <StatCard
                  icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                  label="Doctor frecuente" value={statsHistorial.doctor} color="#8e44ad" />
              </div>
            )}
            <HistorialListModal
              abierto={true}
              cliente={cliente}
              onCerrar={() => {}}
              modal={false} 
              modoCompacto={false}
            />
          </div>
        )
      }

      {/* TAB FACTURAS */}
        {tab === 'facturas' && (
          <div>
            {!loadingVentas && resumen && Number(resumen.deuda_total) > 0 && (
              <div style={{
                background: '#fff8e1', border: '1px solid #ffc107', borderRadius: 8,
                padding: '14px 18px', marginBottom: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e67e22" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <span style={{ fontWeight: 600, color: '#7b4700' }}>
                    Deuda pendiente: <strong>{fmtMoney(resumen.deuda_total)}</strong>
                    {' '}en {resumen.cantidad_facturas} {Number(resumen.cantidad_facturas) === 1 ? 'factura' : 'facturas'}
                  </span>
                </div>
              </div>
            )}
            {!loadingVentas && resumen && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'Total Facturado',  val: fmtMoney(resumen.total_facturado),  color: '#1a56db', bg: '#ebf5ff' },
                  { label: 'Total Pagado',      val: fmtMoney(resumen.total_pagado),     color: '#057a55', bg: '#f0fdf4' },
                  { label: 'Deuda Pendiente',   val: fmtMoney(resumen.deuda_total),      color: Number(resumen.deuda_total) > 0 ? '#92400e' : '#6b7280', bg: Number(resumen.deuda_total) > 0 ? '#fffbeb' : '#f9fafb' },
                  { label: 'Facturas',          val: resumen.cantidad_facturas || 0,     color: '#5521b5', bg: '#f5f3ff' },
                  { label: 'Promedio',          val: fmtMoney(resumen.promedio_compra),  color: '#1e429f', bg: '#ebf5ff' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, border: '1px solid ' + s.color + '22', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Ventas / Facturas</h3>
              <button className="btn btn-primary"
                onClick={() => navigate(`/facturas/nueva?clienteId=${id}`)}>
                + Nueva venta
              </button>
            </div>
            {loadingVentas
              ? <div className="spinner-wrapper" style={{ padding: 40 }}><div className="spinner" /></div>
              : ventas.length === 0
                ? (
                  <div className="empty-state" style={{ padding: '48px 0' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
                    </svg>
                    <p>No hay ventas registradas</p>
                    <button className="btn btn-primary" style={{ marginTop: 12 }}
                      onClick={() => navigate(`/facturas/nueva?clienteId=${id}`)}>
                      Registrar primera venta
                    </button>
                  </div>
                )
                : (
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border-color)' }}>
                          {['ID','Nro. Factura','Tipo','Estado','Total','Saldo','Fecha','Acciones'].map(h => (
                            <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Acciones' ? 'center' : 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ventas.map((v, i) => (
                          <tr key={v.id} style={{ borderBottom: '1px solid var(--border-light)', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
                              {v.id_personalizado || '#' + v.id}
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 600 }}>{v.numero_factura || '—'}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={BADGE((TIPO_BADGE[v.tipo] || {}).bg || '#f8f9fa', (TIPO_BADGE[v.tipo] || {}).color || '#333')}>
                                {v.tipo}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={BADGE((ESTADO_BADGE[v.estado] || {}).bg || '#f8f9fa', (ESTADO_BADGE[v.estado] || {}).color || '#333')}>
                                {v.estado}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 600 }}>{fmtMoney(v.total)}</td>
                            <td style={{ padding: '10px 14px', color: Number(v.saldo_pendiente) > 0 ? '#92400e' : 'var(--text-muted)', fontWeight: Number(v.saldo_pendiente) > 0 ? 700 : 400 }}>
                              {fmtMoney(v.saldo_pendiente)}
                            </td>
                            <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{fmtFecha(v.created_at)}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                {Number(v.saldo_pendiente) > 0 && (
                                  <button className="btn-icon" title="Marcar como pagada" style={{ color: '#27ae60' }}
                                    onClick={() => cobrarVenta(v.id)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                  </button>
                                )}
                                <button className="btn-icon" title="Ver factura" style={{ color: '#1a56db' }}
                                  onClick={() => navigate(`/facturas/${v.id}`)}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                  </svg>
                                </button>
                                <button className="btn-icon" title="Editar"
                                  onClick={() => { setVentaSeleccionada(v); setEditandoVentaId(v.id); setFormVentaAbierto(true); }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                </button>
                                {isAdmin && (
                                  <button className="btn-icon danger" title="Eliminar" onClick={() => eliminarVenta(v.id)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
            }
          </div>
        )}
      </div>

      {/* MODALES */}
      <ClienteFormModal
        abierto={modalEditarCliente}
        editando={cliente.id}
        clienteInicial={cliente}
        onCerrar={() => setModalEditarCliente(false)}
        onGuardado={() => { setModalEditarCliente(false); cargarCliente(); }}
      />
      <HistorialFormModal
        abierto={formHistorialAbierto}
        editando={editandoHistorialId}
        historialInicial={historialSeleccionado}
        cliente={cliente}
        onCerrar={() => { setFormHistorialAbierto(false); setHistorialSeleccionado(null); setEditandoHistorialId(null); }}
        onGuardado={() => { setFormHistorialAbierto(false); setHistorialSeleccionado(null); setEditandoHistorialId(null); cargarHistoriales(); cargarCliente(); }}
      />
      <VentaFormModal
        abierto={formVentaAbierto}
        editandoId={editandoVentaId}
        ventaInicial={ventaSeleccionada}
        clienteId={id}
        onCerrar={() => { setFormVentaAbierto(false); setVentaSeleccionada(null); setEditandoVentaId(null); }}
        onGuardado={() => { cargarVentas(); cargarCliente(); }}
      />
    </div>
  );
}

function InfoItem({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{children}</span>
    </div>
  );
}
