import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { generarHTMLTicket, imprimirTicketFactura } from '../../utils/ticketVenta';
import HistorialListModal from '../../components/historial/HistorialListModal';
import Swal from 'sweetalert2';

/* ─────────── helpers ─────────── */
const FMT  = v => `$${parseFloat(v || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;
const FECHA = s => {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const ESTADO_META = {
  PAGADA:    { bg: '#d4edda', color: '#155724', label: 'Pagada'    },
  PENDIENTE: { bg: '#fff3cd', color: '#856404', label: 'Pendiente' },
  ANULADA:   { bg: '#f8d7da', color: '#721c24', label: 'Anulada'   },
};
const TIPO_META = {
  CONTADO:     { bg: '#e3f0ff', color: '#1a56db', label: 'Contado'     },
  CREDITO:     { bg: '#f3e8ff', color: '#7c3aed', label: 'Crédito'     },
  COBRO_DEUDA: { bg: '#fff3cd', color: '#856404', label: 'Cobro deuda' },
};

/* ─────────── estilos ─────────── */
const S = {
  page:   { display: 'flex', flexDirection: 'column', height: '100%', background: '#f4f6fa', overflow: 'hidden' },
  header: { background: '#fff', borderBottom: '1px solid #dee2e6', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 },
  body:   { display: 'grid', gridTemplateColumns: '1fr 320px', flex: 1, overflow: 'hidden', minHeight: 0 },
  left:   { overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 },
  right:  { borderLeft: '1px solid #dee2e6', display: 'flex', flexDirection: 'column', background: '#f0f2f5', overflow: 'hidden' },
  card:   { background: '#fff', border: '1px solid #e9ecef', borderRadius: 10, padding: '12px 15px' },
  cardH:  { fontSize: 11, fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, borderBottom: '1px solid #f0f0f0', paddingBottom: 7 },
  kv:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: 13, borderBottom: '1px solid #f8f9fa' },
  badge:  (bg, color) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: bg, color }),
};

/* ─────────── mapeo factura → formato venta ─────────── */
function facturaAVenta(f) {
  return {
    id_personalizado: f.id_personalizado,
    numero_factura:   f.numero_factura,
    id:               f.id,
    nombre_cliente:   f.cliente_nombre,
    metodo_pago:      f.metodo_pago,
    subtotal:         f.subtotal,
    descuento:        f.descuento,
    total:            f.total,
    saldo_pendiente:  f.saldo_pendiente,
    created_at:       f.fecha_pago || f.created_at,
    tipo:             f.tipo,
  };
}

/* ─────────── iframe auto-height ─────────── */
function TicketPreview({ html }) {
  const ref = useRef(null);
  function onLoad() {
    if (!ref.current) return;
    try {
      const h = ref.current.contentWindow.document.body.scrollHeight;
      ref.current.style.height = (h + 10) + 'px';
    } catch (_) {}
  }
  return (
    <iframe
      ref={ref}
      srcDoc={html}
      title="Vista previa ticket"
      onLoad={onLoad}
      style={{ width: '100%', border: 'none', display: 'block', minHeight: 80 }}
      sandbox="allow-same-origin"
    />
  );
}

/* ─────────── componente principal ─────────── */
export default function VerFactura() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [factura,        setFactura]        = useState(null);
  const [historial,      setHistorial]      = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [modalHistorial, setModalHistorial] = useState(false);

  useEffect(() => {
    api.get(`/factura/buscar/${id}`).then(async r => {
      if (!r.ok) { setError(r.data?.resultado || 'No se encontró la factura'); setLoading(false); return; }
      const f = r.data.resultado;
      setFactura(f);
      if (f.historial_clinico_id) {
        const rh = await api.get(`/historial-clinico/buscar/${f.historial_clinico_id}`);
        if (rh.ok && rh.data?.resultado) setHistorial(rh.data.resultado);
      }
      setLoading(false);
    });
  }, [id]);

  const [anulando, setAnulando] = useState(false);

  async function anularFactura() {
  const confirm = await Swal.fire({
    title: "Anular factura",
    html: `¿Anular la factura <strong>${factura.id_personalizado || '#' + factura.id}</strong>?<br><br>Esto marcará la factura como <strong>ANULADA</strong> y restaurará el stock de los productos.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, anular",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#d33",
    reverseButtons: true,
  });

  if (!confirm.isConfirmed) return;

  setAnulando(true);
  const r = await api.put(`/factura/anular/${factura.id}`);

  if (r.ok) {
    setFactura(prev => ({ ...prev, estado: 'ANULADA', saldo_pendiente: 0 }));
    Swal.fire({
      title: "Factura anulada",
      text: "El stock de los productos fue restaurado correctamente.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
    });
  } else {
    Swal.fire({
      title: "No se pudo anular",
      text: r.data?.resultado || "Error al anular la factura",
      icon: "error",
      timer: 3000,
      toast: true,
        position: 'top-end',
      showConfirmButton: false
    });
  }
  setAnulando(false);
}

  function reimprimir() {
    if (!factura) return;
    const items = mapItems(factura.items);
    imprimirTicketFactura({ factura, items });
  }

  function mapItems(raw = []) {
    return (raw || []).map(it => ({
      codigo:          it.idInterno || it.codigo || '—',
      nombre:          it.nombre    || it.nombreProducto || '—',
      cantidad:        it.cantidad  || 1,
      precio_unitario: parseFloat(it.precio_unitario ?? it.precioUnitario ?? it.pvp1 ?? 0),
      precio_total:    parseFloat(it.precio_total ?? it.precioTotal ??
        (parseFloat(it.precio_unitario ?? it.precioUnitario ?? it.pvp1 ?? 0) * parseInt(it.cantidad || 1))),
    }));
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div className="spinner" />
    </div>
  );

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ color: '#e74c3c', fontSize: 16, marginBottom: 16 }}>{error}</p>
      <button className="btn btn-ghost" onClick={() => navigate('/facturas')}>Volver a Facturas</button>
    </div>
  );

  const est     = ESTADO_META[factura.estado] || ESTADO_META.PENDIENTE;
  const tipo    = TIPO_META[factura.tipo]     || TIPO_META.CONTADO;
  const abonado = parseFloat(factura.abonado         || 0);
  const saldo   = parseFloat(factura.saldo_pendiente || 0);
  const items   = mapItems(factura.items);

  // HTML del ticket — misma función que el botón Reimprimir
  const ticketHTML    = generarHTMLTicket({ venta: facturaAVenta(factura), items });
  const clienteModal  = { id: factura.cliente_id, nombres: factura.cliente_nombre, apellidos: '' };

  /* ══════════════════════ RENDER ══════════════════════ */
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
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            Factura {factura.id_personalizado || `#${factura.id}`}
            <span style={S.badge(est.bg, est.color)}>{est.label}</span>
            <span style={S.badge(tipo.bg, tipo.color)}>{tipo.label}</span>
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/clientes/${factura.cliente_id}/ficha`)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Ver cliente
          </button>
          {factura.estado !== 'ANULADA' && isAdmin && (
            <button
              className="btn btn-sm"
              style={{ background: '#dc3545', color: '#fff', border: 'none' }}
              onClick={anularFactura}
              disabled={anulando}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {anulando ? 'Anulando...' : 'Anular'}
            </button>
          )}
          
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={S.body}>

        {/* ════ COLUMNA IZQUIERDA ════ */}
        <div style={S.left}>

          {/* Alerta saldo pendiente */}
          {saldo > 0 && (
            <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 9, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#856404" strokeWidth="2">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div>
                <strong style={{ fontSize: 13, color: '#856404' }}>Crédito pendiente: {FMT(saldo)}</strong>
                <div style={{ fontSize: 11, color: '#856404' }}>Esta factura tiene un saldo sin cancelar.</div>
              </div>
              <button className="btn btn-sm" style={{ marginLeft: 'auto', background: '#ffc107', color: '#000', border: 'none', fontWeight: 700 }}
                onClick={() => navigate(`/facturas/cobrar?clienteId=${factura.cliente_id}`)}>
                Cobrar
              </button>
            </div>
          )}

          {/* Información general */}
          <div style={S.card}>
            <div style={S.cardH}>Información General</div>
            <div style={S.kv}>
              <span style={{ color: '#6c757d' }}>ID personalizado</span>
              <code style={{ background: '#f0f4ff', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                {factura.id_personalizado || `#${factura.id}`}
              </code>
            </div>
            {factura.numero_factura && (
              <div style={S.kv}><span style={{ color: '#6c757d' }}>N° Factura</span><span>{factura.numero_factura}</span></div>
            )}
            <div style={S.kv}>
              <span style={{ color: '#6c757d' }}>Cliente</span>
              <button onClick={() => navigate(`/clientes/${factura.cliente_id}/ficha`)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a56db', fontWeight: 600, fontSize: 13, padding: 0 }}>
                {factura.cliente_nombre || '—'}
              </button>
            </div>
            <div style={S.kv}><span style={{ color: '#6c757d' }}>Método de pago</span><span style={{ fontWeight: 600 }}>{factura.metodo_pago || '—'}</span></div>
            <div style={S.kv}><span style={{ color: '#6c757d' }}>Fecha emisión</span><span>{FECHA(factura.created_at)}</span></div>
            {factura.fecha_pago && (
              <div style={S.kv}><span style={{ color: '#6c757d' }}>Fecha pago</span><span>{FECHA(factura.fecha_pago)}</span></div>
            )}
            {factura.usuario_nombre && (
              <div style={S.kv}><span style={{ color: '#6c757d' }}>Registrado por</span><span>{factura.usuario_nombre}</span></div>
            )}
            {factura.cliente_nombre !== 'Consumidor Final' && (
              <div style={S.kv}>
                <span style={{ color: '#6c757d' }}>Historial clínico</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {factura.historial_clinico_id
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <code style={{ background: '#e8f5e9', color: '#2e7d32', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>#{factura.historial_clinico_id}</code>
                        {historial?.created_at && <span style={{ fontSize: 11, color: '#6c757d' }}>{FECHA(historial.created_at)}</span>}
                      </span>
                    : <span style={{ color: '#adb5bd', fontSize: 12 }}>Sin vincular</span>
                  }
                  <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => setModalHistorial(true)}>
                    Ver historiales
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Resumen financiero */}
          <div style={S.card}>
            <div style={S.cardH}>Resumen Financiero</div>
            {parseFloat(factura.subtotal || 0) !== parseFloat(factura.total || 0) && (
              <div style={S.kv}><span style={{ color: '#6c757d' }}>Subtotal</span><span>{FMT(factura.subtotal)}</span></div>
            )}
            {parseFloat(factura.descuento || 0) > 0 && (
              <div style={S.kv}><span style={{ color: '#6c757d' }}>Descuento</span><span style={{ color: '#e74c3c' }}>-{FMT(factura.descuento)}</span></div>
            )}
            <div style={{ ...S.kv, fontWeight: 700, fontSize: 15, padding: '8px 0', borderBottom: 'none' }}>
              <span>Total</span><span>{FMT(factura.total)}</span>
            </div>
            {abonado > 0 && (
              <div style={S.kv}><span style={{ color: '#27ae60' }}>Abonado</span><span style={{ color: '#27ae60', fontWeight: 600 }}>{FMT(abonado)}</span></div>
            )}
            {saldo > 0 && (
              <div style={{ ...S.kv, color: '#e74c3c', fontWeight: 700, fontSize: 14, paddingTop: 8, borderTop: '1px solid #fde8e8' }}>
                <span>Saldo pendiente</span><span>{FMT(saldo)}</span>
              </div>
            )}
            {saldo <= 0 && abonado > 0 && (
              <div style={{ textAlign: 'center', paddingTop: 8, color: '#27ae60', fontWeight: 700, fontSize: 13 }}>
                ✓ Deuda cancelada
              </div>
            )}
          </div>

          {/* Productos comprados */}
          <div style={S.card}>
            <div style={S.cardH}>Productos Comprados</div>
            {items.length === 0 ? (
              <p style={{ fontSize: 12, color: '#adb5bd', textAlign: 'center', padding: '12px 0', margin: 0 }}>
                Sin detalle de productos (facturas antiguas)
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#495057', fontSize: 11, borderBottom: '1px solid #dee2e6' }}>Código</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#495057', fontSize: 11, borderBottom: '1px solid #dee2e6' }}>Nombre</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, color: '#495057', fontSize: 11, borderBottom: '1px solid #dee2e6' }}>Cant.</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#495057', fontSize: 11, borderBottom: '1px solid #dee2e6' }}>P.Unit</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#495057', fontSize: 11, borderBottom: '1px solid #dee2e6' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '5px 8px', color: '#6c757d', fontSize: 11 }}>{it.codigo}</td>
                      <td style={{ padding: '5px 8px' }}>{it.nombre}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'center' }}>{it.cantidad}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>{FMT(it.precio_unitario)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600 }}>{FMT(it.precio_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ════ COLUMNA DERECHA — TICKET PREVIEW ════ */}
        <div style={S.right}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid #dee2e6', fontWeight: 700, fontSize: 13, background: '#fff', flexShrink: 0 }}>
            Vista previa del ticket
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            <div style={{ background: '#fff', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.10)', overflow: 'hidden' }}>
              <TicketPreview html={ticketHTML} />
            </div>
          </div>
          <div style={{ padding: '10px 14px', borderTop: '1px solid #dee2e6', background: '#fff', flexShrink: 0 }}>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }} onClick={reimprimir}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Reimprimir ticket
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL HISTORIALES ── */}
      <HistorialListModal
        abierto={modalHistorial}
        cliente={clienteModal}
        onCerrar={() => setModalHistorial(false)}
        soloLectura
      />
    </div>
  );
}
