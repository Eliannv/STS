// cliente/src/pages/CuentasPagar/CuentasPagarModal.jsx
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/api';
import FormModal from '../../components/common/FormModal';
import { confirmarAccion, notificarError, notificarExito } from '../../utils/confirmaciones';
import { CAMPO, FMT, HOY, NUMERO } from '../../utils/formato';

const CUENTA_INICIAL = {
  tipoCuenta: 'Deuda',
  terceroNombre: '',
  terceroTipo: 'PROVEEDOR',
  montoTotal: '',
  fechaVencimiento: '',
  observacion: '',
  sucursalId: '',
  cajaBancoId: '',
};

const PAGO_INICIAL = {
  monto: '',
  metodoPago: 'EFECTIVO',
  cajaTipo: 'CHICA',
  cajaId: '',
  referenciaPago: '',
  observacion: '',
};

export function NuevaCuentaPagarModal({
  abierto,
  onCerrar,
  onGuardado,
  cajasBanco,
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
    if (!formulario.terceroNombre.trim() || !(NUMERO(formulario.montoTotal) > 0) || !formulario.observacion.trim()) {
      setError('Tercero, monto y observación son obligatorios.');
      return;
    }
    const confirmado = await confirmarAccion(
      `Se registrará una cuenta por ${FMT(formulario.montoTotal)} a nombre de ${formulario.terceroNombre.trim()}.`,
      'Registrar cuenta por pagar',
      'Registrar cuenta',
    );
    if (!confirmado) return;

    setSaving(true);
    const operacionId = crypto.randomUUID();
    const respuesta = await api.post('/cuentas/pagar', {
      operacion_id: operacionId,
      idempotency_key: `CUENTA_PAGAR:${operacionId}`,
      tipo_cuenta_por_pagar: formulario.tipoCuenta,
      tercero_nombre: formulario.terceroNombre.trim(),
      tercero_tipo: formulario.terceroTipo,
      monto_total: NUMERO(formulario.montoTotal),
      fecha_vencimiento: formulario.fechaVencimiento || null,
      referencia_tipo: 'CUENTA_MANUAL',
      referencia_codigo: operacionId,
      sucursal_id: formulario.sucursalId ? Number(formulario.sucursalId) : null,
      caja_banco_id: formulario.cajaBancoId ? Number(formulario.cajaBancoId) : null,
      origen: 'CUENTA_MANUAL',
      observacion: formulario.observacion.trim(),
    });
    setSaving(false);
    if (!respuesta.ok) {
      setError(respuesta.data?.mensaje || 'No se pudo registrar la cuenta.');
      await notificarError(respuesta, 'No se pudo registrar la cuenta.');
      return;
    }
    await notificarExito('La cuenta por pagar fue registrada.');
    onCerrar();
    onGuardado();
  }

  return (
    <FormModal
      abierto={abierto}
      titulo="Nueva cuenta manual"
      subtitulo="Registra una deuda o préstamo con trazabilidad financiera"
      onCerrar={onCerrar}
      onSubmit={guardar}
      saving={saving}
      saveLabel="Registrar cuenta"
      error={error}
      maxWidth={760}
    >
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Tipo</label>
          <select className="form-control" value={formulario.tipoCuenta} onChange={cambiar('tipoCuenta')}>
            <option value="Deuda">Deuda</option>
            <option value="Prestamo">Préstamo</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Tipo de tercero</label>
          <select className="form-control" value={formulario.terceroTipo} onChange={cambiar('terceroTipo')}>
            <option value="PROVEEDOR">Proveedor</option>
            <option value="EMPLEADO">Empleado</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Tercero</label>
          <input className="form-control" value={formulario.terceroNombre} onChange={cambiar('terceroNombre')} required />
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
        <div className="form-group">
          <label className="form-label">Caja Banco vinculada (opcional)</label>
          <select className="form-control" value={formulario.cajaBancoId} onChange={cambiar('cajaBancoId')}>
            <option value="">Sin vincular</option>
            {cajasBanco.map((caja) => (
              <option key={caja.id} value={caja.id}>Caja Banco #{caja.id} · {FMT(caja.saldo_actual)}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Observación</label>
          <textarea className="form-control" rows="3" value={formulario.observacion} onChange={cambiar('observacion')} required />
        </div>
      </div>
    </FormModal>
  );
}

export function PagoCuentaPagarModal({
  abierto,
  cuenta,
  cajasBanco,
  cajasChicas,
  onCerrar,
  onGuardado,
}) {
  const [formulario, setFormulario] = useState(PAGO_INICIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const saldo = NUMERO(CAMPO(cuenta, 'saldo', 'saldo', 0));
  const cajas = formulario.cajaTipo === 'BANCO' ? cajasBanco : cajasChicas;
  const saldoResultante = Math.max(0, saldo - NUMERO(formulario.monto));

  useEffect(() => {
    if (!abierto || !cuenta) return;
    setFormulario({ ...PAGO_INICIAL, monto: String(saldo) });
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
    const valor = evento.target.value;
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
      ...(campo === 'metodoPago' && valor === 'TRANSFERENCIA' ? { cajaTipo: 'BANCO' } : {}),
    }));
  };

  async function guardar(evento) {
    evento.preventDefault();
    const monto = NUMERO(formulario.monto);
    if (!(monto > 0) || monto > saldo || !formulario.cajaId) {
      setError('Ingrese un monto válido que no supere el saldo y seleccione una caja abierta.');
      return;
    }
    const confirmado = await confirmarAccion(
      `Se pagarán ${FMT(monto)} desde Caja ${formulario.cajaTipo === 'BANCO' ? 'Banco' : 'Chica'} #${formulario.cajaId}. Saldo resultante: ${FMT(saldoResultante)}.`,
      'Confirmar pago',
      'Registrar pago',
    );
    if (!confirmado) return;

    setSaving(true);
    const operacionId = crypto.randomUUID();
    const respuesta = await api.post(`/cuentas/${cuenta.id}/pagos`, {
      operacion_id: operacionId,
      idempotency_key: `PAGO_CUENTA:${cuenta.id}:${operacionId}`,
      monto,
      metodo_pago: formulario.metodoPago,
      caja_tipo: formulario.cajaTipo,
      caja_id: Number(formulario.cajaId),
      referencia_pago: formulario.referenciaPago.trim() || null,
      observacion: formulario.observacion.trim() || null,
    });
    setSaving(false);
    if (!respuesta.ok) {
      setError(respuesta.data?.mensaje || 'No se pudo registrar el pago.');
      await notificarError(respuesta, 'No se pudo registrar el pago.');
      return;
    }
    await notificarExito('El pago fue registrado correctamente.');
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
      titulo="Registrar pago"
      subtitulo={`${CAMPO(cuenta, 'terceroNombre', 'tercero_nombre', 'Cuenta')} · saldo ${FMT(saldo)}`}
      onCerrar={onCerrar}
      onSubmit={guardar}
      saving={saving}
      saveLabel="Registrar pago"
      error={error}
      maxWidth={720}
    >
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Monto a pagar</label>
          <input className="form-control" type="number" min="0.01" max={saldo} step="0.01" value={formulario.monto} onChange={cambiar('monto')} required />
        </div>
        <div className="form-group">
          <label className="form-label">Método de pago</label>
          <select className="form-control" value={formulario.metodoPago} onChange={cambiar('metodoPago')}>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Tipo de caja</label>
          <select className="form-control" value={formulario.cajaTipo} onChange={cambiar('cajaTipo')}>
            <option value="CHICA">Caja Chica</option>
            <option value="BANCO">Caja Banco</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Caja abierta</label>
          <select className="form-control" value={formulario.cajaId} onChange={cambiar('cajaId')} required>
            <option value="">Seleccione</option>
            {cajas.map((caja) => (
              <option key={caja.id} value={caja.id}>
                #{caja.id} · disponible {FMT(caja.saldo_actual ?? caja.monto_actual)}
              </option>
            ))}
          </select>
        </div>
        {formulario.metodoPago === 'TRANSFERENCIA' && (
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
      {cajas.length === 0 && <div className="alert alert-error">No existe una caja abierta del tipo seleccionado.</div>}
      <div className="finance-modal-summary">
        <div><span>Saldo pendiente</span><strong>{FMT(saldo)}</strong></div>
        <div><span>Pago</span><strong>{FMT(formulario.monto)}</strong></div>
        <div><span>Saldo resultante</span><strong>{FMT(saldoResultante)}</strong></div>
        <div><span>Saldo de caja</span><strong>{FMT(cajaSeleccionada?.saldo_actual ?? cajaSeleccionada?.monto_actual)}</strong></div>
      </div>
    </FormModal>
  );
}
