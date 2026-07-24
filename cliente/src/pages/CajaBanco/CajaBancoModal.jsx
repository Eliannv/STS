// cliente/src/pages/CajaBanco/CajaBancoModal.jsx
import { AlertTriangle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/api';
import AbrirCajaBancoModal from '../../components/cajas/AbrirCajaBancoModal';
import FormModal from '../../components/common/FormModal';
import { confirmarAccion, extraerMensajeError, notificarError, notificarExito } from '../../utils/confirmaciones';
import { FMT } from '../../utils/formato';

export const CajaBancoAperturaModal = AbrirCajaBancoModal;

export function CajaBancoCierreModal({
  abierto,
  caja,
  cajasChicas = [],
  onCerrar,
  onCerrada,
}) {
  const [saldoContado, setSaldoContado] = useState('');
  const [motivo, setMotivo] = useState('');
  const [observacion, setObservacion] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const saldoEsperado = Number(caja?.saldo_actual ?? caja?.saldoActual ?? 0);
  const diferencia = Number(saldoContado || 0) - saldoEsperado;
  const cajaChicaAbierta = cajasChicas.find((item) => item.estado === 'ABIERTA');

  useEffect(() => {
    if (!abierto) return;
    setSaldoContado(String(saldoEsperado.toFixed(2)));
    setMotivo('');
    setObservacion('');
    setError('');
  }, [abierto, saldoEsperado]);

  const resumen = useMemo(() => ({
    esperado: saldoEsperado,
    contado: Number(saldoContado || 0),
    diferencia,
  }), [diferencia, saldoContado, saldoEsperado]);

  async function cerrarCaja(event) {
    event.preventDefault();
    if (cajaChicaAbierta) {
      setError(`Debe cerrar primero la Caja Chica #${cajaChicaAbierta.id}.`);
      return;
    }
    if (saldoContado === '' || Number(saldoContado) < 0) {
      setError('El saldo contado es requerido y no puede ser negativo.');
      return;
    }
    if (Math.abs(diferencia) >= 0.005 && !motivo.trim()) {
      setError('El motivo de la diferencia es obligatorio.');
      return;
    }

    const confirmado = await confirmarAccion({
      title: 'Confirmar cierre de Caja Banco',
      html: `Saldo esperado: <b>${FMT(resumen.esperado)}</b><br/>`
        + `Saldo contado: <b>${FMT(resumen.contado)}</b><br/>`
        + `Diferencia: <b>${FMT(resumen.diferencia)}</b>`,
      confirmButtonText: 'Cerrar caja',
    });
    if (!confirmado) return;

    setSaving(true);
    setError('');
    const operacionId = crypto.randomUUID();
    const respuesta = await api.post(`/caja-banco/${caja.id}/cerrar`, {
      saldoContado: resumen.contado,
      motivoDiferencia: motivo.trim() || null,
      observacion: observacion.trim() || null,
      operacion_id: operacionId,
      idempotency_key: `CIERRE_CAJA_BANCO:${caja.id}:${operacionId}`,
    });
    setSaving(false);

    if (!respuesta.ok) {
      const mensaje = extraerMensajeError(respuesta, 'No se pudo cerrar la Caja Banco.');
      setError(mensaje);
      await notificarError(mensaje);
      return;
    }
    await notificarExito('La Caja Banco fue cerrada correctamente.');
    onCerrada?.();
    onCerrar();
  }

  return (
    <FormModal
      abierto={abierto}
      titulo="Cerrar Caja Banco"
      subtitulo={`Caja #${caja?.id ?? ''} · saldo esperado ${FMT(saldoEsperado)}`}
      onCerrar={onCerrar}
      onSubmit={cerrarCaja}
      saving={saving}
      saveLabel="Cerrar Caja"
      error={error}
      maxWidth={680}
    >
      {cajaChicaAbierta && (
        <div className="finance-alert finance-alert--danger" style={{ marginBottom: 16 }}>
          <AlertTriangle size={18} />
          <span>
            La Caja Chica #{cajaChicaAbierta.id} permanece abierta. Debe cerrarla antes de continuar.
          </span>
        </div>
      )}
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Saldo esperado</label>
          <input className="form-control" value={FMT(saldoEsperado)} disabled />
        </div>
        <div className="form-group">
          <label className="form-label">Saldo contado</label>
          <input
            className="form-control"
            type="number"
            min="0"
            step="0.01"
            value={saldoContado}
            onChange={(event) => {
              setSaldoContado(event.target.value);
              setError('');
            }}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Diferencia</label>
          <input
            className="form-control"
            value={FMT(diferencia)}
            disabled
            style={{ color: diferencia < 0 ? '#e74c3c' : diferencia > 0 ? '#27ae60' : '#6c757d' }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">
            Motivo de diferencia {Math.abs(diferencia) >= 0.005 ? '*' : ''}
          </label>
          <input
            className="form-control"
            value={motivo}
            onChange={(event) => setMotivo(event.target.value)}
            disabled={Math.abs(diferencia) < 0.005}
          />
        </div>
        <div className="form-group full">
          <label className="form-label">Observación</label>
          <textarea
            className="form-control"
            rows={3}
            value={observacion}
            onChange={(event) => setObservacion(event.target.value)}
          />
        </div>
      </div>
    </FormModal>
  );
}
