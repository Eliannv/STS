import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const VACIO_HISTORIAL = {
  clienteId: '',
  // Ojo Derecho
  odEsfera: '', odCilindro: '', odEje: '', odAvsc: '', odAvcc: '',
  // Ojo Izquierdo
  oiEsfera: '', oiCilindro: '', oiEje: '', oiAvsc: '', oiAvcc: '',
  // Generales
  dp: '', add: '', de: '', altura: '', color: '',
  observacion: '',
  // Armazón
  armazonH: '', armazonV: '', armazonDbl: '', armazonDm: '', armazonTipo: '',
  // Control del chequeo
  doctor: '', fechaChequeo: '', horaChequeo: '',
};

export default function HistorialClinico() {
  const { isAdmin } = useAuth();

  // ── Lista de clientes ──────────────────────────────────────────────
  const [clientes, setClientes] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [loadingClientes, setLoadingClientes] = useState(false);

  // ── Modal historiales del cliente ──────────────────────────────────
  const [clienteActivo, setClienteActivo] = useState(null);
  const [historiales, setHistoriales] = useState([]);
  const [loadingHistoriales, setLoadingHistoriales] = useState(false);
  const [modalHistoriales, setModalHistoriales] = useState(false);

  // ── Modal crear/editar historial ───────────────────────────────────
  const [modalForm, setModalForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO_HISTORIAL);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Cargar clientes ────────────────────────────────────────────────
  const cargarClientes = useCallback(async (termino = '') => {
    setLoadingClientes(true);
    const url = termino.trim()
      ? `/cliente/lista?buscar=${encodeURIComponent(termino)}`
      : '/cliente/lista';
    const res = await api.get(url);
    if (res.ok) setClientes(res.data.resultado || []);
    setLoadingClientes(false);
  }, []);

  useEffect(() => { cargarClientes(); }, [cargarClientes]);

  useEffect(() => {
    const t = setTimeout(() => cargarClientes(buscar), 350);
    return () => clearTimeout(t);
  }, [buscar, cargarClientes]);

  // ── Ver historiales de un cliente ──────────────────────────────────
  async function verHistoriales(cliente) {
    setClienteActivo(cliente);
    setHistoriales([]);
    setModalHistoriales(true);
    setLoadingHistoriales(true);
    const res = await api.get(`/historial-clinico/cliente/${cliente.id}`);
    if (res.ok) setHistoriales(res.data.resultado || []);
    setLoadingHistoriales(false);
  }

  function cerrarHistoriales() { setModalHistoriales(false); setClienteActivo(null); }

  // ── Abrir formulario ───────────────────────────────────────────────
  function abrirNuevo() {
    setForm({ ...VACIO_HISTORIAL, clienteId: clienteActivo?.id || '' });
    setEditando(null); setError(''); setModalForm(true);
  }

  function abrirEditar(h) {
    setForm({
      clienteId:  h.cliente_id,
      odEsfera:   h.od_esfera   ?? '', odCilindro: h.od_cilindro ?? '',
      odEje:      h.od_eje      ?? '', odAvsc:     h.od_avsc     ?? '', odAvcc: h.od_avcc ?? '',
      oiEsfera:   h.oi_esfera   ?? '', oiCilindro: h.oi_cilindro ?? '',
      oiEje:      h.oi_eje      ?? '', oiAvsc:     h.oi_avsc     ?? '', oiAvcc: h.oi_avcc ?? '',
      dp:         h.dp          ?? '', add:        h.add         ?? '',
      de:         h.de          ?? '', altura:     h.altura      ?? '',
      color:      h.color       ?? '', observacion: h.observacion ?? '',
      armazonH:   h.armazon_h    ?? '', armazonV:    h.armazon_v   ?? '', armazonDbl:   h.armazon_dbl ?? '',
      armazonDm:  h.armazon_dm   ?? '', armazonTipo: h.armazon_tipo ?? '',
      doctor:      h.doctor       ?? '', fechaChequeo: h.fecha_chequeo ?? '', horaChequeo: h.hora_chequeo ?? '',
    });
    setEditando(h.id); setError(''); setModalForm(true);
  }

  function cerrarForm() { setModalForm(false); }
  function handleChange(e) { setForm(p => ({ ...p, [e.target.name]: e.target.value })); }

  async function recargarHistoriales() {
    const r = await api.get(`/historial-clinico/cliente/${clienteActivo.id}`);
    if (r.ok) setHistoriales(r.data.resultado || []);
  }

  async function guardar(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = editando
        ? await api.put('/historial-clinico/editar', { id: editando, ...form })
        : await api.post('/historial-clinico/crear', form);
      if (res.ok) { cerrarForm(); await recargarHistoriales(); }
      else setError(res.data?.mensaje || 'Error al guardar');
    } catch { setError('Error de conexión'); }
    finally { setSaving(false); }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este historial clínico?')) return;
    const res = await api.delete('/historial-clinico/eliminar', { id });
    if (res.ok) await recargarHistoriales();
  }

  function fmtGrad(v) {
    if (v === '' || v === null || v === undefined) return '—';
    const n = parseFloat(v);
    return isNaN(n) ? String(v) : (n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2));
  }
  function fmtFecha(f) { return f ? new Date(f).toLocaleDateString('es-EC') : '—'; }

  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="page">
      {/* ══════════════════════════════════════════════════════════════
          Modal — Historiales del cliente
      ══════════════════════════════════════════════════════════════ */}
      {modalHistoriales && (
        <div className="modal-overlay" onClick={cerrarHistoriales}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 920, width: '96vw' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Historiales clínicos</h2>
                {clienteActivo && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
                    {clienteActivo.nombres} {clienteActivo.apellidos}
                    {clienteActivo.cedula ? ` — ${clienteActivo.cedula}` : ''}
                  </p>
                )}
              </div>
              <button className="btn-icon" onClick={cerrarHistoriales}>✕</button>
            </div>

            {/* Body */}
            {loadingHistoriales
              ? <div className="spinner-wrapper" style={{ padding: 40 }}><div className="spinner" /></div>
              : (
                <div className="table-container" style={{ maxHeight: 400 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th style={{ textAlign: 'center' }}>OD Esf.</th>
                        <th style={{ textAlign: 'center' }}>OD Cil.</th>
                        <th style={{ textAlign: 'center' }}>OD Eje</th>
                        <th style={{ textAlign: 'center' }}>AVSC</th>
                        <th style={{ textAlign: 'center' }}>AVCC</th>
                        <th style={{ textAlign: 'center' }}>OI Esf.</th>
                        <th style={{ textAlign: 'center' }}>OI Cil.</th>
                        <th style={{ textAlign: 'center' }}>OI Eje</th>
                        <th style={{ textAlign: 'center' }}>DP</th>
                        <th style={{ textAlign: 'center' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historiales.length === 0
                        ? <tr><td colSpan={11} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No hay historiales clínicos para este paciente</td></tr>
                        : historiales.map(h => (
                          <tr key={h.id}>
                            <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtFecha(h.created_at)}</td>
                            <td style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 13 }}>{fmtGrad(h.od_esfera)}</td>
                            <td style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 13 }}>{fmtGrad(h.od_cilindro)}</td>
                            <td style={{ textAlign: 'center', fontSize: 13 }}>{h.od_eje ? `${h.od_eje}°` : '—'}</td>
                            <td style={{ textAlign: 'center', fontSize: 13 }}>{h.od_avsc || '—'}</td>
                            <td style={{ textAlign: 'center', fontSize: 13 }}>{h.od_avcc || '—'}</td>
                            <td style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 13 }}>{fmtGrad(h.oi_esfera)}</td>
                            <td style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 13 }}>{fmtGrad(h.oi_cilindro)}</td>
                            <td style={{ textAlign: 'center', fontSize: 13 }}>{h.oi_eje ? `${h.oi_eje}°` : '—'}</td>
                            <td style={{ textAlign: 'center', fontSize: 13 }}>{h.dp || '—'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                <button className="btn-icon" title="Editar" onClick={() => abrirEditar(h)}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                {isAdmin && (
                                  <button className="btn-icon danger" title="Eliminar" onClick={() => eliminar(h.id)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              )
            }

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn-ghost" onClick={cerrarHistoriales}>Cerrar</button>
              <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo historial</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          Modal — Crear / Editar historial clínico
      ══════════════════════════════════════════════════════════════ */}
      {modalForm && (
        <div className="modal-overlay" onClick={cerrarForm}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 1050, width: '97vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Historia Clínica</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
                  {editando ? 'Modifica los datos del historial clínico' : 'Registra el historial clínico del paciente'}
                  {clienteActivo ? ` — ${clienteActivo.nombres} ${clienteActivo.apellidos}` : ''}
                </p>
              </div>
              <button className="btn-icon" onClick={cerrarForm}>✕</button>
            </div>

            <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{ display: 'flex', gap: 0, flex: 1, minHeight: 0 }}>

                {/* ── Panel izquierdo (scrollable) ── */}
                <div style={{ flex: 1, padding: '24px', borderRight: '1px solid var(--border-color)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {error && <div className="alert alert-error">{error}</div>}

                  {/* ── Sección: Datos Clínicos ── */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><circle cx="6" cy="15" r="4"/><circle cx="18" cy="15" r="4"/><path d="M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/><path d="M2.5 13 5 7c.7-1.3 1.4-2 3-2"/><path d="M21.5 13 19 7c-.7-1.3-1.5-2-3-2"/></svg>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>Datos Clínicos</span>
                    </div>

                    {/* OD / OI en grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      {/* OD */}
                      <div style={{ border: '2px solid #dbeafe', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary-color)', marginBottom: 14, fontSize: 13 }}>Ojo Derecho (OD)</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px' }}>
                          {[
                            { label: 'Esfera', name: 'odEsfera', ph: '+0.00' },
                            { label: 'Cilindro', name: 'odCilindro', ph: '-0.00' },
                            { label: 'Eje (°)', name: 'odEje', ph: '90' },
                            { label: '', name: '' },
                            { label: 'AVSC', name: 'odAvsc', ph: '20/20' },
                            { label: 'AVCC', name: 'odAvcc', ph: '20/40' },
                          ].map(f => f.name ? (
                            <div key={f.name} className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: 11, marginBottom: 3 }}>{f.label}</label>
                              <input className="form-control" style={{ fontSize: 13 }} type="text" name={f.name} value={form[f.name]} onChange={handleChange} placeholder={f.ph} />
                            </div>
                          ) : <div key="empty-od" />)}
                        </div>
                      </div>

                      {/* OI */}
                      <div style={{ border: '2px solid #dcfce7', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#27ae60', marginBottom: 14, fontSize: 13 }}>Ojo Izquierdo (OI)</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px' }}>
                          {[
                            { label: 'Esfera', name: 'oiEsfera', ph: '+0.00' },
                            { label: 'Cilindro', name: 'oiCilindro', ph: '-0.00' },
                            { label: 'Eje (°)', name: 'oiEje', ph: '90' },
                            { label: '', name: '' },
                            { label: 'AVSC', name: 'oiAvsc', ph: '20/20' },
                            { label: 'AVCC', name: 'oiAvcc', ph: '20/40' },
                          ].map(f => f.name ? (
                            <div key={f.name} className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: 11, marginBottom: 3 }}>{f.label}</label>
                              <input className="form-control" style={{ fontSize: 13 }} type="text" name={f.name} value={form[f.name]} onChange={handleChange} placeholder={f.ph} />
                            </div>
                          ) : <div key="empty-oi" />)}
                        </div>
                      </div>
                    </div>

                    {/* ADD / DP / Altura */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 14 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">ADD</label>
                        <input className="form-control" type="text" name="add" value={form.add} onChange={handleChange} placeholder="2.00" />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">DP (mm)</label>
                        <input className="form-control" type="text" name="dp" value={form.dp} onChange={handleChange} placeholder="62" />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Altura (mm)</label>
                        <input className="form-control" type="text" name="altura" value={form.altura} onChange={handleChange} placeholder="18.5" />
                      </div>
                    </div>
                  </div>

                  {/* ── Sección: Medidas del Armazón ── */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M2 12h3"/><path d="M19 12h3"/></svg>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>Medidas del Armazón</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">H — Ancho del Aro</label>
                        <input className="form-control" type="text" name="armazonH" value={form.armazonH} onChange={handleChange} placeholder="52" />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">V — Alto del Aro</label>
                        <input className="form-control" type="text" name="armazonV" value={form.armazonV} onChange={handleChange} placeholder="40" />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">DBL — Puente</label>
                        <input className="form-control" type="text" name="armazonDbl" value={form.armazonDbl} onChange={handleChange} placeholder="18" />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">DM — Diagonal Mayor</label>
                        <input className="form-control" type="text" name="armazonDm" value={form.armazonDm} onChange={handleChange} placeholder="60" />
                      </div>
                      <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                        <label className="form-label">Tipo de Armazón</label>
                        <input className="form-control" type="text" name="armazonTipo" value={form.armazonTipo} onChange={handleChange} placeholder="" />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">De</label>
                        <input className="form-control" type="text" name="de" value={form.de} onChange={handleChange} placeholder="Cerca / Lejos / DP" />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Color</label>
                        <input className="form-control" type="text" name="color" value={form.color} onChange={handleChange} placeholder="Negro / Transparente" />
                      </div>
                    </div>
                  </div>

                  {/* ── Control del Chequeo ── */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>Control del Chequeo</span>
                    </div>
                    <div className="form-group" style={{ margin: 0, marginBottom: 12 }}>
                      <label className="form-label">Observación</label>
                      <textarea className="form-control" name="observacion" value={form.observacion} onChange={handleChange} rows={3} placeholder="Notas adicionales sobre la consulta..." style={{ resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Doctor que atendió</label>
                        <input className="form-control" type="text" name="doctor" value={form.doctor} onChange={handleChange} placeholder="Dr. Juan Pérez" />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Fecha del chequeo</label>
                        <input className="form-control" type="date" name="fechaChequeo" value={form.fechaChequeo} onChange={handleChange} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Hora del chequeo</label>
                        <input className="form-control" type="time" name="horaChequeo" value={form.horaChequeo} onChange={handleChange} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Panel derecho (sidebar fijo) ── */}
                <div style={{ width: 210, flexShrink: 0, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--bg-secondary)', overflowY: 'auto' }}>
                  {/* Info card */}
                  <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>Información</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Tipo:</span>
                        <span style={{ fontWeight: 600 }}>Historia Clínica</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Paciente:</span>
                        <div style={{ fontWeight: 600, fontSize: 12, marginTop: 2 }}>
                          {clienteActivo ? `${clienteActivo.nombres?.split(' ')[0] || ''} ${clienteActivo.apellidos?.split(' ')[0] || ''}` : '—'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Estado:</span>
                        <span style={{ fontWeight: 600, color: 'var(--success-color)' }}>Activo</span>
                      </div>
                    </div>
                  </div>

                  {/* Referencia óptica */}
                  <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2"><circle cx="6" cy="15" r="4"/><circle cx="18" cy="15" r="4"/><path d="M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/><path d="M2.5 13 5 7c.7-1.3 1.4-2 3-2"/><path d="M21.5 13 19 7c-.7-1.3-1.5-2-3-2"/></svg>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>Referencia</span>
                    </div>
                    {[
                      ['Esf.', 'Potencia esférica'],
                      ['Cil.', 'Potencia cilíndrica'],
                      ['Eje', 'Orientación 0–180°'],
                      ['AVSC', 'Sin corrección'],
                      ['AVCC', 'Con corrección'],
                      ['ADD', 'Adición para cerca'],
                      ['DP', 'Distancia pupilar'],
                      ['H/V', 'Dimensiones aro'],
                      ['DBL', 'Distancia puente'],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', gap: 6, marginBottom: 7, fontSize: 12 }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary-color)', minWidth: 34 }}>{k}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
                <button type="button" className="btn btn-ghost" onClick={cerrarForm}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 160 }}>
                  {saving ? 'Guardando...' : (editando ? 'Guardar Cambios' : 'Guardar Todo')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
