import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import ClienteFormModal from '../../components/clientes/ClienteFormModal';
import HistorialListModal from '../../components/historial/HistorialListModal';
import { imprimirTicketVenta } from '../../utils/ticketVenta';
import { Search, ShoppingCart, FileText, X } from 'lucide-react';

/* ─────────────── helpers ─────────────── */
const FMT      = v => `$${parseFloat(v || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;
const HORA     = () => new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const FECHA_HOY = new Date().toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta'];
const REF_META = {
  Transferencia: { label: 'N° de Transferencia', placeholder: 'Ej: 00123456789' },
  Tarjeta:       { label: 'Últimos 4 dígitos de tarjeta', placeholder: 'XXXX' },
};

/* ─────────────── estilos ─────────────── */
const S = {
  page:      { display: 'flex', flexDirection: 'column', height: '100%', background: '#f4f6fa', overflow: 'hidden' },
  header:    { background: '#fff', borderBottom: '1px solid #dee2e6', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 },
  cliBar:    { background: '#fff', borderBottom: '1px solid #dee2e6', padding: '7px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 },
  body:      { display: 'grid', gridTemplateColumns: '1fr 440px', flex: 1, overflow: 'hidden', minHeight: 0 },
  panelL:    { display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #dee2e6', background: '#fafafa' },
  panelR:    { display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' },
  panelHead: { padding: '9px 14px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0, background: '#fff' },
  input:     { padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 6, fontSize: 13, width: '100%', background: '#fff', outline: 'none', fontFamily: 'inherit' },
  lbl:       { fontSize: 10, fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3, display: 'block' },
  badge:     (bg, c) => ({ display: 'inline-block', padding: '2px 7px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color: c }),
  thCell:    { padding: '7px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' },
  tdCell:    (sel) => ({ padding: '7px 10px', fontSize: 13, borderBottom: '1px solid #f0f2f5', background: sel ? '#eef4ff' : 'inherit', cursor: 'pointer' }),
};

/* ══════════════════════════════════════════════════ */
export default function CrearVenta() {
  const navigate        = useNavigate();
  const { isAdmin }     = useAuth();
  const [searchParams]  = useSearchParams();
  const clienteIdInit   = searchParams.get('clienteId');

  /* hora en vivo */
  const [horaActual, setHoraActual] = useState(HORA());
  useEffect(() => { const t = setInterval(() => setHoraActual(HORA()), 1000); return () => clearInterval(t); }, []);

  /* ── cliente ── */
  const [buscarCliente, setBuscarCliente] = useState('');
  const [clientesFound, setClientesFound] = useState([]);
  const [dropCliOpen,   setDropCliOpen]   = useState(false);
  const [clienteSel,    setClienteSel]    = useState(null);
  const [cargandoCli,   setCargandoCli]   = useState(false);
  const [historialList, setHistorialList] = useState([]);
  const dropCliRef = useRef(null);

  /* ── modals ── */
  const [modalCliente,   setModalCliente]   = useState(false);
  const [modalTipo,      setModalTipo]      = useState(false);
  const [modalHistorial, setModalHistorial] = useState(false);
  const [ventaCreada,    setVentaCreada]    = useState(null);  // { venta, items }

  /* ── productos ── */
  const [productos,        setProductos]        = useState([]);
  const [prodFiltrados,    setProdFiltrados]    = useState([]);
  const [buscarProd,       setBuscarProd]       = useState('');
  const [cargandoProd,     setCargandoProd]     = useState(false);
  const [mostrarFiltros,   setMostrarFiltros]   = useState(false);
  const [filtroGrupo,      setFiltroGrupo]      = useState('');
  const [filtroProveedor,  setFiltroProveedor]  = useState('');
  const [filtroStock,      setFiltroStock]      = useState('');   // '' | 'con' | 'sin'
  const [grupos,           setGrupos]           = useState([]);
  const [proveedores,      setProveedores]      = useState([]);
  const [selectedIdx,      setSelectedIdx]      = useState(-1);
  const searchProdRef = useRef(null);

  /* ── carrito ── */
  const [carrito, setCarrito] = useState([]);

  /* ── servicio rápido ── */
  const [formServicio,    setFormServicio]    = useState({ nombre: '', precio: '' });
  const [mostrarServicio, setMostrarServicio] = useState(false);

  /* ── pago ── */
  const [descuentoPct,  setDescuentoPct]  = useState('0');
  const [metodoPago,    setMetodoPago]    = useState('Efectivo');
  const [referenciaNum, setReferenciaNum] = useState('');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [esCredito,     setEsCredito]     = useState(false);
  const [observacion,   setObservacion]   = useState('');
  const [fechaCustom,   setFechaCustom]   = useState('');
  const [horaCustom,    setHoraCustom]    = useState('');

  /* ── historial clínico seleccionado para la venta ── */
  const [historialSel, setHistorialSel] = useState(null);

  /* ── consumidor final ── */
  const [consumidorFinalId, setConsumidorFinalId] = useState(null);
  useEffect(() => {
    api.get('/cliente/lista?buscar=consumidor').then(r => {
      if (r.ok) {
        const found = (r.data.resultado || []).find(c => c.es_consumidor_final);
        if (found) setConsumidorFinalId(found.id);
      }
    });
  }, []);

  /* ── guardar ── */
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  /* ── inicializar fecha/hora al seleccionar Transferencia o Tarjeta ── */
  useEffect(() => {
    if (metodoPago === 'Transferencia' || metodoPago === 'Tarjeta') {
      if (!fechaCustom) {
        const now = new Date();
        setFechaCustom(now.toISOString().slice(0, 10));
        setHoraCustom(now.toTimeString().slice(0, 5));
      }
    } else {
      setFechaCustom('');
      setHoraCustom('');
    }
  }, [metodoPago]); // eslint-disable-line

  /* ── cerrar dropdown cliente ── */
  useEffect(() => {
    function h(e) { if (dropCliRef.current && !dropCliRef.current.contains(e.target)) setDropCliOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* ── precarga cliente ── */
  useEffect(() => {
    if (!clienteIdInit) return;
    api.get(`/cliente/buscar/${clienteIdInit}`).then(r => {
      if (r.ok && r.data.resultado) seleccionarCliente(r.data.resultado);
    });
  }, [clienteIdInit]); // eslint-disable-line

  /* ── buscar clientes ── */
  const buscarClientesFn = useCallback(async (term) => {
    if (term.length < 2) { setClientesFound([]); setDropCliOpen(false); return; }
    setCargandoCli(true);
    const r = await api.get(`/cliente/lista?buscar=${encodeURIComponent(term)}`);
    if (r.ok) { setClientesFound(r.data.resultado?.slice(0, 8) || []); setDropCliOpen(true); }
    setCargandoCli(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => buscarClientesFn(buscarCliente), 280);
    return () => clearTimeout(t);
  }, [buscarCliente, buscarClientesFn]);

  function seleccionarCliente(c) {
    setClienteSel(c); setBuscarCliente(`${c.nombres} ${c.apellidos}`);
    setDropCliOpen(false); setClientesFound([]);
    setHistorialSel(null);
    api.get(`/historial-clinico/cliente/${c.id}`).then(async r => {
      if (r.ok) {
        setHistorialList(r.data.resultado || []);
        return;
      }
      // Compatibilidad con implementaciones antiguas del backend
      const alt = await api.get(`/historial/lista/${c.id}`);
      if (alt.ok) setHistorialList(alt.data.resultado || []);
      else setHistorialList([]);
    });
  }

  function limpiarCliente() {
    setClienteSel(null); setBuscarCliente(''); setClientesFound([]);
    setHistorialList([]); setDropCliOpen(false);
    setHistorialSel(null);
  }

  /* ── cargar productos ── */
  useEffect(() => {
    setCargandoProd(true);
    api.get('/producto/lista').then(r => {
      if (r.ok) {
        const list = r.data.resultado || [];
        setProductos(list);
        setProdFiltrados(list);
        setGrupos([...new Set(list.map(p => p.grupo).filter(Boolean))].sort());
        setProveedores([...new Set(list.map(p => p.proveedor_nombre).filter(Boolean))].sort());
      }
      setCargandoProd(false);
    });
  }, []);

  /* ── filtrar productos ── */
  useEffect(() => {
    let lista = productos;
    if (buscarProd.trim()) {
      const q = buscarProd.toLowerCase();
      lista = lista.filter(p =>
        (p.nombre           || '').toLowerCase().includes(q) ||
        (p.codigo           || '').toLowerCase().includes(q) ||
        (p.grupo            || '').toLowerCase().includes(q) ||
        (p.proveedor_nombre || '').toLowerCase().includes(q)
      );
    }
    if (filtroGrupo)     lista = lista.filter(p => p.grupo === filtroGrupo);
    if (filtroProveedor) lista = lista.filter(p => p.proveedor_nombre === filtroProveedor);
    if (filtroStock === 'con') lista = lista.filter(p => (p.stock ?? 0) > 0);
    if (filtroStock === 'sin') lista = lista.filter(p => (p.stock ?? 0) <= 0);
    setProdFiltrados(lista);
    setSelectedIdx(-1);
  }, [buscarProd, filtroGrupo, filtroProveedor, filtroStock, productos]);

  /* ── teclado en búsqueda ── */
  function onSearchKeydown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, prodFiltrados.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && selectedIdx >= 0) { e.preventDefault(); agregarAlCarrito(prodFiltrados[selectedIdx]); }
  }

  /* ── carrito ── */
  function agregarAlCarrito(prod) {
    if (!prod) return;
    setCarrito(prev => {
      const idx = prev.findIndex(i => i.id === prod.id);
      const maxStock = prod.stock ?? null;
      if (idx >= 0) {
        const n = [...prev];
        const nuevaCant = n[idx].cantidad + 1;
        n[idx] = { ...n[idx], cantidad: maxStock !== null ? Math.min(nuevaCant, maxStock) : nuevaCant };
        return n;
      }
      return [...prev, { id: prod.id, nombre: prod.nombre, precio: parseFloat(prod.pvp1 || prod.costo || 0), cantidad: 1, esServicio: false, stock: maxStock }];
    });
  }

  function cambiarCantidad(id, delta) {
    setCarrito(prev => prev.map(i => {
      if (i.id !== id) return i;
      const nuevaCant = Math.max(1, i.cantidad + delta);
      const max = (!i.esServicio && i.stock !== null) ? i.stock : Infinity;
      return { ...i, cantidad: Math.min(nuevaCant, max) };
    }));
  }

  function setCantidad(id, val) {
    const q = parseInt(val);
    if (!isNaN(q) && q >= 1) setCarrito(prev => prev.map(i => {
      if (i.id !== id) return i;
      const max = (!i.esServicio && i.stock !== null) ? i.stock : Infinity;
      return { ...i, cantidad: Math.min(q, max) };
    }));
  }

  function setPrecioServicio(id, val) {
    const p = parseFloat(val);
    if (!isNaN(p) && p >= 0) setCarrito(prev => prev.map(i => i.id === id ? { ...i, precio: p } : i));
  }

  function quitarDelCarrito(id) { setCarrito(prev => prev.filter(i => i.id !== id)); }

  function agregarServicio() {
    if (!formServicio.nombre.trim()) return;
    setCarrito(prev => [...prev, { id: `srv_${Date.now()}`, nombre: formServicio.nombre.trim(), precio: parseFloat(formServicio.precio) || 0, cantidad: 1, esServicio: true }]);
    setFormServicio({ nombre: '', precio: '' }); setMostrarServicio(false);
  }

  /* ── cálculos ── */
  const subtotalBruto  = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const descPct        = parseFloat(descuentoPct) || 0;
  const descMonto      = parseFloat((subtotalBruto * descPct / 100).toFixed(2));
  const totalFinal     = Math.max(0, parseFloat((subtotalBruto - descMonto).toFixed(2)));
  const montoNum       = parseFloat(montoRecibido) || 0;
  const saldoPendiente = esCredito ? parseFloat(Math.max(0, totalFinal - montoNum).toFixed(2)) : 0;
  const vuelto         = !esCredito && montoNum > totalFinal ? parseFloat((montoNum - totalFinal).toFixed(2)) : 0;
  const estadoFinal    = saldoPendiente > 0 ? 'PENDIENTE' : 'PAGADA';

  /* ── guardar ── */
  async function guardar(consumidorFinal = false) {
    setModalTipo(false);
    if (carrito.length === 0) { setError('El carrito está vacío'); return; }
    setSaving(true); setError('');
    const obs = [
      observacion.trim(),
      referenciaNum.trim() ? `Ref: ${referenciaNum.trim()}` : '',
      montoNum > 0         ? `Recibido: ${FMT(montoNum)}` : '',
      vuelto   > 0         ? `Vuelto: ${FMT(vuelto)}` : '',
    ].filter(Boolean).join(' | ') || null;

    // Construir fecha personalizada para Transferencia/Tarjeta
    let fechaPago = null;
    if ((metodoPago === 'Transferencia' || metodoPago === 'Tarjeta') && fechaCustom) {
      fechaPago = `${fechaCustom}T${horaCustom || '00:00'}:00`;
    }

    if (consumidorFinal && !consumidorFinalId) {
      setSaving(false);
      setError('No se encontró el cliente "Consumidor Final" en la base de datos. Por favor créalo primero.');
      return;
    }

    const res = await api.post('/factura/crear', {
      clienteId:          consumidorFinal ? consumidorFinalId : clienteSel?.id,
      nombreCliente:      consumidorFinal ? 'Consumidor Final' : (clienteSel ? `${clienteSel.nombres} ${clienteSel.apellidos}` : null),
      tipo:               esCredito ? 'CREDITO' : 'CONTADO',
      estado:             estadoFinal,
      subtotal:           subtotalBruto,
      total:              totalFinal,
      saldoPendiente,
      metodoPago,
      observacion:        obs,
      historialClinicoId: historialSel?.id || null,
      fechaPago,
      items:              carrito.map(it => ({ id: it.id, cantidad: it.cantidad, esServicio: it.esServicio || false })),
    });
    setSaving(false);
    if (res.ok) {
      const venta = res.data?.resultado || {};
      const items = carrito.map(it => ({
        codigo:          it.codigo || '',
        nombre:          it.nombre,
        cantidad:        it.cantidad,
        precio_unitario: it.precio,
        precio_total:    it.precio * it.cantidad,
      }));
      imprimirTicketVenta({ venta, items });
      setVentaCreada({ venta, items });
    } else {
      setError(res.data?.resultado || 'Error al guardar');
    }
  }

  function handleGuardar() {
    if (carrito.length === 0) { setError('El carrito está vacío'); return; }
    setModalTipo(true);
  }

  const hayFiltrosActivos = filtroGrupo || filtroProveedor || filtroStock;
  const refActiva = REF_META[metodoPago];

  /* ═══════════════════════════ RENDER ═══════════════════════════ */
  return (
    <div style={S.page}>

      {/* ── HEADER ── */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Punto de Venta (POS)</h2>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#6c757d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>FECHA PAGO</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{FECHA_HOY}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#6c757d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>HORA PAGO</div>
              <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{horaActual}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── BARRA CLIENTE ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #dee2e6', padding: '7px 16px', flexShrink: 0 }}>

        {/* Label encima */}
        <div style={S.lbl}>Cliente:</div>

        {/* Fila alineada */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Búsqueda cliente */}
          <div style={{ position: 'relative', width: 280, flexShrink: 0 }} ref={dropCliRef}>
            <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }}
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              style={{ ...S.input, paddingLeft: 28, paddingRight: clienteSel ? 24 : 8 }}
              placeholder="Buscar cliente (opcional)"
              value={buscarCliente}
              onChange={e => { setBuscarCliente(e.target.value); if (clienteSel) limpiarCliente(); }}
              onFocus={() => clientesFound.length && setDropCliOpen(true)}
            />
            {cargandoCli && <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}><div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /></div>}
            {clienteSel && <button onClick={limpiarCliente} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 13, padding: 0 }}>✕</button>}

            {/* Dropdown */}
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
                    {c.tiene_deuda && <span style={S.badge('#fde8e8', '#e74c3c')}>Con deuda</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Crear cliente */}
          <button className="btn btn-primary btn-sm" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
            onClick={() => setModalCliente(true)}>
            + Crear cliente
          </button>

          {/* Historial */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
  <span
    style={{
      fontSize: 12,
      color: '#64748b',
      fontWeight: 500
    }}
  >
    Historial:
  </span>

  {clienteSel ? (
    <>
      <button
        onClick={() => setModalHistorial(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          height: 28,
          padding: '0 12px',
          borderRadius: 999,
          border: '1px solid #cbd5e1',
          background: historialSel ? '#e0f2fe' : '#f8fafc',
          color: historialSel ? '#0369a1' : '#475569',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all .15s ease'
        }}
        title="Seleccionar o cambiar historial clínico"
      >
        <FileText size={14} />

        {historialSel
          ? `HC ${new Date(historialSel.created_at).toLocaleDateString('es-EC')}`
          : 'Seleccionar historial'}
      </button>

      {historialSel && (
        <button
          onClick={() => setHistorialSel(null)}
          title="Quitar historial seleccionado"
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '1px solid #e2e8f0',
            background: '#fff',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={12} />
        </button>
      )}
    </>
  ) : (
    <span
      style={{
        fontSize: 11,
        padding: '4px 10px',
        borderRadius: 999,
        background: '#f8fafc',
        color: '#64748b',
        border: '1px solid #e2e8f0',
        fontWeight: 600
      }}
    >
      CLIENTE OPCIONAL
    </span>
  )}
</div>

          {/* Periodo */}
          <div style={{ fontSize: 12, color: '#6c757d', whiteSpace: 'nowrap' }}>
            Periodo <strong>{new Date().toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}</strong>
          </div>

        </div>
      </div>

      {/* ── BODY ── */}
      <div style={S.body}>

        {/* ════ PANEL IZQUIERDO — PRODUCTOS ════ */}
        <div style={S.panelL}>
          <div style={S.panelHead}>
            <span>Buscar Productos</span>
            <span style={{ fontSize: 11, color: '#6c757d', fontWeight: 400 }}>
              {prodFiltrados.length} producto{prodFiltrados.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Barra búsqueda + filtros */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #dee2e6', background: '#fff', flexShrink: 0 }}>
            {/* Input buscar */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                ref={searchProdRef}
                style={{ ...S.input, paddingLeft: 30, paddingRight: buscarProd ? 26 : 8 }}
                placeholder="Buscar por nombre, código, grupo... (↑↓ y Enter)"
                value={buscarProd}
                onChange={e => setBuscarProd(e.target.value)}
                onKeyDown={onSearchKeydown}
              />
              {buscarProd && (
                <button onClick={() => setBuscarProd('')}
                  style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 13, padding: 0 }}>✕</button>
              )}
            </div>

            {/* Botón filtros */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                className={`btn btn-sm ${mostrarFiltros ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setMostrarFiltros(v => !v)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                Filtros
                {hayFiltrosActivos && <span style={S.badge('#e74c3c', '#fff')}>!</span>}
              </button>
              {hayFiltrosActivos && (
                <button className="btn btn-ghost btn-sm"
                  onClick={() => { setFiltroGrupo(''); setFiltroProveedor(''); setFiltroStock(''); }}>
                  Limpiar filtros
                </button>
              )}
            </div>

            {/* Panel de filtros — 3 columnas */}
            {mostrarFiltros && (
              <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div>
                  <label style={S.lbl}>Grupo:</label>
                  <select value={filtroGrupo} onChange={e => setFiltroGrupo(e.target.value)} style={S.input}>
                    <option value="">Todos</option>
                    {grupos.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.lbl}>Proveedor:</label>
                  <select value={filtroProveedor} onChange={e => setFiltroProveedor(e.target.value)} style={S.input}>
                    <option value="">Todos</option>
                    {proveedores.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.lbl}>Stock:</label>
                  <select value={filtroStock} onChange={e => setFiltroStock(e.target.value)} style={S.input}>
                    <option value="">Todos</option>
                    <option value="con">Con stock</option>
                    <option value="sin">Sin stock</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ── TABLA DE PRODUCTOS ── */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
            {cargandoProd && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 120 }}>
                <div className="spinner" />
              </div>
            )}

            {!cargandoProd && prodFiltrados.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px', color: '#6c757d', fontSize: 13 }}>
                <span style={{ fontSize: 28 }}><Search /></span>
                <p style={{ marginTop: 8 }}>No se encontraron productos</p>
              </div>
            )}

            {!cargandoProd && prodFiltrados.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={S.thCell}>Código</th>
                    <th style={S.thCell}>Nombre</th>
                    <th style={S.thCell}>Modelo</th>
                    <th style={S.thCell}>Grupo</th>
                    <th style={S.thCell}>Proveedor</th>
                    <th style={{ ...S.thCell, textAlign: 'right' }}>Costo</th>
                    <th style={{ ...S.thCell, textAlign: 'right' }}>PVP1</th>
                    <th style={{ ...S.thCell, textAlign: 'center' }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {prodFiltrados.map((p, i) => {
                    const sel = selectedIdx === i;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => agregarAlCarrito(p)}
                        onMouseEnter={e => { if (!sel) e.currentTarget.style.background = '#f5f8ff'; }}
                        onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'inherit'; }}
                        style={{ background: sel ? '#eef4ff' : 'inherit', cursor: 'pointer', borderLeft: sel ? '3px solid #3498db' : '3px solid transparent' }}
                        title="Clic para agregar al carrito"
                      >
                        <td style={{ ...S.tdCell(sel), color: '#6c757d', fontSize: 12 }}>{p.codigo || '—'}</td>
                        <td style={{ ...S.tdCell(sel), fontWeight: 600 }}>{p.nombre}</td>
                        <td style={{ ...S.tdCell(sel), color: '#6c757d', fontSize: 12 }}>{p.modelo || '—'}</td>
                        <td style={{ ...S.tdCell(sel), color: '#6c757d', fontSize: 12 }}>{p.grupo || '—'}</td>
                        <td style={{ ...S.tdCell(sel), color: '#6c757d', fontSize: 12 }}>{p.proveedor_nombre || '—'}</td>
                        <td style={{ ...S.tdCell(sel), textAlign: 'right', color: '#6c757d' }}>${parseFloat(p.costo || 0).toFixed(2)}</td>
                        <td style={{ ...S.tdCell(sel), textAlign: 'right', fontWeight: 700, color: '#2980b9' }}>${parseFloat(p.pvp1 || 0).toFixed(2)}</td>
                        <td style={{ ...S.tdCell(sel), textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: (p.stock ?? 0) > 0 ? '#27ae60' : '#e74c3c' }}>{p.stock ?? 0}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ════ PANEL DERECHO — CARRITO + PAGO ════ */}
        <div style={S.panelR}>

          {/* Cabecera carrito */}
          <div style={S.panelHead}>
            <span>Carrito de Compras</span>
            {carrito.length > 0 && <span style={S.badge('#3498db', '#fff')}>{carrito.length} item{carrito.length !== 1 ? 's' : ''}</span>}
          </div>

          {/* Botón agregar servicio */}
          <div style={{ padding: '7px 12px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', flexShrink: 0 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setMostrarServicio(v => !v)}
              style={{ width: '100%', justifyContent: 'center' }}>
              {mostrarServicio ? '✕ Cancelar' : '+ Agregar Servicio'}
            </button>
            {mostrarServicio && (
              <div style={{ marginTop: 7, display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                <div style={{ flex: 2 }}>
                  <label style={S.lbl}>Nombre</label>
                  <input value={formServicio.nombre} onChange={e => setFormServicio(p => ({ ...p, nombre: e.target.value }))}
                    style={S.input} placeholder="Ej: Revisión óptica" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.lbl}>Precio $</label>
                  <input type="number" min="0" step="0.01" value={formServicio.precio}
                    onChange={e => setFormServicio(p => ({ ...p, precio: e.target.value }))}
                    style={S.input} placeholder="0.00" />
                </div>
                <button className="btn btn-primary btn-sm" onClick={agregarServicio} style={{ flexShrink: 0 }}>Agregar</button>
              </div>
            )}
          </div>

          {/* Items del carrito — siempre flex:1 */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {carrito.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', color: '#aaa', fontSize: 13 }}>
                <span style={{ fontSize: 26 }}><ShoppingCart /></span>
                <p style={{ marginTop: 6 }}>Selecciona productos de la lista</p>
              </div>
            )}
            {carrito.map(item => (
              <div key={item.id} style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nombre}</div>
                  {item.esServicio
                    ? <div style={{ fontSize: 10, color: '#6c757d' }}>SERVICIO</div>
                    : item.stock !== null && (
                      <div style={{ fontSize: 10, fontWeight: 600, color: item.cantidad >= item.stock ? '#e74c3c' : '#6c757d' }}>
                        Stock: {item.stock}
                      </div>
                    )
                  }
                </div>
                {/* Precio: estático para productos, editable para servicios */}
                {item.esServicio ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: '#6c757d' }}>$</span>
                    <input
                      type="number" min="0" step="0.01"
                      value={item.precio}
                      onChange={e => setPrecioServicio(item.id, e.target.value)}
                      style={{ ...S.input, width: 72, padding: '4px 6px', fontSize: 13, fontWeight: 600 }}
                    />
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#6c757d', flexShrink: 0, minWidth: 52, textAlign: 'right' }}>
                    {FMT(item.precio)}
                  </div>
                )}
                {/* Cantidad */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                  <button onClick={() => cambiarCantidad(item.id, -1)}
                    style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #dee2e6', background: '#fff', cursor: 'pointer', fontSize: 15, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <input
                    type="number" min="1"
                    value={item.cantidad}
                    onChange={e => setCantidad(item.id, e.target.value)}
                    style={{ ...S.input, width: 38, padding: '3px', textAlign: 'center', fontSize: 13 }}
                  />
                  <button onClick={() => cambiarCantidad(item.id, +1)}
                    style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #dee2e6', background: '#fff', cursor: 'pointer', fontSize: 15, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
                {/* Subtotal */}
                <div style={{ width: 60, textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#2980b9', flexShrink: 0 }}>
                  {FMT(item.precio * item.cantidad)}
                </div>
                {/* Eliminar */}
                <button onClick={() => quitarDelCarrito(item.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c', padding: '1px 3px', flexShrink: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* ── TOTALES + PAGO ── */}
          <div style={{ borderTop: '2px solid #dee2e6', padding: '11px 12px', background: '#fff', flexShrink: 0 }}>

            {/* Subtotal + descuento */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: '#6c757d', textTransform: 'uppercase', fontWeight: 700 }}>SUBTOTAL BRUTO</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{FMT(subtotalBruto)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#6c757d', textTransform: 'uppercase' }}>DESCUENTO</span>
                <input
                  type="number" min="0" max="100" step="0.1"
                  value={descuentoPct}
                  onChange={e => setDescuentoPct(e.target.value)}
                  style={{ ...S.input, width: 65, textAlign: 'right', fontWeight: 700 }}
                />
                <span style={{ fontSize: 12, fontWeight: 700 }}>%</span>
                {descMonto > 0 && <span style={{ color: '#e74c3c', fontSize: 12, fontWeight: 600 }}>−{FMT(descMonto)}</span>}
              </div>
            </div>

            {/* Total grande */}
            <div style={{ background: 'linear-gradient(135deg, #2980b9, #3498db)', borderRadius: 9, padding: '10px 14px', marginBottom: 9, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>TOTAL A PAGAR</div>
              <div style={{ color: '#fff', fontSize: 22, fontWeight: 900 }}>{FMT(totalFinal)}</div>
            </div>

            {/* Método de pago */}
            <div style={{ marginBottom: 7 }}>
              <label style={S.lbl}>MÉTODO DE PAGO</label>
              <select value={metodoPago}
                onChange={e => { setMetodoPago(e.target.value); setReferenciaNum(''); }}
                style={S.input}>
                {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Fecha y hora personalizadas — solo Transferencia / Tarjeta */}
            {(metodoPago === 'Transferencia' || metodoPago === 'Tarjeta') && (() => {
              const hoy = new Date();
              const mm  = String(hoy.getMonth() + 1).padStart(2, '0');
              const yyyy = hoy.getFullYear();
              const minFecha = `${yyyy}-${mm}-01`;
              const ultimoDia = new Date(yyyy, hoy.getMonth() + 1, 0).getDate();
              const maxFecha = `${yyyy}-${mm}-${String(ultimoDia).padStart(2, '0')}`;
              return (
                <div style={{ marginBottom: 7, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                  <div>
                    <label style={S.lbl}>FECHA PAGO</label>
                    <input
                      type="date"
                      min={minFecha}
                      max={maxFecha}
                      value={fechaCustom}
                      onChange={e => setFechaCustom(e.target.value)}
                      style={S.input}
                    />
                  </div>
                  <div>
                    <label style={S.lbl}>HORA PAGO</label>
                    <input
                      type="time"
                      value={horaCustom}
                      onChange={e => setHoraCustom(e.target.value)}
                      style={S.input}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Referencia de pago — aparece y se activa según método */}
            <div style={{ marginBottom: 7 }}>
              <label style={{ ...S.lbl, color: refActiva ? '#495057' : '#aaa' }}>
                {refActiva ? refActiva.label.toUpperCase() : 'N° DE REFERENCIA'}
              </label>
              <input
                disabled={!refActiva}
                value={referenciaNum}
                onChange={e => setReferenciaNum(e.target.value)}
                placeholder={refActiva ? refActiva.placeholder : 'Solo para Transferencia / Tarjeta'}
                style={{ ...S.input, background: refActiva ? '#fff' : '#f8f9fa', color: refActiva ? '#212529' : '#aaa', cursor: refActiva ? 'text' : 'not-allowed' }}
              />
            </div>

            {/* Observación — textarea 3 líneas */}
            <div style={{ marginBottom: 7 }}>
              <label style={S.lbl}>OBSERVACIÓN</label>
              <textarea
                value={observacion}
                onChange={e => setObservacion(e.target.value)}
                rows={3}
                placeholder="Detalle opcional de la venta"
                style={{ ...S.input, resize: 'vertical', minHeight: 60, lineHeight: 1.4 }}
              />
            </div>

            {/* Crédito personal + monto + saldo */}
            <div style={{ border: `1px solid ${esCredito ? '#fbbf24' : '#dee2e6'}`, borderRadius: 8, padding: '9px 11px', marginBottom: 9, background: esCredito ? '#fffbeb' : '#f8f9fa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                <input type="checkbox" id="esCredito" checked={esCredito}
                  onChange={e => { setEsCredito(e.target.checked); if (!e.target.checked) setMontoRecibido(''); }}
                  style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#d97706' }}
                />
                <label htmlFor="esCredito" style={{ fontSize: 12, fontWeight: 700, color: esCredito ? '#d97706' : '#6c757d', cursor: 'pointer' }}>
                  Crédito Personal
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                <div>
                  <label style={S.lbl}>MONTO RECIBIDO</label>
                  <input type="number" min="0" step="0.01" value={montoRecibido}
                    onChange={e => setMontoRecibido(e.target.value)}
                    style={S.input} placeholder="0" />
                  {vuelto > 0 && <div style={{ fontSize: 11, color: '#27ae60', fontWeight: 600, marginTop: 2 }}>Vuelto: {FMT(vuelto)}</div>}
                </div>
                <div>
                  <label style={S.lbl}>SALDO PENDIENTE</label>
                  <div style={{ padding: '7px 10px', borderRadius: 6, border: `1px solid ${saldoPendiente > 0 ? '#fca5a5' : '#a7f3d0'}`, background: '#fff', fontSize: 14, fontWeight: 700, color: saldoPendiente > 0 ? '#e74c3c' : '#27ae60' }}>
                    {FMT(saldoPendiente)}
                  </div>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && <div className="alert alert-error" style={{ marginBottom: 8, padding: '7px 10px', fontSize: 12 }}>{error}</div>}

            {/* Botones */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => navigate('/facturas')} style={{ justifyContent: 'center' }}>
                ← Volver
              </button>
              <button className="btn btn-primary" onClick={handleGuardar}
                disabled={saving || carrito.length === 0}
                style={{ justifyContent: 'center', fontWeight: 700 }}>
                {saving ? (
                  <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Guardando...</>
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
        </div>
      </div>

      {/* ════ MODAL TIPO DE VENTA ════ */}
      {modalTipo && (
        <div onClick={() => setModalTipo(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 14, padding: 28, width: 420, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Selecciona el tipo de factura</h3>
              <button onClick={() => setModalTipo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#aaa' }}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: '#6c757d', marginBottom: 18 }}>¿A quién va destinada esta venta?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <button disabled={!clienteSel} onClick={() => guardar(false)}
                style={{ padding: '16px 12px', borderRadius: 12, border: `2px solid ${clienteSel ? '#3498db' : '#dee2e6'}`, background: clienteSel ? '#eef4ff' : '#f8f9fa', cursor: clienteSel ? 'pointer' : 'not-allowed', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, opacity: clienteSel ? 1 : 0.5 }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={clienteSel ? '#3498db' : '#aaa'} strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <div style={{ fontWeight: 700, fontSize: 13, color: clienteSel ? '#2c3e50' : '#aaa' }}>Con datos del cliente</div>
                <div style={{ fontSize: 11, color: clienteSel ? '#3498db' : '#aaa' }}>
                  {clienteSel ? `${clienteSel.nombres} ${clienteSel.apellidos}` : 'Selecciona un cliente primero'}
                </div>
              </button>
              <button onClick={() => guardar(true)}
                style={{ padding: '16px 12px', borderRadius: 12, border: '2px solid #27ae60', background: '#f0fff4', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#2c3e50' }}>Consumidor Final</div>
                <div style={{ fontSize: 11, color: '#27ae60' }}>Sin datos de cliente</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL CREAR CLIENTE ════ */}
      <ClienteFormModal
        abierto={modalCliente}
        editando={null}
        clienteInicial={null}
        onCerrar={() => setModalCliente(false)}
        onGuardado={() => {
          setModalCliente(false);
          if (buscarCliente.trim().length >= 2) buscarClientesFn(buscarCliente);
        }}
      />

      {/* ════ MODAL HISTORIAL CLÍNICO ════ */}
      <HistorialListModal
        abierto={modalHistorial}
        cliente={clienteSel}
        onCerrar={() => setModalHistorial(false)}
        onSeleccionar={h => setHistorialSel(h)}
      />

      {/* ════ MODAL ÉXITO VENTA ════ */}
      {ventaCreada && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '36px 32px', width: 440, maxWidth: '95vw', boxShadow: '0 24px 70px rgba(0,0,0,0.3)', textAlign: 'center' }}>

            {/* Icono éxito */}
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>¡Factura Registrada!</h2>
            <p style={{ fontSize: 14, color: '#6c757d', marginBottom: 6 }}>
              La venta <strong style={{ color: '#2c3e50' }}>
                #{ventaCreada.venta.id_personalizado || ventaCreada.venta.id || ''}
              </strong> se ha registrado correctamente.
            </p>
            {ventaCreada.venta.saldo_pendiente > 0 && (
              <div style={{ display: 'inline-block', background: '#fef3c7', color: '#d97706', borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Saldo pendiente: ${Number(ventaCreada.venta.saldo_pendiente).toFixed(2)}
              </div>
            )}

            <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                className="btn btn-primary"
                style={{ justifyContent: 'center', background: '#10b981', border: 'none', fontWeight: 700 }}
                onClick={() => navigate('/ventas')}
              >
                ✓ Finalizar
              </button>
              <button
                className="btn"
                style={{ justifyContent: 'center', background: '#3498db', color: '#fff', border: 'none', fontWeight: 600 }}
                onClick={() => imprimirTicketVenta({ venta: ventaCreada.venta, items: ventaCreada.items })}
              >
                🖨 Reimprimir Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
