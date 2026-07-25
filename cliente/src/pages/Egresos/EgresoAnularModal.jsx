// cliente/src/pages/Egresos/EgresoAnularModal.jsx
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { anularEgreso } from '../../api/egresosApi';
import FormModal from '../../components/common/FormModal';
import { obtenerEtiquetaTipoEgreso } from '../../components/common/tipoEgreso';
import {
  confirmarAccionDestructiva,
  extraerMensajeError,
  notificarError,
  notificarExito,
} from '../../utils/confirmaciones';
import { FECHA, FMT } from '../../utils/formato';

export default function EgresoAnularModal({
  abierto,
  egreso,
  onCerrar,
  onAnulado,
}) {
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function limpiarFormulario() {
    setMotivo('');
    setError('');
  }

  function cerrar() {
    limpiarFormulario();
    onCerrar();
  }

  async function anular(event) {
    event.preventDefault();
    if (!motivo.trim()) {
      setError('El motivo de anulación es obligatorio.');
      return;
    }
    const confirmado = await confirmarAccionDestructiva({
      title: 'Confirmar anulación',
      text: 'Se restaurará el stock mediante movimientos compensatorios. El historial no será eliminado.',
      confirmButtonText: 'Sí, anular egreso',
    });
    if (!confirmado) return;

    setSaving(true);
    const respuesta = await anularEgreso(egreso.id, {
      motivo_anulacion: motivo.trim(),
    });
    setSaving(false);

    if (!respuesta.ok) {
      const mensaje = extraerMensajeError(respuesta, 'No se pudo anular el egreso.');
      setError(mensaje);
      await notificarError(mensaje);
      return;
    }
    await notificarExito('El egreso fue anulado y el stock fue restaurado.');
    limpiarFormulario();
    onAnulado?.();
    onCerrar();
  }

  return (
    <FormModal
      abierto={abierto}
      titulo="Anular Egreso"
      subtitulo={egreso?.id_personalizado || `Egreso #${egreso?.id ?? ''}`}
      onCerrar={cerrar}
      onSubmit={anular}
      saving={saving}
      saveLabel="Confirmar Anulación"
      error={error}
      maxWidth={680}
    >
      <div className="finance-modal-summary">
        <div><span>Tipo</span><strong>{obtenerEtiquetaTipoEgreso(egreso?.tipo_egreso)}</strong></div>
        <div><span>Fecha</span><strong>{FECHA(egreso?.fecha)}</strong></div>
        <div><span>Items</span><strong>{egreso?.detalles?.length || 0}</strong></div>
        <div><span>Costo total</span><strong>{FMT(egreso?.costo_total)}</strong></div>
      </div>

      {egreso?.estado_financiero === 'APLICADO' && (
        <div className="finance-alert finance-alert--warning" style={{ marginTop: 18 }}>
          <AlertTriangle size={18} />
          <span>
            Este egreso tiene un reembolso registrado en caja. Al anular se generará
            un reverso financiero automático.
          </span>
        </div>
      )}

      <div className="form-group" style={{ marginTop: 18 }}>
        <label className="form-label">Motivo de anulación *</label>
        <textarea
          className="form-control"
          rows={4}
          value={motivo}
          onChange={(event) => {
            setMotivo(event.target.value);
            setError('');
          }}
          placeholder="Explique por qué se anula este egreso..."
          required
        />
      </div>

      <div className="finance-alert finance-alert--danger" style={{ marginTop: 18 }}>
        <AlertTriangle size={18} />
        <span>
          Esta acción restaurará el stock de todos los productos. Los movimientos
          históricos no pueden eliminarse.
        </span>
      </div>
    </FormModal>
  );
}
