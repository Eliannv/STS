// cliente/src/pages/Egresos/EgresoConfirmarModal.jsx
import { AlertTriangle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  confirmarEgreso,
  listarCajasBancoAbiertas,
  listarCajasChicasAbiertas,
} from '../../api/egresosApi';
import FormModal from '../../components/common/FormModal';
import {
  confirmarAccion,
  extraerMensajeError,
  notificarError,
  notificarExito,
} from '../../utils/confirmaciones';
import { FMT, NUMERO, RESULTADO_LISTA } from '../../utils/formato';

const calcularCostoTotal = (detalles = []) => detalles.reduce(
  (total, detalle) => total + NUMERO(detalle.subtotal),
  0,
);

export default function EgresoConfirmarModal({
  abierto,
  egreso,
  onCerrar,
  onConfirmado,
}) {
  const [conReembolso, setConReembolso] = useState(false);
  const [monto, setMonto] = useState(() => String(calcularCostoTotal(egreso?.detalles).toFixed(2)));
  const [metodoPago, setMetodoPago] = useState('TRANSFERENCIA');
  const [cajaTipo, setCajaTipo] = useState('BANCO');
  const [cajaId, setCajaId] = useState('');
  const [referenciaPago, setReferenciaPago] = useState('');
  const [cajasBanco, setCajasBanco] = useState([]);
  const [cajasChicas, setCajasChicas] = useState([]);
  const [loadingCajas, setLoadingCajas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const detalles = useMemo(() => egreso?.detalles || [], [egreso]);
  const costoTotal = useMemo(
    () => calcularCostoTotal(detalles),
    [detalles],
  );
  const esDevolucion = egreso?.tipo_egreso === 'DEVOLUCION_PROVEEDOR';
  const cajasDisponibles = cajaTipo === 'BANCO' ? cajasBanco : cajasChicas;

  function limpiarFormulario() {
    setConReembolso(false);
    setMonto(String(calcularCostoTotal(egreso?.detalles).toFixed(2)));
    setMetodoPago('TRANSFERENCIA');
    setCajaTipo('BANCO');
    setCajaId('');
    setReferenciaPago('');
    setError('');
  }

  function cerrar() {
    limpiarFormulario();
    onCerrar();
  }

  useEffect(() => {
    if (!abierto || !esDevolucion) return;
    let activo = true;
    const temporizador = setTimeout(async () => {
      setLoadingCajas(true);
      const [banco, chica] = await Promise.allSettled([
        listarCajasBancoAbiertas(),
        listarCajasChicasAbiertas(),
      ]);
      if (!activo) return;
      const listaBanco =
        banco.status === 'fulfilled' && banco.value.ok
          ? RESULTADO_LISTA(banco.value).filter((caja) => caja.estado === 'ABIERTA')
          : [];
      const listaChica =
        chica.status === 'fulfilled' && chica.value.ok
          ? RESULTADO_LISTA(chica.value).filter((caja) => caja.estado === 'ABIERTA')
          : [];
      setCajasBanco(listaBanco);
      setCajasChicas(listaChica);
      setCajaId((actual) => actual || listaBanco[0]?.id || '');
      setLoadingCajas(false);
    }, 0);
    return () => {
      activo = false;
      clearTimeout(temporizador);
    };
  }, [abierto, esDevolucion]);

  async function confirmar(event) {
    event.preventDefault();
    if (detalles.length === 0) {
      setError('Agregue al menos un producto antes de confirmar.');
      return;
    }
    if (esDevolucion && conReembolso) {
      if (!(NUMERO(monto) > 0)) {
        setError('El monto del reembolso debe ser mayor que cero.');
        return;
      }
      if (!cajaId) {
        setError('Seleccione una caja abierta para recibir el reembolso.');
        return;
      }
    }

    const aceptado = await confirmarAccion({
      title: 'Confirmar egreso',
      html: `Se retirarán <b>${detalles.length}</b> productos por un costo de `
        + `<b>${FMT(costoTotal)}</b>.<br/><br/>Esta acción no puede editarse posteriormente.`,
      confirmButtonText: 'Confirmar egreso',
    });
    if (!aceptado) return;

    setSaving(true);
    const respuesta = await confirmarEgreso(egreso.id, {
      con_reembolso: esDevolucion && conReembolso,
      monto_reembolso: esDevolucion && conReembolso ? NUMERO(monto) : null,
      metodo_pago: esDevolucion && conReembolso ? metodoPago : null,
      caja_tipo: esDevolucion && conReembolso ? cajaTipo : null,
      caja_id: esDevolucion && conReembolso ? Number(cajaId) : null,
      referencia_pago: referenciaPago.trim() || null,
    });
    setSaving(false);

    if (!respuesta.ok) {
      const mensaje = extraerMensajeError(respuesta, 'No se pudo confirmar el egreso.');
      setError(mensaje);
      await notificarError(mensaje);
      return;
    }
    await notificarExito('El egreso fue confirmado y el stock fue actualizado.');
    limpiarFormulario();
    onConfirmado?.();
    onCerrar();
  }

  return (
    <FormModal
      abierto={abierto}
      titulo="Confirmar Egreso"
      subtitulo={egreso?.id_personalizado || `Egreso #${egreso?.id ?? ''}`}
      onCerrar={cerrar}
      onSubmit={confirmar}
      saving={saving}
      saveLabel="Confirmar Egreso"
      error={error}
      maxWidth={820}
      scrollable
    >
      <div className="egreso-modal-products">
        <table className="finance-table">
          <thead>
            <tr><th>Producto</th><th>Cantidad</th><th>Costo</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            {detalles.map((detalle) => (
              <tr key={detalle.id}>
                <td>{detalle.nombre || '—'}</td>
                <td>{detalle.cantidad}</td>
                <td>{FMT(detalle.costo_unitario)}</td>
                <td className="finance-amount">{FMT(detalle.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="finance-modal-summary">
        <div><span>Total de líneas</span><strong>{detalles.length}</strong></div>
        <div><span>Costo total a retirar</span><strong>{FMT(costoTotal)}</strong></div>
      </div>

      {esDevolucion && (
        <div className="finance-section" style={{ marginTop: 18 }}>
          <div className="finance-section__header"><h3>Reembolso del proveedor</h3></div>
          <div className="finance-section__body">
            <label style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
              <input
                type="checkbox"
                checked={conReembolso}
                onChange={(event) => {
                  const activo = event.target.checked;
                  setConReembolso(activo);
                  if (activo && !cajaId) setCajaId(cajasBanco[0]?.id || cajasChicas[0]?.id || '');
                }}
              />
              ¿Habrá reembolso del proveedor?
            </label>
            {conReembolso && (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Monto del reembolso *</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={monto}
                    onChange={(event) => setMonto(event.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Método de pago *</label>
                  <select className="form-control" value={metodoPago} onChange={(event) => setMetodoPago(event.target.value)}>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo de caja *</label>
                  <select
                    className="form-control"
                    value={cajaTipo}
                    onChange={(event) => {
                      const tipo = event.target.value;
                      setCajaTipo(tipo);
                      setCajaId(tipo === 'BANCO' ? cajasBanco[0]?.id || '' : cajasChicas[0]?.id || '');
                    }}
                  >
                    <option value="BANCO">Caja Banco</option>
                    <option value="CHICA">Caja Chica</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Caja destino *</label>
                  <select
                    className="form-control"
                    value={cajaId}
                    onChange={(event) => setCajaId(event.target.value)}
                    disabled={loadingCajas}
                  >
                    <option value="">{loadingCajas ? 'Cargando...' : 'Seleccione una caja abierta'}</option>
                    {cajasDisponibles.map((caja) => (
                      <option key={caja.id} value={caja.id}>
                        #{caja.id} · Saldo {FMT(caja.saldo_actual ?? caja.monto_actual)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group full">
                  <label className="form-label">Referencia de pago</label>
                  <input
                    className="form-control"
                    value={referenciaPago}
                    onChange={(event) => setReferenciaPago(event.target.value)}
                  />
                </div>
                <div className="finance-alert finance-alert--warning form-group full">
                  El reembolso se registrará en caja automáticamente al confirmar.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="finance-alert finance-alert--warning" style={{ marginTop: 18 }}>
        <AlertTriangle size={18} />
        <span>Esta acción es irreversible. El stock se descontará permanentemente.</span>
      </div>
    </FormModal>
  );
}
