import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { imprimirTicketAbono } from '../../utils/ticketVenta';
import { Search, ReceiptText } from 'lucide-react';

/* ─────────────── helpers ─────────────── */
const HORA  = () => new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta'];
const REF_META = {
  Transferencia: { label: 'Código de Transferencia', placeholder: 'Ej: TRF-20260615-001' },
  Tarjeta:       { label: 'Últimos 4 dígitos de tarjeta', placeholder: 'XXXX' },
};

const FMT   = v => `$${parseFloat(v || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;
const FECHAFMT = s => {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const S = {
  page:      { display: 'flex', flexDirection: 'column', height: '100%', background: '#f4f6fa', overflow: 'hidden' },
  header:    { background: '#fff', borderBottom: '1px solid #dee2e6', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 },
  cliBar:    { background: '#fff', borderBottom: '1px solid #dee2e6', padding: '7px 16px', flexShrink: 0 },
  body:      { display: 'grid', gridTemplateColumns: '1fr 440px', flex: 1, overflow: 'hidden', minHeight: 0 },
  panelL:    { display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #dee2e6', background: '#fafafa' },
  panelR:    { display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' },
  panelHead: { padding: '9px 14px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0, background: '#fff' },
  input:     { padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 6, fontSize: 13, width: '100%', background: '#fff', outline: 'none', fontFamily: 'inherit' },
  lbl:       { fontSize: 10, fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3, display: 'block' },
  badge:     (bg, c) => ({ display: 'inline-block', padding: '2px 7px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color: c }),
  kv:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: 13 },
  factItem:  (sel) => ({
    width: '100%', textAlign: 'left', padding: '10px 14px', cursor: 'pointer',
    background: sel ? '#eef4ff' : 'none', border: 'none',
    borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderLeft: sel ? '3px solid #3498db' : '3px solid transparent',
  }),
};

export default function CobrarDeuda() {
  const navigate       = useNavigate();
  const { isAdmin }    = useAuth();
  const [searchParams] = useSearchParams();
  const clienteIdInit  = searchParams.get('clienteId');

  /* hora en vivo */
  const [horaActual, setHoraActual] = useState(HORA());
  useEffect(() => { const t = setInterval(() => setHoraActual(HORA()), 1000); return () => clearInterval(t); }, []);

  /* cliente */
  const [buscarCliente, setBuscarCliente] = useState('');
  const [clientesFound, setClientesFound] = useState([]);
  const [dropCliOpen,   setDropCliOpen]   = useState(false);
  const [clienteSel,    setClienteSel]    = useState(null);
  const [cargandoCli,   setCargandoCli]   = useState(false);
  const dropCliRef = useRef(null);

  /* facturas */
  const [pendientes,    setPendientes]    = useState([]);
  const [cargandoPend,  setCargandoPend]  = useState(false);
  const [filtroFactura, setFiltroFactura] = useState('');
  const [facturaIdx,    setFacturaIdx]    = useState(null);

  /* pago */
  const [abono,       setAbono]       = useState('');
  const [metodoPago,  setMetodoPago]  = useState('Efectivo');
  const [referencia,  setReferencia]  = useState('');
  const [fechaCustom, setFechaCustom] = useState('');
  const [horaCustom,  setHoraCustom]  = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  /* cerrar dropdown cliente */
  useEffect(() => {
    function h(e) { if (dropCliRef.current && !dropCliRef.current.contains(e.target)) setDropCliOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* inicializar fecha/hora al cambiar método */
  useEffect(() => {
    if (metodoPago === 'Transferencia' || metodoPago === 'Tarjeta') {
      if (!fechaCustom) {
        const now = new Date();
        setFechaCustom(now.toISOString().slice(0, 10));
        setHoraCustom(now.toTimeString().slice(0, 5));
      }
    } else {
      setFechaCustom(''); setHoraCustom('');
    }
    setReferencia('');
  }, [metodoPago]); // eslint-disable-line

  /* precarga cliente por queryParam */
  useEffect(() => {
    if (!clienteIdInit) return;
    api.get(`/cliente/buscar/${clienteIdInit}`).then(r => {
      if (r.ok && r.data.resultado) seleccionarCliente(r.data.resultado);
    });
  }, [clienteIdInit]); // eslint-disable-line

  /* buscar clientes con deuda */
  const buscarClientesFn = useCallback(async (term) => {
    if (term.length < 2) { setClientesFound([]); setDropCliOpen(false); return; }
    setCargandoCli(true);
    const r = await api.get(`/cliente/lista?buscar=${encodeURIComponent(term)}`);
    if (r.ok) {
      const conDeuda = (r.data.resultado || []).filter(c => c.tiene_deuda);
      setClientesFound(conDeuda.slice(0, 8));
      setDropCliOpen(true);
    }
    setCargandoCli(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => buscarClientesFn(buscarCliente), 280);
    return () => clearTimeout(t);
  }, [buscarCliente, buscarClientesFn]);

  async function seleccionarCliente(c) {
    setClienteSel(c);
    setBuscarCliente(`${c.nombres} ${c.apellidos}`);
    setDropCliOpen(false); setClientesFound([]);
    setFacturaIdx(null); setAbono(''); setError('');
    setCargandoPend(true);
    const r = await api.get(`/factura/cliente/${c.id}`);
    if (r.ok) {
      const pend = (r.data.resultado || [])
        .filter(f => (f.estado === 'PENDIENTE' || f.estado_pago === 'PENDIENTE') && parseFloat(f.saldo_pendiente) > 0)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setPendientes(pend);
    }
    setCargandoPend(false);
  }

  function limpiarCliente() {
    setClienteSel(null); setBuscarCliente(''); setClientesFound([]);
    setPendientes([]); setFacturaIdx(null); setAbono(''); setError('');
  }

  const facturasFiltradas = filtroFactura.trim()
    ? pendientes.filter(f =>
        (f.id_personalizado || '').toLowerCase().includes(filtroFactura.toLowerCase()) ||
        String(f.id).includes(filtroFactura)
      )
    : pendientes;

  const facturasSel = facturaIdx !== null ? facturasFiltradas[facturaIdx] : null;
  const saldoActual = parseFloat(facturasSel?.saldo_pendiente || 0);
  const abonoNum    = Math.min(parseFloat(abono) || 0, saldoActual);
  const saldoNuevo  = Math.max(0, parseFloat((saldoActual - abonoNum).toFixed(2)));
  const vuelto      = (parseFloat(abono) || 0) > saldoActual ? parseFloat(((parseFloat(abono) || 0) - saldoActual).toFixed(2)) : 0;
  const deudaTotal  = pendientes.reduce((s, f) => s + parseFloat(f.saldo_pendiente || 0), 0);
  const refActiva   = REF_META[metodoPago];

  function onKeyDown(e) {
    if (!facturasFiltradas.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setFacturaIdx(i => i === null ? 0 : Math.min(i + 1, facturasFiltradas.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFacturaIdx(i => i === null ? 0 : Math.max(i - 1, 0)); }
  }

  async function handleCobrar() {
    if (!facturasSel) { setError('Selecciona una factura'); return; }
    if (abonoNum <= 0) { setError('El monto del abono debe ser mayor a $0'); return; }
    setSaving(true); setError('');

    let fechaPagoISO = null;
    if ((metodoPago === 'Transferencia' || metodoPago === 'Tarjeta') && fechaCustom) {
      fechaPagoISO = `${fechaCustom}T${horaCustom || '00:00'}:00`;
    }

    const obsPartes = [];
    if (referencia.trim()) obsPartes.push(`Ref: ${referencia.trim()}`);
    if (vuelto > 0) obsPartes.push(`Vuelto: ${FMT(vuelto)}`);
    const obsExtra = obsPartes.join(' | ') || null;

    let res;
    if (saldoNuevo <= 0.001) {
      res = await api.put(`/factura/cobrar/${facturasSel.id}`);
    } else {
      res = await api.put('/factura/editar', {
        id:             facturasSel.id,
        clienteId:      facturasSel.cliente_id,
        numeroFactura:  facturasSel.numero_factura,
        tipo:           facturasSel.tipo_venta || facturasSel.tipo,
        estado:         'PENDIENTE',
        subtotal:       facturasSel.subtotal,
        descuento:      facturasSel.descuento,
        total:          facturasSel.total,
        saldoPendiente: parseFloat(saldoNuevo.toFixed(2)),
        observacion:    obsExtra
          ? `${facturasSel.observacion ? facturasSel.observacion + ' | ' : ''}${obsExtra}`
          : facturasSel.observacion,
      });
    }

    setSaving(false);
    if (res.ok) {
      imprimirTicketAbono({
        factura:       facturasSel,
        abono:         abonoNum,
        saldoAnterior: saldoActual,
        saldoNuevo,
        cliente:       clienteSel,
        metodoPago,
        referencia:    referencia.trim() || null,
        fechaPago:     fechaPagoISO,
      });
      setAbono(''); setFacturaIdx(null); setReferencia('');
      await seleccionarCliente(clienteSel);
    } else {
      setError(res.data?.resultado || 'Error al registrar el abono');
    }
  }

  /* ═══════════════════════════ RENDER ═══════════════════════════ */
  return (
    <div style={S.page}>

      {/* ── HEADER ── */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/facturas')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Volver
          </button>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Cobro de Deudas</h2>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#6c757d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>FECHA</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{new Date().toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
          </div>
          {isAdmin && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#6c757d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>HORA</div>
              <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{horaActual}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── BARRA CLIENTE ── */}
      <div style={S.cliBar}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 300, flexShrink: 0 }} ref={dropCliRef}>
            <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }}
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              style={{ ...S.input, paddingLeft: 28, paddingRight: clienteSel ? 24 : 8 }}
              placeholder="Buscar cliente con deuda..."
              value={buscarCliente}
              onChange={e => { setBuscarCliente(e.target.value); if (clienteSel) limpiarCliente(); }}
              onFocus={() => clientesFound.length && setDropCliOpen(true)}
            />
            {cargandoCli && <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}><div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /></div>}
            {clienteSel && <button onClick={limpiarCliente} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 13, padding: 0 }}>✕</button>}

            {dropCliOpen && clientesFound.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, background: '#fff', border: '1px solid #dee2e6', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 220, overflowY: 'auto', marginTop: 2 }}>
                {clientesFound.map(c => (
                  <button key={c.id} onClick={() => seleccionarCliente(c)}
                    style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fde8e8', border: '1px solid #f5c6cb', borderRadius: 8, padding: '5px 12px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#c0392b' }}>{clienteSel.nombres} {clienteSel.apellidos}</div>
                <div style={{ fontSize: 11, color: '#c0392b' }}>
                  {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''} · Deuda total: <strong>{FMT(deudaTotal)}</strong>
                </div>
              </div>
            </div>
          )}
          {clienteSel && (
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/clientes/${clienteSel.id}/ficha`)}>Ver ficha</button>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={S.body}>

        {/* ════ PANEL IZQUIERDO — FACTURAS PENDIENTES ════ */}
        <div style={S.panelL}>
          <div style={S.panelHead}>
            <span>Facturas Pendientes</span>
            {pendientes.length > 0 && (
              <span style={{ fontSize: 11, color: '#6c757d', fontWeight: 400 }}>
                {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #dee2e6', background: '#fff', flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }}
                width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                style={{ ...S.input, paddingLeft: 28, fontSize: 12 }}
                placeholder="Buscar por N° factura o ID..."
                value={filtroFactura}
                onChange={e => setFiltroFactura(e.target.value)}
                onKeyDown={onKeyDown}
              />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {!clienteSel && (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#aaa' }}>
                <span style={{ fontSize: 36 }}><Search size={40} /></span>
                <p style={{ marginTop: 10, fontSize: 13 }}>Busca y selecciona un cliente con deuda</p>
              </div>
            )}
            {clienteSel && cargandoPend && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100 }}>
                <div className="spinner" />
              </div>
            )}
            {clienteSel && !cargandoPend && pendientes.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6c757d' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" style={{ marginBottom: 8 }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <p style={{ fontSize: 13 }}>Este cliente no tiene deudas pendientes</p>
              </div>
            )}
            {facturasFiltradas.map((f, i) => (
              <button
                key={f.id}
                style={S.factItem(facturaIdx === i)}
                onClick={() => { setFacturaIdx(i); setAbono(''); setError(''); }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {f.id_personalizado || `#${f.id}`}
                    {(f.tipo_venta || f.tipo) === 'CREDITO' && (
                      <span style={{ background: '#f3e8ff', color: '#7c3aed', borderRadius: 4, padding: '1px 5px', fontSize: 10, fontWeight: 700 }}>CRÉDITO</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#6c757d', marginTop: 2 }}>{FECHAFMT(f.created_at)}</div>
                  <div style={{ fontSize: 11, color: '#6c757d' }}>Total: {FMT(f.total)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#e74c3c', fontWeight: 700, fontSize: 15 }}>{FMT(f.saldo_pendiente)}</div>
                  <div style={{ fontSize: 10, color: '#e74c3c' }}>pendiente</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ════ PANEL DERECHO — REGISTRAR ABONO ════ */}
        <div style={S.panelR}>
          <div style={S.panelHead}>
            <span>Registrar Abono</span>
            {facturasSel && <span style={S.badge('#3498db', '#fff')}>1 seleccionada</span>}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {!facturasSel ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
                <span style={{ fontSize: 40 }}><ReceiptText size={40} /></span>
                <p style={{ marginTop: 10, fontSize: 14 }}>Selecciona una factura pendiente</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Haz clic en una factura de la lista</p>
              </div>
            ) : (
              <div style={{ padding: '12px 14px' }}>

                {/* Resumen factura */}
                <div style={{ background: '#fff8e1', border: '1px solid #ffecb3', borderRadius: 9, padding: '12px 14px', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 11, color: '#856404', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 }}>Factura seleccionada</div>
                  <div style={S.kv}>
                    <span style={{ color: '#6c757d', fontSize: 12 }}>ID</span>
                    <code style={{ background: '#f0f4ff', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{facturasSel.id_personalizado || facturasSel.id}</code>
                  </div>
                  <div style={S.kv}>
                    <span style={{ color: '#6c757d', fontSize: 12 }}>Fecha</span>
                    <span style={{ fontSize: 12 }}>{FECHAFMT(facturasSel.created_at)}</span>
                  </div>
                  <div style={S.kv}>
                    <span style={{ color: '#6c757d', fontSize: 12 }}>Total original</span>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{FMT(facturasSel.total)}</span>
                  </div>
                  <div style={S.kv}>
                    <span style={{ color: '#6c757d', fontSize: 12 }}>Ya abonado</span>
                    <span style={{ color: '#27ae60', fontWeight: 600, fontSize: 12 }}>{FMT(parseFloat(facturasSel.total || 0) - saldoActual)}</span>
                  </div>
                  <div style={{ ...S.kv, borderTop: '1px solid #ffecb3', paddingTop: 7, marginTop: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>Saldo pendiente</span>
                    <span style={{ fontWeight: 800, fontSize: 19, color: '#e74c3c' }}>{FMT(saldoActual)}</span>
                  </div>
                </div>

                {/* Saldo nuevo destacado */}
                {abonoNum > 0 && (
                  <div style={{ background: 'linear-gradient(135deg, #2980b9, #3498db)', borderRadius: 9, padding: '10px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>SALDO NUEVO</div>
                    <div style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>
                      {saldoNuevo <= 0 ? '✓ SALDADA' : FMT(saldoNuevo)}
                    </div>
                  </div>
                )}

                {/* Monto abono */}
                <div style={{ marginBottom: 10 }}>
                  <label style={S.lbl}>ABONO</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#6c757d', fontWeight: 700, fontSize: 14 }}>$</span>
                    <input
                      type="number" min="0.01" step="0.01"
                      value={abono}
                      onChange={e => { setAbono(e.target.value); setError(''); }}
                      style={{ ...S.input, paddingLeft: 24, fontSize: 17, fontWeight: 700 }}
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                    <button type="button" className="btn btn-ghost btn-sm"
                      onClick={() => setAbono(saldoActual.toFixed(2))}
                      style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
                      Pagar todo · {FMT(saldoActual)}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm"
                      onClick={() => setAbono((saldoActual / 2).toFixed(2))}
                      style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
                      50% · {FMT(saldoActual / 2)}
                    </button>
                  </div>
                  {vuelto > 0 && (
                    <div style={{ fontSize: 11, color: '#27ae60', fontWeight: 600, marginTop: 4 }}>
                      Vuelto a entregar: {FMT(vuelto)}
                    </div>
                  )}
                </div>

                {/* Método de pago */}
                <div style={{ marginBottom: 8 }}>
                  <label style={S.lbl}>MÉTODO DE PAGO</label>
                  <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)} style={S.input}>
                    {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Fecha/hora (solo Transferencia/Tarjeta) */}
                {(metodoPago === 'Transferencia' || metodoPago === 'Tarjeta') && (() => {
                  const hoy = new Date();
                  const mm  = String(hoy.getMonth() + 1).padStart(2, '0');
                  const yyyy = hoy.getFullYear();
                  const minF = `${yyyy}-${mm}-01`;
                  const maxF = `${yyyy}-${mm}-${String(new Date(yyyy, hoy.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
                  return (
                    <div style={{ marginBottom: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                      <div>
                        <label style={S.lbl}>FECHA PAGO</label>
                        <input type="date" min={minF} max={maxF} value={fechaCustom} onChange={e => setFechaCustom(e.target.value)} style={S.input} />
                      </div>
                      <div>
                        <label style={S.lbl}>HORA PAGO</label>
                        <input type="time" value={horaCustom} onChange={e => setHoraCustom(e.target.value)} style={S.input} />
                      </div>
                    </div>
                  );
                })()}

                {/* Referencia */}
                <div style={{ marginBottom: 10 }}>
                  <label style={{ ...S.lbl, color: refActiva ? '#495057' : '#aaa' }}>
                    {refActiva ? refActiva.label.toUpperCase() : 'N° DE REFERENCIA'}
                  </label>
                  <input
                    disabled={!refActiva}
                    value={referencia}
                    onChange={e => setReferencia(e.target.value)}
                    placeholder={refActiva ? refActiva.placeholder : 'Solo para Transferencia / Tarjeta'}
                    style={{ ...S.input, background: refActiva ? '#fff' : '#f8f9fa', color: refActiva ? '#212529' : '#aaa', cursor: refActiva ? 'text' : 'not-allowed' }}
                  />
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: 10, fontSize: 12 }}>{error}</div>}
              </div>
            )}
          </div>

          {/* Botones sticky */}
          {facturasSel && (
            <div style={{ borderTop: '2px solid #dee2e6', padding: '11px 14px', background: '#fff', flexShrink: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
                <button className="btn btn-ghost"
                  onClick={() => { setFacturaIdx(null); setAbono(''); setError(''); }}
                  style={{ justifyContent: 'center' }}>
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  disabled={saving || abonoNum <= 0}
                  onClick={handleCobrar}
                  style={{ justifyContent: 'center', fontWeight: 700 }}>
                  {saving ? (
                    <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Procesando...</>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                      </svg>
                      Guardar + Imprimir
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
