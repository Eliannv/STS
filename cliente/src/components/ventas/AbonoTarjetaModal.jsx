import { useState } from 'react';
import { api } from '../../api/api';
import { X } from 'lucide-react';
import Swal from 'sweetalert2';
import './AbonoTarjetaModal.css';

const FMT = v => `$${parseFloat(v || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;

export default function AbonoTarjetaModal({ ventaTarjetaId, saldoPendiente, onGuardar, onCerrar }) {
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [observacion, setObservacion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function handleGuardar() {
    // Validaciones
    if (!monto || parseFloat(monto) <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (parseFloat(monto) > parseFloat(saldoPendiente)) {
      setError(`El monto no puede exceder el saldo pendiente de ${FMT(saldoPendiente)}`);
      return;
    }

    if (!fecha) {
      setError('La fecha es requerida');
      return;
    }

    setGuardando(true);
    try {
      const r = await api.post(`/venta-tarjeta/${ventaTarjetaId}/registrar-abono`, {
        monto: parseFloat(monto),
        fecha,
        observacion: observacion || null
      });

      if (r.ok) {
        onGuardar();
      } else {
        setError(r.data.resultado || 'Error al registrar abono');
      }
    } catch (error) {
      console.error('Error registrarAbono:', error);
      setError('Error al registrar abono');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="atm-overlay">
      <div className="atm-modal">
        {/* Header */}
        <div className="atm-header">
          <h2>Registrar Abono del Banco</h2>
          <button className="atm-btn-cerrar" onClick={onCerrar} disabled={guardando}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="atm-body">
          {/* Saldo Pendiente Info */}
          <div className="atm-info">
            <div className="atm-info-label">Saldo Pendiente</div>
            <div className="atm-info-valor">{FMT(saldoPendiente)}</div>
          </div>

          {/* Error */}
          {error && (
            <div className="atm-error">
              {error}
            </div>
          )}

          {/* Formulario */}
          <div className="atm-form">
            {/* Monto */}
            <div className="atm-field">
              <label>Monto Recibido del Banco *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={monto}
                onChange={e => {
                  setMonto(e.target.value);
                  setError('');
                }}
                placeholder="0.00"
                disabled={guardando}
              />
              {monto && parseFloat(monto) > 0 && (
                <div className="atm-monto-formateado">{FMT(monto)}</div>
              )}
            </div>

            {/* Fecha */}
            <div className="atm-field">
              <label>Fecha del Depósito *</label>
              <input
                type="date"
                value={fecha}
                onChange={e => {
                  setFecha(e.target.value);
                  setError('');
                }}
                disabled={guardando}
              />
            </div>

            {/* Observación */}
            <div className="atm-field">
              <label>Observación (Opcional)</label>
              <textarea
                value={observacion}
                onChange={e => setObservacion(e.target.value)}
                placeholder="Ej: Depósito parcial, referencia bancaria, etc."
                disabled={guardando}
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="atm-footer">
          <button className="atm-btn atm-btn-cancelar" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button
            className="atm-btn atm-btn-guardar"
            onClick={handleGuardar}
            disabled={guardando || !monto}
          >
            {guardando ? 'Guardando...' : 'Registrar Abono'}
          </button>
        </div>
      </div>
    </div>
  );
}
