// cliente/src/pages/CuentasCobrar/CuentasCobrarModal.jsx
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/api';
import FormModal from '../../components/common/FormModal';
import { confirmarAccion, notificarError, notificarExito } from '../../utils/confirmaciones';
import { CAMPO, FMT, HOY, NUMERO } from '../../utils/formato';
import { imprimirTicketAbono } from '../../utils/ticketVenta';

const CUENTA_INICIAL = {
  clienteNombre: '',
  clienteId: '',
  montoTotal: '',
  fechaVencimiento: '',
  observacion: '',
  sucursalId: '',
};

const COBRO_INICIAL = {
  monto: '',
  metodoCobro: 'EFECTIVO',
  cajaId: '',
  referenciaPago: '',
  observacion: '',
};

export function NuevaCuentaCobrarModal({
  abierto,
  onCerrar,
  onGuardado,
}) {
  const [formulario, setFormulario] = useState(CUENTA_INICIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (abierto) {
      setFormulario(CUENTA_INICIAL);
      setError('');
    }
  }, [abierto]);

  const cambiar = (campo) => (evento) => {
    setFormulario((actual) => ({ ...actual, [campo]: evento.target.value }));
  };

  async function guardar(evento) {
    evento.preventDefault();
    if (!formulario.clienteNombre.trim() || !(NUMERO(formulario.montoTotal) > 0) || !formulario.observacion.trim()) {
      setError('Cliente, monto y observación son obligatorios.');
      return;
    }
    const confirmado = await confirmarAccion(
      `Se registrará una cuenta por cobrar de ${FMT(formulario.montoTotal)} para ${formulario.clienteNombre.trim()}.`,
      'Registrar crédito manual',
      'Registrar cuenta',
    );
    if (!confirmado) return;

    setSaving(true);
    const operacionId = crypto.randomUUID();
    const respuesta = await api.post('/cuentas', {
      fecha: HOY,
      tipo: 'COBRAR',
      montoTotal: NUMERO(formulario.montoTotal),
      montoAbonado: 0,
      estado: 'PENDIENTE',
      observacion: formulario.observacion.trim(),
      terceroNombre: formulario.clienteNombre.trim(),
      terceroId: formulario.clienteId ? Number(formulario.clienteId) : null,
      terceroTipo: 'CLIENTE',
      sucursalId: formulario.sucursalId ? Number(formulario.sucursalId) : null,
      origen: 'CUENTA_MANUAL',
      referenciaTipo: 'CUENTA_MANUAL',
      referenciaCodigo: operacionId,
      fechaEmision: HOY,
      fechaVencimiento: formulario.fechaVencimiento || null,
      operacionId,
      idempotencyKey: `CUENTA_COBRAR:${operacionId}`,
    });
    setSaving(false);
    if (!respuesta.ok || respuesta.data?.estado === 'error') {
      setError(respuesta.data?.resultado || respuesta.data?.mensaje || 'No se pudo registrar la cuenta.');
      await notificarError(respuesta, 'No se pudo registrar la cuenta.');
      return;
    }
    await notificarExito('La cuenta por cobrar fue registrada.');
    onCerrar();
    onGuardado();
  }

  return (
    <FormModal
      abierto={abierto}
      titulo="Nueva cuenta manual"
      subtitulo="Úsala únicamente para créditos especiales sin factura"
      onCerrar={onCerrar}
      onSubmit={guardar}
      saving={saving}
      saveLabel="Registrar cuenta"
      error={error}
      maxWidth={720}
    >
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Cliente</label>
          <input className="form-control" value={formulario.clienteNombre} onChange={cambiar('clienteNombre')} required />
        </div>
        <div className="form-group">
          <label className="form-label">Cliente ID (opcional)</label>
          <input className="form-control" type="number" min="1" value={formulario.clienteId} onChange={cambiar('clienteId')} />
        </div>
        <div className="form-group">
          <label className="form-label">Monto total</label>
          <input className="form-control" type="number" min="0.01" step="0.01" value={formulario.montoTotal} onChange={cambiar('montoTotal')} required />
        </div>
        <div className="form-group">
          <label className="form-label">Fecha de vencimiento</label>
          <input className="form-control" type="date" min={HOY} value={formulario.fechaVencimiento} onChange={cambiar('fechaVencimiento')} />
        </div>
        <div className="form-group">
          <label className="form-label">Sucursal ID (opcional)</label>
          <input className="form-control" type="number" min="1" value={formulario.sucursalId} onChange={cambiar('sucursalId')} />
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Observación</label>
          <textarea className="form-control" rows="3" value={formulario.observacion} onChange={cambiar('observacion')} required />
        </div>
      </div>
    </FormModal>
  );
}

export function CobroCuentaModal({
  abierto,
  cuenta,
  cajasBanco,
  cajasChicas,
  onCerrar,
  onGuardado,
}) {
  const [formulario, setFormulario] = useState(COBRO_INICIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const saldo = NUMERO(CAMPO(cuenta, 'saldo', 'saldo', 0));
  const cajaTipo = formulario.metodoCobro === 'EFECTIVO' ? 'CHICA' : 'BANCO';
  const cajas = cajaTipo === 'BANCO' ? cajasBanco : cajasChicas;
  const saldoResultante = Math.max(0, saldo - NUMERO(formulario.monto));

  useEffect(() => {
    if (!abierto || !cuenta) return;
    setFormulario({ ...COBRO_INICIAL, monto: String(saldo) });
    setError('');
  }, [abierto, cuenta, saldo]);

  useEffect(() => {
    if (!abierto) return;
    setFormulario((actual) => ({
      ...actual,
      cajaId: cajas.some((caja) => String(caja.id) === String(actual.cajaId))
        ? actual.cajaId
        : cajas[0]?.id ?? '',
    }));
  }, [abierto, cajas]);

  const cambiar = (campo) => (evento) => {
    setFormulario((actual) => ({ ...actual, [campo]: evento.target.value }));
  };

  async function guardar(evento) {
    evento.preventDefault();
    const monto = NUMERO(formulario.monto);
    if (!(monto > 0) || monto > saldo || !formulario.cajaId) {
      setError('Ingrese un monto válido y seleccione la caja abierta de destino.');
      return;
    }
    const confirmado = await confirmarAccion(
      `Se cobrarán ${FMT(monto)} en Caja ${cajaTipo === 'BANCO' ? 'Banco' : 'Chica'} #${formulario.cajaId}. Saldo pendiente resultante: ${FMT(saldoResultante)}.`,
      'Confirmar cobro',
      'Registrar cobro',
    );
    if (!confirmado) return;

    setSaving(true);
    const operacionId = crypto.randomUUID();
    const respuesta = await api.post('/operaciones/cobros', {
      operacion_id: operacionId,
      idempotency_key: `COBRO_CUENTA:${cuenta.id}:${operacionId}`,
      cuenta_cobrar_id: cuenta.id,
      monto,
      metodo_cobro: formulario.metodoCobro,
      caja_tipo: cajaTipo,
      caja_id: Number(formulario.cajaId),
      referencia_tipo: CAMPO(cuenta, 'referenciaTipo', 'referencia_tipo', 'CUENTA_COBRAR'),
      referencia_id: CAMPO(cuenta, 'referenciaId', 'referencia_id', cuenta.id),
      referencia_codigo: CAMPO(cuenta, 'referenciaCodigo', 'referencia_codigo', `CUENTA-${cuenta.id}`),
      tercero_id: CAMPO(cuenta, 'terceroId', 'tercero_id'),
      tercero_nombre: CAMPO(cuenta, 'terceroNombre', 'tercero_nombre'),
      referencia_pago: formulario.referenciaPago.trim() || null,
      observacion: formulario.observacion.trim() || null,
    });
    setSaving(false);
    if (!respuesta.ok) {
      setError(respuesta.data?.mensaje || 'No se pudo registrar el cobro.');
      await notificarError(respuesta, 'No se pudo registrar el cobro.');
      return;
    }
    await notificarExito('El cobro fue registrado correctamente.');
    imprimirTicketAbono({
      factura: {
        id: CAMPO(cuenta, 'referenciaId', 'referencia_id', cuenta.id),
        id_personalizado: CAMPO(cuenta, 'referenciaCodigo', 'referencia_codigo', `CUENTA-${cuenta.id}`),
        cliente_nombre: CAMPO(cuenta, 'terceroNombre', 'tercero_nombre', 'Cliente'),
        total: CAMPO(cuenta, 'montoTotal', 'monto_total', saldo),
      },
      abono: monto,
      saldoAnterior: saldo,
      saldoNuevo: saldoResultante,
      cliente: {
        nombres: CAMPO(cuenta, 'terceroNombre', 'tercero_nombre', 'Cliente'),
        apellidos: '',
      },
      metodoPago: formulario.metodoCobro,
      referencia: formulario.referenciaPago.trim() || null,
      fechaPago: new Date().toISOString(),
    });
    onCerrar();
    onGuardado();
  }

  const cajaSeleccionada = useMemo(
    () => cajas.find((caja) => String(caja.id) === String(formulario.cajaId)),
    [cajas, formulario.cajaId],
  );

  return (
    <FormModal
      abierto={abierto}
      titulo="Registrar cobro"
      subtitulo={`${CAMPO(cuenta, 'terceroNombre', 'tercero_nombre', 'Cliente')} · saldo ${FMT(saldo)} · ${CAMPO(cuenta, 'referenciaCodigo', 'referencia_codigo', 'sin factura')}`}
      onCerrar={onCerrar}
      onSubmit={guardar}
      saving={saving}
      saveLabel="Registrar cobro"
      error={error}
      maxWidth={700}
    >
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Monto a cobrar</label>
          <input className="form-control" type="number" min="0.01" max={saldo} step="0.01" value={formulario.monto} onChange={cambiar('monto')} required />
        </div>
        <div className="form-group">
          <label className="form-label">Método de cobro</label>
          <select className="form-control" value={formulario.metodoCobro} onChange={cambiar('metodoCobro')}>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Caja destino</label>
          <select className="form-control" value={formulario.cajaId} onChange={cambiar('cajaId')} required>
            <option value="">Seleccione</option>
            {cajas.map((caja) => (
              <option key={caja.id} value={caja.id}>
                Caja {cajaTipo === 'BANCO' ? 'Banco' : 'Chica'} #{caja.id} · {FMT(caja.saldo_actual ?? caja.monto_actual)}
              </option>
            ))}
          </select>
        </div>
        {formulario.metodoCobro === 'TRANSFERENCIA' && (
          <div className="form-group">
            <label className="form-label">Referencia de pago</label>
            <input className="form-control" value={formulario.referenciaPago} onChange={cambiar('referenciaPago')} />
          </div>
        )}
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Observación</label>
          <textarea className="form-control" rows="3" value={formulario.observacion} onChange={cambiar('observacion')} />
        </div>
      </div>
      {cajas.length === 0 && (
        <div className="alert alert-error">
          No existe una Caja {cajaTipo === 'BANCO' ? 'Banco' : 'Chica'} abierta para recibir este cobro.
        </div>
      )}
      <div className="finance-modal-summary">
        <div><span>Saldo pendiente</span><strong>{FMT(saldo)}</strong></div>
        <div><span>Cobro</span><strong>{FMT(formulario.monto)}</strong></div>
        <div><span>Saldo resultante</span><strong>{FMT(saldoResultante)}</strong></div>
        <div><span>Caja destino</span><strong>{cajaSeleccionada ? `#${cajaSeleccionada.id}` : '—'}</strong></div>
      </div>
    </FormModal>
  );
}
