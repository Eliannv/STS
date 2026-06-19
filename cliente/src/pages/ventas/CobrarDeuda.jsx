import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { imprimirTicketAbono } from '../../utils/ticketVenta';
import { Search, ReceiptText, ChevronDown } from 'lucide-react';

const HORA = () => new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta'];
const REF_META = {
  Transferencia: { label: 'Código de Transferencia', placeholder: 'Ej: TRF-20260615-001' },
  Tarjeta: { label: 'Últimos 4 dígitos de tarjeta', placeholder: 'XXXX' },
};

const FMT = v => `$${parseFloat(v || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;
const FECHAFMT = s => {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function CobrarDeuda() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // State
  const [horaActual, setHoraActual] = useState(HORA());
  const [deudas, setDeudas] = useState([]);
  const [totalDeudas, setTotalDeudas] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [cargandoDeudas, setCargandoDeudas] = useState(false);
  const [filtroDeuda, setFiltroDeuda] = useState('');
  const [deudaIdx, setDeudaIdx] = useState(null);
  const [abono, setAbono] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [referencia, setReferencia] = useState('');
  const [fechaCustom, setFechaCustom] = useState('');
  const [horaCustom, setHoraCustom] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const ITEMS_POR_PAGINA = 5;

  // Effects
  useEffect(() => {
    const t = setInterval(() => setHoraActual(HORA()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    cargarDeudas(0);
  }, []);

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
    setReferencia('');
  }, [metodoPago]);

  // Functions
  async function cargarDeudas(numeroPagea) {
    setCargandoDeudas(true);
    const r = await api.get(`/cobro-deuda/deudas-pagina?pagina=${numeroPagea}&limite=${ITEMS_POR_PAGINA}`);
    if (r.ok) {
      if (numeroPagea === 0) {
        setDeudas(r.data.resultado || []);
      } else {
        setDeudas(prev => [...prev, ...(r.data.resultado || [])]);
      }
      setTotalDeudas(r.data.total || 0);
      setPagina(numeroPagea);
    }
    setCargandoDeudas(false);
  }

  function cargarMasDeudas() {
    cargarDeudas(pagina + 1);
  }

  function handleSelectDeuda(index) {
    setDeudaIdx(index);
    setAbono('');
    setError('');
  }

  function handleAbonoChange(e) {
    setAbono(e.target.value);
    setError('');
  }

  function handleReferenciaChange(e) {
    setReferencia(e.target.value);
  }

  function handleFechaChange(e) {
    setFechaCustom(e.target.value);
  }

  function handleHoraChange(e) {
    setHoraCustom(e.target.value);
  }

  function handleMetodoPagoChange(e) {
    setMetodoPago(e.target.value);
  }

  function handleKeyPressAbono(e) {
    if (e.key === 'Enter') {
      handleCobrar();
    }
  }

  async function handleCobrar() {
    if (!deudaSel) { setError('Selecciona una deuda'); return; }
    if (abonoNum <= 0) { setError('El monto del abono debe ser mayor a $0'); return; }
    if (abonoNum > saldoActual) { setError(`Monto excede el saldo pendiente de ${FMT(saldoActual)}`); return; }
    
    setSaving(true);
    setError('');

    let fechaPagoISO = null;
    if ((metodoPago === 'Transferencia' || metodoPago === 'Tarjeta') && fechaCustom) {
      fechaPagoISO = `${fechaCustom}T${horaCustom || '00:00'}:00`;
    }

    const obsPartes = [];
    if (referencia.trim()) obsPartes.push(`Ref: ${referencia.trim()}`);
    if (vuelto > 0) obsPartes.push(`Vuelto: ${FMT(vuelto)}`);
    const obsExtra = obsPartes.join(' | ') || null;

    const res = await api.post('/cobro-deuda/registrar-abono', {
      facturaId: deudaSel.id,
      montoPagado: abonoNum,
      metodoPago: metodoPago,
      fechaPago: fechaPagoISO || new Date().toISOString(),
      observacion: obsExtra,
      saldoAnterior: saldoActual,
      saldoNuevo: Math.max(0, saldoActual - abonoNum)
    });

    setSaving(false);
    if (res.ok) {
      imprimirTicketAbono({
        factura: deudaSel,
        abono: abonoNum,
        saldoAnterior: saldoActual,
        saldoNuevo: Math.max(0, saldoActual - abonoNum),
        cliente: cliente,
        metodoPago: metodoPago,
        referencia: referencia,
        vuelto: vuelto,
        fechaPago: fechaPagoISO || new Date().toISOString(),
      });

      setDeudas(deudas.map(d => 
        d.id === deudaSel.id 
          ? { ...d, saldo_pendiente: saldoNuevo, estado_pago: saldoNuevo <= 0.01 ? 'PAGADA' : 'PENDIENTE' }
          : d
      ));
      
      setAbono('');
      setReferencia('');
      setError('');
      setDeudaIdx(null);
    } else {
      setError(res.data?.resultado || 'Error al registrar el abono');
    }
  }

  // Computed
  const deudasFiltradas = filtroDeuda.trim()
    ? deudas.filter(d =>
        (d.id_personalizado || '').toLowerCase().includes(filtroDeuda.toLowerCase()) ||
        (d.cliente_nombre || '').toLowerCase().includes(filtroDeuda.toLowerCase()) ||
        String(d.id).includes(filtroDeuda)
      )
    : deudas;

  const deudaSel = deudaIdx !== null ? deudasFiltradas[deudaIdx] : null;
  const cliente = deudaSel ? { nombres: deudaSel.cliente_nombres, apellidos: deudaSel.cliente_apellidos, telefono: deudaSel.cliente_telefono, email: deudaSel.cliente_email, id: deudaSel.cliente_id } : null;
  
  const saldoActual = parseFloat(deudaSel?.saldo_pendiente || 0);
  const abonoNum = Math.min(parseFloat(abono) || 0, saldoActual);
  const saldoNuevo = Math.max(0, parseFloat((saldoActual - abonoNum).toFixed(2)));
  const vuelto = (parseFloat(abono) || 0) > saldoActual ? parseFloat(((parseFloat(abono) || 0) - saldoActual).toFixed(2)) : 0;
  const deudaTotal = deudas.reduce((s, d) => s + parseFloat(d.saldo_pendiente || 0), 0);
  const refActiva = REF_META[metodoPago];

  // Render
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f4f6fa', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #dee2e6', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Cobro de Deuda</h1>
          <div style={{ fontSize: 11, color: '#6c757d', marginTop: 2 }}>{FECHAFMT(new Date().toISOString())}</div>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Volver</button>
      </div>

      {/* Info Bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #dee2e6', padding: '7px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
          <span style={{ fontWeight: 600 }}>Deudas Pendientes:</span>
          <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#fff3cd', color: '#856404' }}>{totalDeudas} ({deudasFiltradas.length})</span>
          <span>|</span>
          <span style={{ fontWeight: 600 }}>Total Deuda:</span>
          <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#e8f5e9', color: '#2e7d32' }}>{FMT(deudaTotal)}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 440px', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Left Panel - Deudas List */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #dee2e6', background: '#fafafa' }}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0, background: '#fff' }}>
            <span>Deudas a Cobrar</span>
            <input
              type="text"
              placeholder="Buscar..."
              value={filtroDeuda}
              onChange={e => setFiltroDeuda(e.target.value)}
              style={{ flex: 1, margin: 0, padding: '4px 6px', fontSize: 12, border: '1px solid #ced4da', borderRadius: 6, outline: 'none', marginLeft: 8 }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {cargandoDeudas && deudas.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#6c757d' }}>Cargando deudas...</div>
            ) : deudasFiltradas.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#6c757d' }}>Sin deudas pendientes</div>
            ) : (
              <>
                {deudasFiltradas.map((d, i) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelectDeuda(i)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      background: deudaIdx === i ? '#eef4ff' : 'none',
                      border: 'none',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderLeft: deudaIdx === i ? '3px solid #3498db' : '3px solid transparent',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>#{d.id_personalizado || d.id}</div>
                      <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{d.cliente_nombre}</div>
                      <div style={{ fontSize: 10, color: '#999', marginTop: 1 }}>{FECHAFMT(d.fecha)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#d9534f', fontSize: 12 }}>{FMT(d.saldo_pendiente)}</div>
                      <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>Total: {FMT(d.total)}</div>
                    </div>
                  </button>
                ))}

                {(pagina + 1) * ITEMS_POR_PAGINA < totalDeudas && (
                  <div style={{ padding: 12, textAlign: 'center', borderTop: '1px solid #f0f0f0' }}>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={cargarMasDeudas}
                      disabled={cargandoDeudas}
                      style={{ width: '100%', fontSize: 12 }}
                    >
                      {cargandoDeudas ? 'Cargando...' : 'Cargar más deudas'}
                      <ChevronDown size={14} style={{ marginLeft: 6 }} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Panel - Payment Form */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0, background: '#fff' }}>
            <span>Registrar Abono</span>
            {deudaSel && <span style={{ fontSize: 11, color: '#999' }}>#{deudaSel.id_personalizado || deudaSel.id}</span>}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
            {!deudaSel ? (
              <div style={{ textAlign: 'center', color: '#6c757d', paddingTop: 40 }}>
                <Search size={32} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                <div>Selecciona una deuda para continuar</div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3, display: 'block' }}>Cliente</label>
                  <div style={{ fontSize: 13, padding: '7px 10px', background: '#f8f9fa', borderRadius: 6 }}>
                    <strong>{deudaSel.cliente_nombre}</strong>
                    {deudaSel.cliente_telefono && <div style={{ fontSize: 11, color: '#6c757d', marginTop: 2 }}>{deudaSel.cliente_telefono}</div>}
                  </div>
                </div>

                <div style={{ marginBottom: 16, padding: 12, background: '#e8f4f8', borderRadius: 6, borderLeft: '3px solid #3498db' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: 13 }}>
                    <span>Saldo Anterior</span>
                    <strong style={{ color: '#555' }}>{FMT(saldoActual + abonoNum)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: 13, marginTop: 8 }}>
                    <span>Monto a Pagar</span>
                    <strong style={{ color: '#2ecc71' }}>{FMT(abonoNum)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: 13, marginTop: 8, paddingTop: 8, borderTop: '1px solid #b3d9e8' }}>
                    <span>Saldo Nuevo</span>
                    <strong style={{ color: saldoNuevo === 0 ? '#27ae60' : '#f39c12', fontSize: 14 }}>{FMT(saldoNuevo)}</strong>
                  </div>
                  {vuelto > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: 13, marginTop: 8, color: '#d9534f' }}>
                      <span>Vuelto</span>
                      <strong>{FMT(vuelto)}</strong>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3, display: 'block' }}>Método de Pago</label>
                  <select
                    value={metodoPago}
                    onChange={handleMetodoPagoChange}
                    style={{ padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 6, fontSize: 13, width: '100%', background: '#fff', outline: 'none', fontFamily: 'inherit' }}
                  >
                    {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3, display: 'block' }}>Monto a Pagar</label>
                  <input
                    type="number"
                    step="0.01"
                    value={abono}
                    onChange={handleAbonoChange}
                    onKeyDown={handleKeyPressAbono}
                    placeholder={`Hasta ${FMT(saldoActual)}`}
                    style={{ padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 6, fontSize: 13, width: '100%', background: '#fff', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>

                {refActiva && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3, display: 'block' }}>{refActiva.label}</label>
                    <input
                      type="text"
                      value={referencia}
                      onChange={handleReferenciaChange}
                      placeholder={refActiva.placeholder}
                      style={{ padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 6, fontSize: 13, width: '100%', background: '#fff', outline: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                )}

                {(metodoPago === 'Transferencia' || metodoPago === 'Tarjeta') && (
                  <>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3, display: 'block' }}>Fecha</label>
                      <input
                        type="date"
                        value={fechaCustom}
                        onChange={handleFechaChange}
                        style={{ padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 6, fontSize: 13, width: '100%', background: '#fff', outline: 'none', fontFamily: 'inherit' }}
                      />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3, display: 'block' }}>Hora</label>
                      <input
                        type="time"
                        value={horaCustom}
                        onChange={handleHoraChange}
                        style={{ padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 6, fontSize: 13, width: '100%', background: '#fff', outline: 'none', fontFamily: 'inherit' }}
                      />
                    </div>
                  </>
                )}

                {error && (
                  <div style={{ padding: 10, background: '#f8d7da', color: '#721c24', borderRadius: 6, fontSize: 12, marginBottom: 12 }}>
                    {error}
                  </div>
                )}

                <button
                  onClick={handleCobrar}
                  disabled={saving || !deudaSel || abonoNum <= 0}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: saving ? '#ddd' : '#27ae60',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <ReceiptText size={16} />
                  {saving ? 'Procesando...' : 'Registrar Abono'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
