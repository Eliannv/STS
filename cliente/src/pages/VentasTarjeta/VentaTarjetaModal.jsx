// cliente/src/pages/VentasTarjeta/VentaTarjetaModal.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../api/api';
import FormModal from '../../components/common/FormModal';
import { confirmarAccion, extraerMensajeError, notificarError, notificarExito } from '../../utils/confirmaciones';
import { FMT, HOY, NUMERO, RESULTADO_LISTA } from '../../utils/formato';

const INICIAL = {
  fechaAcreditacion: HOY,
  montoBruto: '',
  comision: '0',
  retencion: '0',
  banco: '',
  numeroLote: '',
  numeroAutorizacion: '',
  voucher: '',
  cajaBancoId: '',
  observacion: '',
};

export default function VentaTarjetaModal({
  abierto,
  venta,
  onCerrar,
  onRegistrada,
}) {
  const [formulario, setFormulario] = useState(INICIAL);
  const [cajasBanco, setCajasBanco] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const saldoPendiente = NUMERO(venta?.saldo_pendiente);
  const neto = NUMERO(formulario.montoBruto)
    - NUMERO(formulario.comision)
    - NUMERO(formulario.retencion);

  const cargarCajas = useCallback(async () => {
    const respuesta = await api.get('/caja-banco/lista?estado=ABIERTA&limit=100');
    const cajas = respuesta.ok
      ? RESULTADO_LISTA(respuesta).filter((caja) => caja.estado === 'ABIERTA')
      : [];
    setCajasBanco(cajas);
    setFormulario((actual) => ({
      ...actual,
      cajaBancoId: cajas.some((caja) => String(caja.id) === String(actual.cajaBancoId))
        ? actual.cajaBancoId
        : cajas[0]?.id ?? '',
    }));
  }, []);

  useEffect(() => {
    if (!abierto || !venta) return;
    setFormulario({
      ...INICIAL,
      fechaAcreditacion: HOY,
      montoBruto: String(saldoPendiente || ''),
      banco: venta.banco || '',
    });
    setError('');
    cargarCajas();
  }, [abierto, cargarCajas, saldoPendiente, venta]);

  const cajaSeleccionada = useMemo(
    () => cajasBanco.find((caja) => String(caja.id) === String(formulario.cajaBancoId)),
    [cajasBanco, formulario.cajaBancoId],
  );

  function cambiar(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
    setError('');
  }

  async function registrar(event) {
    event.preventDefault();
    const bruto = NUMERO(formulario.montoBruto);
    const comision = NUMERO(formulario.comision);
    const retencion = NUMERO(formulario.retencion);
    if (!(bruto > 0)) return setError('El monto recibido debe ser mayor a cero.');
    if (comision < 0 || retencion < 0) return setError('Comisión y retención no pueden ser negativas.');
    if (!(neto > 0)) return setError('El neto a acreditar debe ser mayor a cero.');
    if (bruto > saldoPendiente) return setError(`El monto no puede superar el saldo de ${FMT(saldoPendiente)}.`);
    if (!formulario.banco.trim()) return setError('El banco es requerido.');
    if (!formulario.cajaBancoId) return setError('Debe seleccionar una Caja Banco destino.');

    const confirmado = await confirmarAccion({
      title: 'Confirmar ingreso bancario',
      html: `Factura <b>#${venta.factura_id_personalizado || venta.factura_id}</b><br/>`
        + `Bruto: <b>${FMT(bruto)}</b><br/>`
        + `Comisión: <b>${FMT(comision)}</b><br/>`
        + `Retención: <b>${FMT(retencion)}</b><br/>`
        + `Neto: <b>${FMT(neto)}</b>`,
      confirmButtonText: 'Registrar ingreso',
    });
    if (!confirmado) return;

    setSaving(true);
    const respuesta = await api.post(`/venta-tarjeta/${venta.id}/acreditaciones`, {
      fecha_acreditacion: formulario.fechaAcreditacion,
      monto_bruto: bruto,
      comision,
      retencion,
      banco: formulario.banco.trim(),
      numero_lote: formulario.numeroLote.trim() || null,
      numero_autorizacion: formulario.numeroAutorizacion.trim() || null,
      voucher: formulario.voucher.trim() || null,
      cuenta_banco_id: Number(formulario.cajaBancoId),
      observacion: formulario.observacion.trim() || null,
    });
    setSaving(false);

    if (!respuesta.ok) {
      const mensaje = extraerMensajeError(respuesta, 'No se pudo registrar la acreditación.');
      setError(mensaje);
      await notificarError(mensaje);
      return;
    }
    const procesamiento = respuesta.data?.resultado?.procesamientoCaja
      ?? respuesta.data?.resultado?.procesamiento_caja;
    await notificarExito(
      procesamiento === 'PENDIENTE'
        ? 'La acreditación quedó pendiente de sincronización con Caja Banco.'
        : 'La acreditación y sus movimientos financieros fueron registrados.',
    );
    onRegistrada?.();
    onCerrar();
  }

  return (
    <FormModal
      abierto={abierto}
      titulo="Registrar Ingreso del Banco"
      subtitulo={`Factura #${venta?.factura_id_personalizado || venta?.factura_id || '—'} · ${venta?.cliente_nombre || 'Cliente'} · saldo ${FMT(saldoPendiente)}`}
      onCerrar={onCerrar}
      onSubmit={registrar}
      saving={saving}
      saveLabel="Registrar ingreso"
      error={error}
      maxWidth={800}
      scrollable
    >
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Fecha de depósito</label>
          <input className="form-control" type="date" value={formulario.fechaAcreditacion} onChange={(event) => cambiar('fechaAcreditacion', event.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Monto recibido bruto</label>
          <input className="form-control" type="number" min="0.01" step="0.01" value={formulario.montoBruto} onChange={(event) => cambiar('montoBruto', event.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Comisión bancaria</label>
          <input className="form-control" type="number" min="0" step="0.01" value={formulario.comision} onChange={(event) => cambiar('comision', event.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Retención</label>
          <input className="form-control" type="number" min="0" step="0.01" value={formulario.retencion} onChange={(event) => cambiar('retencion', event.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Neto a acreditar</label>
          <input className="form-control" value={FMT(neto)} disabled style={{ color: neto > 0 ? '#27ae60' : '#e74c3c', fontWeight: 700 }} />
        </div>
        <div className="form-group">
          <label className="form-label">Banco</label>
          <input className="form-control" value={formulario.banco} onChange={(event) => cambiar('banco', event.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Número de lote</label>
          <input className="form-control" value={formulario.numeroLote} onChange={(event) => cambiar('numeroLote', event.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Número de autorización</label>
          <input className="form-control" value={formulario.numeroAutorizacion} onChange={(event) => cambiar('numeroAutorizacion', event.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Voucher</label>
          <input className="form-control" value={formulario.voucher} onChange={(event) => cambiar('voucher', event.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Caja Banco destino</label>
          <select className="form-control" value={formulario.cajaBancoId} onChange={(event) => cambiar('cajaBancoId', event.target.value)} required>
            <option value="">Seleccione una caja abierta</option>
            {cajasBanco.map((caja) => (
              <option key={caja.id} value={caja.id}>#{caja.id} · disponible {FMT(caja.saldo_actual)}</option>
            ))}
          </select>
        </div>
        <div className="form-group full">
          <label className="form-label">Observación</label>
          <textarea className="form-control" rows={3} value={formulario.observacion} onChange={(event) => cambiar('observacion', event.target.value)} />
        </div>
      </div>
      <div className="finance-modal-summary">
        <div><span>Bruto</span><strong>{FMT(formulario.montoBruto)}</strong></div>
        <div><span>Comisión</span><strong style={{ color: '#e74c3c' }}>− {FMT(formulario.comision)}</strong></div>
        <div><span>Retención</span><strong style={{ color: '#e74c3c' }}>− {FMT(formulario.retencion)}</strong></div>
        <div><span>Neto</span><strong style={{ color: '#27ae60' }}>{FMT(neto)}</strong></div>
        <div><span>Destino</span><strong>#{cajaSeleccionada?.id || '—'}</strong></div>
      </div>
    </FormModal>
  );
}
