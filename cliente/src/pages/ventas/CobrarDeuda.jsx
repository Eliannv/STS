import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const FMT  = v => `$${parseFloat(v || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;
const FECHA = s => {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const S = {
  pos: { display: 'flex', flexDirection: 'column', height: '100%', background: '#f4f6fa' },
  header: {
    background: '#fff', borderBottom: '1px solid #dee2e6',
    padding: '12px 20px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
  },
  body: { display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden', minHeight: 0 },
  panel: { display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff', borderRight: '1px solid #dee2e6' },
  panelHeader: { padding: '12px 16px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 14 },
  panelBody: { flex: 1, overflowY: 'auto', padding: 16 },
  input: { padding: '9px 12px', border: '1px solid #ced4da', borderRadius: 8, fontSize: 14, width: '100%', background: '#fff', outline: 'none', fontFamily: 'inherit' },
  label: { fontSize: 11, fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' },
  fgroup: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 },
  badge: (bg, color) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color }),
  kv: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', fontSize: 13 },
  totalesBox: { background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 10, padding: 16, marginBottom: 14 },
  facturaItem: (sel) => ({
    width: '100%', textAlign: 'left', padding: '12px 14px', cursor: 'pointer',
    background: sel ? '#eef4ff' : 'none', border: 'none',
    borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderLeft: sel ? '3px solid #3498db' : '3px solid transparent',
  }),
};

export default function CobrarDeuda() {
  const navigate       = useNavigate();
  const { user }       = useAuth();
  const [searchParams] = useSearchParams();
  const clienteIdInit  = searchParams.get('clienteId');

  /* búsqueda cliente */
  const [buscarCliente, setBuscarCliente] = useState('');
  const [clientesFound, setClientesFound] = useState([]);
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [cargandoCli,   setCargandoCli]   = useState(false);
  const [clienteSel,    setClienteSel]    = useState(null);
  const dropRef = useRef(null);

  /* facturas pendientes */
  const [pendientes,       setPendientes]       = useState([]);
  const [cargandoPend,     setCargandoPend]     = useState(false);
  const [filtroFactura,    setFiltroFactura]    = useState('');
  const [facturaSelIdx,    setFacturaSelIdx]    = useState(null);

  /* abono */
  const [abono,   setAbono]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  /* cerrar dropdown al clic fuera */
  useEffect(() => {
    function h(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* precarga cliente por query param */
  useEffect(() => {
    if (!clienteIdInit) return;
    api.get(`/cliente/buscar/${clienteIdInit}`).then(r => {
      if (r.ok && r.data.resultado) {
        const c = r.data.resultado;
        setBuscarCliente(c.nombres + ' ' + c.apellidos);
        seleccionarCliente(c);
      }
    });
  }, [clienteIdInit]); // eslint-disable-line

  /* buscar clientes */
  const buscarClientes = useCallback(async (term) => {
    if (term.length < 2) { setClientesFound([]); setDropdownOpen(false); return; }
    setCargandoCli(true);
    const res = await api.get(`/cliente/lista?buscar=${encodeURIComponent(term)}`);
    if (res.ok) {
      // Solo clientes con deuda
      const conDeuda = (res.data.resultado || []).filter(c => c.tiene_deuda);
      setClientesFound(conDeuda.slice(0, 8));
      setDropdownOpen(true);
    }
    setCargandoCli(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => buscarClientes(buscarCliente), 280);
    return () => clearTimeout(t);
  }, [buscarCliente, buscarClientes]);

  async function seleccionarCliente(c) {
    setClienteSel(c);
    setBuscarCliente(c.nombres + ' ' + c.apellidos);
    setDropdownOpen(false);
    setFacturaSelIdx(null); setAbono(''); setError(''); setSuccess('');
    // cargar facturas pendientes
    setCargandoPend(true);
    const r = await api.get(`/factura/cliente/${c.id}`);
    if (r.ok) {
      const pend = (r.data.resultado || []).filter(v => v.estado === 'PENDIENTE' && parseFloat(v.saldo_pendiente) > 0);
      setPendientes(pend);
    }
    setCargandoPend(false);
  }

  function limpiarCliente() {
    setClienteSel(null); setBuscarCliente(''); setClientesFound([]);
    setPendientes([]); setFacturaSelIdx(null); setAbono('');
    setError(''); setSuccess('');
  }

  const facturasFiltradas = filtroFactura.trim()
    ? pendientes.filter(f =>
        (f.numero_factura || '').toLowerCase().includes(filtroFactura.toLowerCase()) ||
        (f.id_personalizado || '').toLowerCase().includes(filtroFactura.toLowerCase())
      )
    : pendientes;

  const facturasSel = facturaSelIdx !== null ? facturasFiltradas[facturaSelIdx] : null;
  const saldoActual  = parseFloat(facturasSel?.saldo_pendiente || 0);
  const abonoNum     = parseFloat(abono) || 0;
  const saldoNuevo   = Math.max(0, saldoActual - abonoNum);
  const vuelto       = abonoNum > saldoActual ? abonoNum - saldoActual : 0;
  const deudaTotal   = pendientes.reduce((s, v) => s + parseFloat(v.saldo_pendiente || 0), 0);

  async function handleCobrar(e) {
    e.preventDefault();
    if (!facturasSel) { setError('Selecciona una factura'); return; }
    if (abonoNum <= 0) { setError('El monto del abono debe ser mayor a $0'); return; }
    if (abonoNum > saldoActual + 0.001) { setError(`El abono no puede superar el saldo de ${FMT(saldoActual)}`); return; }
    setSaving(true); setError(''); setSuccess('');

    let res;
    if (saldoNuevo <= 0.001) {
      // pago total: usar endpoint cobrar
      res = await api.put(`/factura/cobrar/${facturasSel.id}`);
    } else {
      // pago parcial: usar editar con nuevo saldo
      res = await api.put('/factura/editar', {
        id:             facturasSel.id,
        clienteId:      facturasSel.cliente_id,
        numeroFactura:  facturasSel.numero_factura,
        tipo:           facturasSel.tipo,
        estado:         'PENDIENTE',
        subtotal:       facturasSel.subtotal,
        descuento:      facturasSel.descuento,
        total:          facturasSel.total,
        saldoPendiente: parseFloat(saldoNuevo.toFixed(2)),
        observacion:    facturasSel.observacion,
      });
    }

    setSaving(false);
    if (res.ok) {
      const msg = saldoNuevo <= 0.001
        ? `Deuda saldada — ${facturasSel.id_personalizado || '#' + facturasSel.id}`
        : `Abono registrado — Saldo restante: ${FMT(saldoNuevo)}`;
      setSuccess(msg);
      setAbono('');
      setFacturaSelIdx(null);
      // recargar pendientes
      await seleccionarCliente(clienteSel);
    } else {
      setError(res.data?.resultado || 'Error al registrar el abono');
    }
  }

  /* navegación con teclado en lista de facturas */
  function onKeyDown(e) {
    if (!facturasFiltradas.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFacturaSelIdx(i => i === null ? 0 : Math.min(i + 1, facturasFiltradas.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFacturaSelIdx(i => i === null ? 0 : Math.max(i - 1, 0));
    }
  }

  return (
    <div style={S.pos}>

      {/* ── HEADER ── */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/facturas')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Volver
          </button>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Cobro de Deudas</h2>
            <p style={{ fontSize: 12, color: '#6c757d', margin: 0 }}>Registrar abonos a facturas pendientes</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {clienteSel && deudaTotal > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#6c757d' }}>Deuda total:</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#e74c3c' }}>{FMT(deudaTotal)}</span>
            </div>
          )}
          {user && <div style={{ fontSize: 12, color: '#6c757d' }}>Usuario: <strong>{user.nombres || user.nombre_usuario}</strong></div>}
        </div>
      </div>

      {/* ── FILA CLIENTE ── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #dee2e6', padding: '10px 20px',
        display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start',
      }}>
        <div style={{ flex: '1 1 320px', position: 'relative' }} ref={dropRef}>
          <label style={S.label}>Cliente con deuda *</label>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              style={{ ...S.input, paddingLeft: 34, paddingRight: clienteSel ? 34 : 12 }}
              placeholder="Buscar por nombre, cédula..."
              value={buscarCliente}
              onChange={e => { setBuscarCliente(e.target.value); if (clienteSel) limpiarCliente(); }}
              onFocus={() => clientesFound.length && setDropdownOpen(true)}
            />
            {cargandoCli && (
              <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              </div>
            )}
            {clienteSel && (
              <button onClick={limpiarCliente} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 16, padding: '0 2px' }}>✕</button>
            )}
          </div>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
              background: '#fff', border: '1px solid #dee2e6', borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 260, overflowY: 'auto', marginTop: 2,
            }}>
              {clientesFound.length === 0 && !cargandoCli && (
                <div style={{ padding: '12px 14px', color: '#6c757d', fontSize: 13 }}>
                  No hay clientes con deuda que coincidan
                </div>
              )}
              {clientesFound.map(c => (
                <button key={c.id} onClick={() => seleccionarCliente(c)}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f5f8ff'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.nombres} {c.apellidos}</div>
                    <div style={{ fontSize: 11, color: '#6c757d' }}>{c.cedula || 'Sin cédula'} · {c.telefono || ''}</div>
                  </div>
                  <span style={S.badge('#fde8e8', '#e74c3c')}>Con deuda</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {clienteSel && (
          <div style={{ background: '#fde8e8', border: '1px solid #f5c6cb', borderRadius: 8, padding: '8px 14px', display: 'flex', gap: 12, alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#c0392b' }}>{clienteSel.nombres} {clienteSel.apellidos}</div>
              <div style={{ fontSize: 11, color: '#c0392b' }}>{pendientes.length} factura{pendientes.length !== 1 ? 's' : ''} pendiente{pendientes.length !== 1 ? 's' : ''} · Deuda: {FMT(deudaTotal)}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── BODY ── */}
      <div style={S.body}>

        {/* Panel izquierdo — facturas pendientes */}
        <div style={S.panel}>
          <div style={S.panelHeader}>
            <span>Facturas Pendientes</span>
            {pendientes.length > 0 && (
              <span style={{ fontSize: 12, color: '#6c757d', fontWeight: 400 }}>{pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #dee2e6' }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                style={{ ...S.input, paddingLeft: 30, fontSize: 13 }}
                placeholder="Buscar por N° factura o ID..."
                value={filtroFactura}
                onChange={e => setFiltroFactura(e.target.value)}
                onKeyDown={onKeyDown}
              />
            </div>
          </div>
          <div style={{ ...S.panelBody, padding: 0 }}>
            {!clienteSel && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa' }}>
                <span style={{ fontSize: 32 }}>🧾</span>
                <p style={{ marginTop: 10, fontSize: 14 }}>Busca y selecciona un cliente</p>
              </div>
            )}
            {clienteSel && cargandoPend && (
              <div className="spinner-wrapper"><div className="spinner" /></div>
            )}
            {clienteSel && !cargandoPend && pendientes.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: '#6c757d' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" style={{ marginBottom: 8 }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <p>Este cliente no tiene deudas pendientes</p>
              </div>
            )}
            {facturasFiltradas.map((f, i) => (
              <button
                key={f.id}
                style={S.facturaItem(facturaSelIdx === i)}
                onClick={() => { setFacturaSelIdx(i); setAbono(''); setError(''); setSuccess(''); }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {f.id_personalizado || `#${f.id}`}
                    {f.numero_factura && <span style={{ marginLeft: 8, color: '#6c757d', fontWeight: 400, fontSize: 12 }}>· {f.numero_factura}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#6c757d', marginTop: 2 }}>
                    {FECHA(f.created_at)}
                    {f.tipo === 'COBRO_DEUDA' && <span style={{ marginLeft: 6, background: '#f3e8ff', color: '#7c3aed', borderRadius: 4, padding: '1px 5px', fontSize: 10, fontWeight: 600 }}>COBRO DEUDA</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#6c757d' }}>Total original: {FMT(f.total)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#e74c3c', fontWeight: 700, fontSize: 15 }}>{FMT(f.saldo_pendiente)}</div>
                  <div style={{ fontSize: 10, color: '#e74c3c' }}>pendiente</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Panel derecho — registrar abono */}
        <div style={{ ...S.panel, borderRight: 'none' }}>
          <div style={S.panelHeader}>
            <span>Registrar Abono</span>
            {facturasSel && <span style={{ fontSize: 12, color: '#6c757d', fontWeight: 400 }}>1 seleccionada</span>}
          </div>
          <div style={S.panelBody}>

            {!facturasSel && (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#aaa' }}>
                <span style={{ fontSize: 40 }}>💳</span>
                <p style={{ marginTop: 10, fontSize: 14 }}>Selecciona una factura pendiente</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Haz clic en una factura de la lista izquierda</p>
              </div>
            )}

            {facturasSel && (
              <>
                {/* Info factura */}
                <div style={{ ...S.totalesBox, background: '#fff8e1', borderColor: '#ffecb3' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#856404' }}>Factura seleccionada</div>
                  <div style={S.kv}>
                    <span style={{ color: '#6c757d' }}>ID</span>
                    <code style={{ background: '#f0f4ff', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{facturasSel.id_personalizado || facturasSel.id}</code>
                  </div>
                  {facturasSel.numero_factura && (
                    <div style={S.kv}>
                      <span style={{ color: '#6c757d' }}>N° Factura</span>
                      <span>{facturasSel.numero_factura}</span>
                    </div>
                  )}
                  <div style={S.kv}>
                    <span style={{ color: '#6c757d' }}>Total factura</span>
                    <span style={{ fontWeight: 600 }}>{FMT(facturasSel.total)}</span>
                  </div>
                  <div style={S.kv}>
                    <span style={{ color: '#6c757d' }}>Ya pagado</span>
                    <span style={{ color: '#27ae60', fontWeight: 600 }}>{FMT(parseFloat(facturasSel.total || 0) - saldoActual)}</span>
                  </div>
                  <div style={{ ...S.kv, borderTop: '1px solid #ffecb3', paddingTop: 8, marginTop: 4 }}>
                    <span style={{ fontWeight: 700 }}>Saldo pendiente</span>
                    <span style={{ fontWeight: 700, fontSize: 18, color: '#e74c3c' }}>{FMT(saldoActual)}</span>
                  </div>
                </div>

                {/* Form abono */}
                <form onSubmit={handleCobrar}>
                  <div style={S.fgroup}>
                    <label style={S.label}>Monto del abono *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6c757d', fontWeight: 700 }}>$</span>
                      <input
                        type="number" min="0.01" step="0.01" max={saldoActual}
                        value={abono} onChange={e => { setAbono(e.target.value); setError(''); }}
                        style={{ ...S.input, paddingLeft: 26, fontSize: 18, fontWeight: 700 }}
                        placeholder="0.00" required autoFocus
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <button type="button" className="btn btn-ghost btn-sm"
                        onClick={() => setAbono(saldoActual.toFixed(2))}
                        style={{ flex: 1, justifyContent: 'center' }}>
                        Pagar todo ({FMT(saldoActual)})
                      </button>
                    </div>
                  </div>

                  {/* Preview resultado */}
                  {abonoNum > 0 && (
                    <div style={S.totalesBox}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Vista previa del pago</div>
                      <div style={S.kv}>
                        <span style={{ color: '#6c757d' }}>Abono a registrar</span>
                        <span style={{ color: '#27ae60', fontWeight: 600 }}>{FMT(abonoNum)}</span>
                      </div>
                      {vuelto > 0 && (
                        <div style={{ ...S.kv, color: '#f39c12' }}>
                          <span>Vuelto</span>
                          <span style={{ fontWeight: 600 }}>{FMT(vuelto)}</span>
                        </div>
                      )}
                      <div style={{ ...S.kv, borderTop: '1px solid #dee2e6', paddingTop: 8, marginTop: 4 }}>
                        <span style={{ fontWeight: 700 }}>Saldo restante</span>
                        <span style={{ fontWeight: 700, fontSize: 16, color: saldoNuevo <= 0 ? '#27ae60' : '#e74c3c' }}>
                          {saldoNuevo <= 0 ? '✓ Deuda saldada' : FMT(saldoNuevo)}
                        </span>
                      </div>
                    </div>
                  )}

                  {error   && <div className="alert alert-error"   style={{ marginBottom: 12 }}>{error}</div>}
                  {success && <div className="alert alert-success" style={{ marginBottom: 12 }}>✓ {success}</div>}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button
                      type="submit" disabled={saving}
                      className="btn btn-primary"
                      style={{ justifyContent: 'center', padding: '12px', fontSize: 15, fontWeight: 700 }}
                    >
                      {saving ? (
                        <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Procesando...</>
                      ) : (
                        <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M9 12l2 2 4-4"/>
                        </svg> Confirmar Abono</>
                      )}
                    </button>
                    <button type="button" className="btn btn-ghost"
                      onClick={() => { setFacturaSelIdx(null); setAbono(''); setError(''); }}
                      style={{ justifyContent: 'center' }}>
                      Cancelar selección
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
