// cliente/src/pages/ventas/VerVentaTarjeta.jsx
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { api } from '../../api/api';
import FormModal from '../../components/common/FormModal';

const FMT = (valor) => `$${Number(valor || 0).toLocaleString('es-EC', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const FECHAFMT = (fecha) => {
  if (!fecha) return '—';
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime())
    ? fecha
    : valor.toLocaleString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
};

const ESTADO_BADGE = {
  PENDIENTE: { bg: '#fff3cd', color: '#856404', label: 'Pendiente' },
  PROCESANDO: { bg: '#dbeafe', color: '#1d4ed8', label: 'Procesando' },
  PARCIALMENTE_ACREDITADA: {
    bg: '#ffedd5',
    color: '#c2410c',
    label: 'Acreditación parcial',
  },
  ACREDITADA: { bg: '#d4edda', color: '#155724', label: 'Acreditada' },
  RECHAZADA: { bg: '#fee2e2', color: '#b91c1c', label: 'Rechazada' },
  ANULADA: { bg: '#e5e7eb', color: '#4b5563', label: 'Anulada' },
  LEGACY_LIQUIDADA: {
    bg: '#e0e7ff',
    color: '#4338ca',
    label: 'Liquidada histórica',
  },
};

const ESTADO_ABONO_BADGE = {
  PENDIENTE: { bg: '#fff3cd', color: '#856404', label: 'Pendiente' },
  APLICADO: { bg: '#d4edda', color: '#155724', label: 'Aplicado' },
  ERROR: { bg: '#fee2e2', color: '#b91c1c', label: 'Error' },
  REVERTIDO: { bg: '#e5e7eb', color: '#4b5563', label: 'Revertido' },
};

const BADGE = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 600,
};

const cardStyle = {
  background: '#fff',
  border: '1px solid #e9ecef',
  borderRadius: 10,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const infoRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  padding: '8px 0',
  borderBottom: '1px solid #f1f5f9',
  fontSize: 13,
};

const inputStyle = {
  width: '100%',
  padding: '7px 10px',
  border: '1px solid var(--border-color)',
  borderRadius: 7,
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const estadoFormularioInicial = {
  montoBruto: '',
  comision: '0',
  retencion: '0',
  banco: '',
  numeroLote: '',
  numeroAutorizacion: '',
  voucher: '',
  fechaAcreditacion: new Date().toISOString().slice(0, 10),
  observacion: '',
};

export default function VerVentaTarjeta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venta, setVenta] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cajaBanco, setCajaBanco] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [formulario, setFormulario] = useState(estadoFormularioInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cargarVenta = useCallback(async () => {
    const respuesta = await api.get(`/venta-tarjeta/${id}`);
    if (!respuesta.ok) {
      throw new Error(
        respuesta.data.resultado
        || respuesta.data.mensaje
        || 'Error al cargar venta',
      );
    }
    setVenta(respuesta.data.resultado);
  }, [id]);

  const cargarHistorial = useCallback(async () => {
    const respuesta = await api.get(`/venta-tarjeta/${id}/historial`);
    if (respuesta.ok) {
      const resultado = respuesta.data.resultado || [];
      setHistorial(Array.isArray(resultado) ? resultado : []);
    }
  }, [id]);

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      await Promise.all([cargarVenta(), cargarHistorial()]);
    } catch (cargaError) {
      await Swal.fire('Error', cargaError.message, 'error');
      navigate('/ventas/venta-tarjeta');
    } finally {
      setCargando(false);
    }
  }, [cargarHistorial, cargarVenta, navigate]);

  async function abrirModal() {
    setError('');
    try {
      const respuesta = await api.get('/caja-banco/abierta');
      const caja = respuesta.ok ? respuesta.data.resultado : null;
      if (!caja?.id) {
        throw new Error('Debe existir una Caja Banco abierta para registrar la acreditación');
      }
      setCajaBanco(caja);
      setFormulario({
        ...estadoFormularioInicial,
        montoBruto: String(venta.saldo_pendiente || ''),
        banco: venta.banco || '',
        fechaAcreditacion: new Date().toISOString().slice(0, 10),
      });
      setMostrarModal(true);
    } catch (cajaError) {
      Swal.fire('Caja Banco requerida', cajaError.message, 'warning');
    }
  }

  function actualizarCampo(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const montoBruto = Number(formulario.montoBruto);
    const comision = Number(formulario.comision || 0);
    const retencion = Number(formulario.retencion || 0);
    const saldoPendiente = Number(venta.saldo_pendiente || 0);

    if (!(montoBruto > 0)) {
      setError('El monto bruto debe ser mayor a 0');
      return;
    }
    if (comision < 0 || retencion < 0) {
      setError('La comisión y la retención no pueden ser negativas');
      return;
    }
    if (montoBruto < comision + retencion) {
      setError('El monto bruto debe cubrir la comisión y la retención');
      return;
    }
    if (montoBruto > saldoPendiente) {
      setError(`El monto bruto no puede exceder el saldo pendiente de ${FMT(saldoPendiente)}`);
      return;
    }
    if (!formulario.banco.trim()) {
      setError('El banco es requerido');
      return;
    }
    if (!formulario.fechaAcreditacion) {
      setError('La fecha de acreditación es requerida');
      return;
    }
    if (!cajaBanco?.id) {
      setError('No se pudo preparar la operación financiera');
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await api.post(
        `/venta-tarjeta/${venta.id}/acreditaciones`,
        {
          monto_bruto: montoBruto,
          comision,
          retencion,
          banco: formulario.banco.trim(),
          numero_lote: formulario.numeroLote.trim() || null,
          numero_autorizacion:
            formulario.numeroAutorizacion.trim() || null,
          voucher: formulario.voucher.trim() || null,
          fecha_acreditacion: formulario.fechaAcreditacion,
          cuenta_banco_id: cajaBanco.id,
          observacion: formulario.observacion.trim() || null,
        },
      );
      if (!respuesta.ok) {
        throw new Error(
          respuesta.data.resultado
          || respuesta.data.mensaje
          || 'Error al registrar la acreditación',
        );
      }

      setMostrarModal(false);
      await Promise.all([cargarVenta(), cargarHistorial()]);
      const procesamiento =
        respuesta.data.resultado?.procesamientoCaja
        ?? respuesta.data.resultado?.procesamiento_caja;
      await Swal.fire(
        'Acreditación registrada',
        procesamiento === 'PENDIENTE'
          ? 'La acreditación quedó pendiente de sincronización con Caja Banco.'
          : 'Los movimientos financieros fueron aplicados en Caja Banco.',
        'success',
      );
    } catch (registroError) {
      setError(registroError.message || 'Error al registrar la acreditación');
    } finally {
      setGuardando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

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

  const montoTotal = Number(venta.monto_total || 0);
  const montoBrutoAcreditado = Number(venta.monto_bruto_acreditado || 0);
  const progreso = montoTotal > 0 ? (montoBrutoAcreditado / montoTotal) * 100 : 0;
  const montoNetoFormulario =
    Number(formulario.montoBruto || 0)
    - Number(formulario.comision || 0)
    - Number(formulario.retencion || 0);
  const puedeAcreditar = ![
    'ACREDITADA',
    'ANULADA',
    'RECHAZADA',
    'LEGACY_LIQUIDADA',
  ].includes(venta.estado) && Number(venta.saldo_pendiente) > 0;
  const badgeVenta = ESTADO_BADGE[venta.estado] || ESTADO_BADGE.PENDIENTE;

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            className="btn btn-ghost"
            style={{
              alignSelf: 'flex-start',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 8,
            }}
            onClick={() => navigate('/ventas/venta-tarjeta')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Volver
          </button>
          <h1 className="page-title" style={{ margin: 0 }}>
            Factura #{venta.factura_id_personalizado || venta.factura_id}
          </h1>
          <p className="page-subtitle" style={{ margin: 0 }}>{venta.cliente_nombre}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#6c757d', textTransform: 'uppercase' }}>
            Información de la venta
          </h3>
          <div style={infoRowStyle}><span>Fecha</span><strong>{FECHAFMT(venta.fecha_venta)}</strong></div>
          <div style={infoRowStyle}><span>Cliente</span><strong>{venta.cliente_nombre_completo || venta.cliente_nombre}</strong></div>
          <div style={infoRowStyle}><span>Última acreditación</span><strong>{FECHAFMT(venta.fecha_ultima_acreditacion)}</strong></div>
          <div style={infoRowStyle}><span>Comisión acumulada</span><strong>{FMT(venta.comision_acumulada)}</strong></div>
          <div style={infoRowStyle}><span>Retención acumulada</span><strong>{FMT(venta.retencion_acumulada)}</strong></div>
          <div style={{ ...infoRowStyle, borderBottom: 'none' }}>
            <span>Estado</span>
            <span style={{ ...BADGE, background: badgeVenta.bg, color: badgeVenta.color }}>
              {badgeVenta.label}
            </span>
          </div>
        </div>

        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6c757d', textTransform: 'uppercase' }}>Monto esperado</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{FMT(montoTotal)}</div>
          </div>
          <div style={{ padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, fontWeight: 600 }}>
              <span>Bruto acreditado</span>
              <span>{FMT(montoBrutoAcreditado)}</span>
            </div>
            <div style={{ width: '100%', height: 12, background: '#e9ecef', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(progreso, 100)}%`, background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
            </div>
            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, fontWeight: 600, color: '#6c757d' }}>
              {progreso.toFixed(1)}%
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: '#6c757d', textTransform: 'uppercase' }}>Neto recibido</div>
              <strong style={{ fontSize: 22, color: '#27ae60' }}>{FMT(venta.monto_neto_acreditado)}</strong>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6c757d', textTransform: 'uppercase' }}>Saldo pendiente</div>
              <strong style={{ fontSize: 22, color: Number(venta.saldo_pendiente) > 0 ? '#e74c3c' : '#27ae60' }}>
                {FMT(venta.saldo_pendiente)}
              </strong>
            </div>
          </div>
          {puedeAcreditar && (
            <button className="btn btn-primary" onClick={abrirModal}>
              Registrar acreditación
            </button>
          )}
        </div>
      </div>

      <div style={{ ...cardStyle, overflowX: 'auto' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#6c757d', textTransform: 'uppercase' }}>
          Historial de acreditaciones
        </h3>
        {historial.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#adb5bd' }}>
            Esta venta todavía no registra acreditaciones bancarias.
          </div>
        ) : (
          <table style={{ width: '100%', minWidth: 950, borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th>Fecha</th>
                <th>Bruto</th>
                <th>Comisión</th>
                <th>Retención</th>
                <th>Neto</th>
                <th>Banco</th>
                <th>Lote</th>
                <th>Autorización</th>
                <th>Estado</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((abono) => {
                const badge = ESTADO_ABONO_BADGE[abono.estado]
                  || ESTADO_ABONO_BADGE.PENDIENTE;
                return (
                  <tr key={abono.id}>
                    <td>{FECHAFMT(abono.fecha_acreditacion || abono.fecha)}</td>
                    <td style={{ fontWeight: 600 }}>{FMT(abono.monto_bruto)}</td>
                    <td style={{ color: '#e67e22' }}>{FMT(abono.comision)}</td>
                    <td style={{ color: '#e67e22' }}>{FMT(abono.retencion)}</td>
                    <td style={{ color: '#27ae60', fontWeight: 600 }}>{FMT(abono.monto_neto)}</td>
                    <td>{abono.banco || '—'}</td>
                    <td>{abono.numero_lote || '—'}</td>
                    <td>{abono.numero_autorizacion || '—'}</td>
                    <td>
                      <span style={{ ...BADGE, background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </td>
                    <td>{abono.observacion || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <FormModal
        abierto={mostrarModal}
        titulo="Registrar acreditación bancaria"
        subtitulo={`Saldo pendiente: ${FMT(venta.saldo_pendiente)}`}
        onCerrar={() => setMostrarModal(false)}
        onSubmit={handleSubmit}
        saving={guardando}
        saveLabel="Registrar acreditación"
        error={error}
        maxWidth={720}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Monto bruto *
            <input type="number" min="0.01" step="0.01" value={formulario.montoBruto} onChange={(event) => actualizarCampo('montoBruto', event.target.value)} style={{ ...inputStyle, marginTop: 4 }} disabled={guardando} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Comisión
            <input type="number" min="0" step="0.01" value={formulario.comision} onChange={(event) => actualizarCampo('comision', event.target.value)} style={{ ...inputStyle, marginTop: 4 }} disabled={guardando} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Retención
            <input type="number" min="0" step="0.01" value={formulario.retencion} onChange={(event) => actualizarCampo('retencion', event.target.value)} style={{ ...inputStyle, marginTop: 4 }} disabled={guardando} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Neto a Caja Banco
            <input value={FMT(Math.max(0, montoNetoFormulario))} style={{ ...inputStyle, marginTop: 4, background: '#f8f9fa' }} disabled />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Banco *
            <input value={formulario.banco} onChange={(event) => actualizarCampo('banco', event.target.value)} style={{ ...inputStyle, marginTop: 4 }} disabled={guardando} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Fecha de acreditación *
            <input type="date" value={formulario.fechaAcreditacion} onChange={(event) => actualizarCampo('fechaAcreditacion', event.target.value)} style={{ ...inputStyle, marginTop: 4 }} disabled={guardando} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Número de lote
            <input value={formulario.numeroLote} onChange={(event) => actualizarCampo('numeroLote', event.target.value)} style={{ ...inputStyle, marginTop: 4 }} disabled={guardando} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Número de autorización
            <input value={formulario.numeroAutorizacion} onChange={(event) => actualizarCampo('numeroAutorizacion', event.target.value)} style={{ ...inputStyle, marginTop: 4 }} disabled={guardando} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Voucher
            <input value={formulario.voucher} onChange={(event) => actualizarCampo('voucher', event.target.value)} style={{ ...inputStyle, marginTop: 4 }} disabled={guardando} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Caja Banco destino
            <input value={cajaBanco ? `Caja #${cajaBanco.id} · ${FMT(cajaBanco.saldo_actual ?? cajaBanco.saldoActual)}` : ''} style={{ ...inputStyle, marginTop: 4, background: '#f8f9fa' }} disabled />
          </label>
        </div>
        <label style={{ display: 'block', marginTop: 16, fontSize: 12, fontWeight: 600 }}>
          Observación
          <textarea rows={3} value={formulario.observacion} onChange={(event) => actualizarCampo('observacion', event.target.value)} style={{ ...inputStyle, marginTop: 4, resize: 'vertical' }} disabled={guardando} />
        </label>
      </FormModal>
    </div>
  );
}
