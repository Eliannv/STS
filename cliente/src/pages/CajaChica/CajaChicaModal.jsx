// cliente/src/pages/CajaChica/CajaChicaModal.jsx
import { AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../api/api';
import AbrirCajaChicaModal from '../../components/cajas/AbrirCajaChicaModal';
import FormModal from '../../components/common/FormModal';
import { confirmarAccion, extraerMensajeError, notificarError, notificarExito } from '../../utils/confirmaciones';
import { FMT, NUMERO } from '../../utils/formato';

export const CajaChicaAperturaModal = AbrirCajaChicaModal;

export function CajaChicaCierreModal({
  abierto,
  caja,
  cajaBanco,
  onCerrar,
  onCerrada,
}) {
  const saldoEsperado = NUMERO(caja?.monto_actual ?? caja?.montoActual);
  const [contado, setContado] = useState('');
  const [motivo, setMotivo] = useState('');
  const [observacion, setObservacion] = useState('');
  const [transferir, setTransferir] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const diferencia = NUMERO(contado) - saldoEsperado;

  useEffect(() => {
    if (!abierto) return;
    setContado(saldoEsperado.toFixed(2));
    setMotivo('');
    setObservacion('');
    setTransferir(true);
    setError('');
  }, [abierto, saldoEsperado]);

  async function cerrar(event) {
    event.preventDefault();
    if (contado === '' || NUMERO(contado) < 0) {
      setError('El efectivo contado es requerido.');
      return;
    }
    if (Math.abs(diferencia) >= 0.005 && !motivo.trim()) {
      setError('El motivo de la diferencia es obligatorio.');
      return;
    }
    if (!transferir && NUMERO(contado) > 0 && !motivo.trim()) {
      setError('Debe indicar por qué el saldo no será transferido.');
      return;
    }
    if (transferir && !cajaBanco?.id) {
      setError('La Caja Banco vinculada no está disponible.');
      return;
    }

    const confirmado = await confirmarAccion({
      title: 'Confirmar arqueo de Caja Chica',
      html: `Esperado: <b>${FMT(saldoEsperado)}</b><br/>`
        + `Contado: <b>${FMT(contado)}</b><br/>`
        + `Diferencia: <b>${FMT(diferencia)}</b><br/>`
        + `${transferir ? `Transferir a Caja Banco #${cajaBanco.id}` : 'No transferir saldo'}`,
      confirmButtonText: 'Cerrar caja',
    });
    if (!confirmado) return;

    setSaving(true);
    const operacionId = crypto.randomUUID();
    const respuesta = await api.post(`/caja-chica/${caja.id}/cerrar`, {
      saldoContado: NUMERO(contado),
      motivoDiferencia: motivo.trim() || null,
      observacion: observacion.trim() || null,
      transferirABanco: transferir,
      operacion_id: operacionId,
      idempotency_keys: {
        ajuste: `CIERRE_CAJA_CHICA:${caja.id}:${operacionId}:AJUSTE`,
        salida: `CIERRE_CAJA_CHICA:${caja.id}:${operacionId}:SALIDA`,
        entrada: `CIERRE_CAJA_CHICA:${caja.id}:${operacionId}:ENTRADA`,
      },
    });
    setSaving(false);
    if (!respuesta.ok) {
      const mensaje = extraerMensajeError(respuesta, 'No se pudo cerrar la Caja Chica.');
      setError(mensaje);
      await notificarError(mensaje);
      return;
    }
    await notificarExito('La Caja Chica fue cerrada correctamente.');
    onCerrada?.();
    onCerrar();
  }

  return (
    <FormModal
      abierto={abierto}
      titulo="Cerrar Caja Chica"
      subtitulo={`Arqueo de Caja #${caja?.id ?? ''}`}
      onCerrar={onCerrar}
      onSubmit={cerrar}
      saving={saving}
      saveLabel="Cerrar Caja"
      error={error}
      maxWidth={720}
    >
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Efectivo contado</label>
          <input className="form-control" type="number" min="0" step="0.01" value={contado} onChange={(event) => setContado(event.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Saldo esperado</label>
          <input className="form-control" value={FMT(saldoEsperado)} disabled />
        </div>
        <div className="form-group">
          <label className="form-label">Diferencia</label>
          <input className="form-control" value={FMT(diferencia)} disabled style={{ color: diferencia < 0 ? '#e74c3c' : diferencia > 0 ? '#27ae60' : '#6c757d' }} />
        </div>
        <div className="form-group">
          <label className="form-label">Motivo diferencia</label>
          <input className="form-control" value={motivo} onChange={(event) => setMotivo(event.target.value)} />
        </div>
        <div className="form-group full">
          <label className="form-label">Observación</label>
          <textarea className="form-control" rows={3} value={observacion} onChange={(event) => setObservacion(event.target.value)} />
        </div>
      </div>
      <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 16, cursor: 'pointer' }}>
        <input type="checkbox" checked={transferir} onChange={(event) => setTransferir(event.target.checked)} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>Transferir saldo a Caja Banco</span>
      </label>
      {transferir && (
        <div className={`finance-alert ${cajaBanco?.estado === 'ABIERTA' ? 'finance-alert--warning' : 'finance-alert--danger'}`} style={{ marginTop: 12 }}>
          {cajaBanco?.estado === 'ABIERTA' ? <ArrowRightLeft size={18} /> : <AlertTriangle size={18} />}
          <span>
            {cajaBanco?.estado === 'ABIERTA'
              ? `El saldo será transferido a Caja Banco #${cajaBanco.id}.`
              : 'La Caja Banco vinculada no se encuentra abierta.'}
          </span>
        </div>
      )}
    </FormModal>
  );
}

export function CajaChicaReposicionModal({
  abierto,
  caja,
  cajaBanco,
  onCerrar,
  onRepuesta,
}) {
  const [monto, setMonto] = useState('');
  const [observacion, setObservacion] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const saldoBanco = NUMERO(cajaBanco?.saldo_actual ?? cajaBanco?.saldoActual);

  useEffect(() => {
    if (!abierto) return;
    setMonto('');
    setObservacion('');
    setError('');
  }, [abierto]);

  async function reponer(event) {
    event.preventDefault();
    if (!(NUMERO(monto) > 0)) {
      setError('El monto debe ser mayor a cero.');
      return;
    }
    if (NUMERO(monto) > saldoBanco) {
      setError(`El monto supera el saldo disponible de ${FMT(saldoBanco)}.`);
      return;
    }
    const confirmado = await confirmarAccion({
      title: 'Confirmar reposición',
      html: `Transferir <b>${FMT(monto)}</b> desde Caja Banco #${cajaBanco?.id} hacia Caja Chica #${caja?.id}.`,
      confirmButtonText: 'Reponer caja',
    });
    if (!confirmado) return;

    setSaving(true);
    const operacionId = crypto.randomUUID();
    const respuesta = await api.post(`/caja-chica/${caja.id}/reponer`, {
      monto: NUMERO(monto),
      observacion: observacion.trim() || null,
      operacion_id: operacionId,
      idempotency_keys: {
        salida: `REPOSICION_CAJA_CHICA:${caja.id}:${operacionId}:SALIDA`,
        entrada: `REPOSICION_CAJA_CHICA:${caja.id}:${operacionId}:ENTRADA`,
      },
    });
    setSaving(false);
    if (!respuesta.ok) {
      const mensaje = extraerMensajeError(respuesta, 'No se pudo reponer la Caja Chica.');
      setError(mensaje);
      await notificarError(mensaje);
      return;
    }
    await notificarExito('La reposición fue registrada correctamente.');
    onRepuesta?.();
    onCerrar();
  }

  return (
    <FormModal
      abierto={abierto}
      titulo="Reponer Caja Chica"
      subtitulo={`Caja Banco origen #${cajaBanco?.id ?? '—'} · disponible ${FMT(saldoBanco)}`}
      onCerrar={onCerrar}
      onSubmit={reponer}
      saving={saving}
      saveLabel="Reponer Caja"
      error={error}
      maxWidth={620}
    >
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Monto a reponer</label>
          <input className="form-control" type="number" min="0.01" step="0.01" value={monto} onChange={(event) => setMonto(event.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Saldo Caja Banco</label>
          <input className="form-control" value={FMT(saldoBanco)} disabled />
        </div>
        <div className="form-group full">
          <label className="form-label">Observación</label>
          <textarea className="form-control" rows={3} value={observacion} onChange={(event) => setObservacion(event.target.value)} />
        </div>
      </div>
      {NUMERO(monto) > saldoBanco && (
        <div className="finance-alert finance-alert--danger" style={{ marginTop: 14 }}>
          <AlertTriangle size={18} /> El monto supera el saldo disponible.
        </div>
      )}
    </FormModal>
  );
}
