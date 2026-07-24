// cliente/src/pages/cajas/CuentasPagar.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../api/api';
import FormModal from '../../components/common/FormModal';
import StatCard from '../../components/common/StatCard';
import TableCard from '../../components/common/TableCard';

const dinero = valor => Number(valor || 0).toLocaleString('es-EC', {
  style: 'currency',
  currency: 'USD',
});

const fecha = valor => (
  valor
    ? new Date(`${String(valor).slice(0, 10)}T00:00:00`).toLocaleDateString('es-EC')
    : '—'
);

const valor = (objeto, camel, snake) => objeto?.[camel] ?? objeto?.[snake];

const estadoEstilo = {
  PENDIENTE: { background: '#fff3cd', color: '#856404' },
  PARCIAL: { background: '#d1ecf1', color: '#0c5460' },
  PAGADA: { background: '#d4edda', color: '#155724' },
  VENCIDA: { background: '#f8d7da', color: '#721c24' },
  ANULADA: { background: '#e2e3e5', color: '#383d41' },
};

const cuentaInicial = {
  terceroNombre: '',
  montoTotal: '',
  fechaVencimiento: '',
  observacion: '',
};

const pagoInicial = {
  monto: '',
  metodoPago: 'EFECTIVO',
  cajaTipo: 'CHICA',
  cajaId: '',
  referenciaPago: '',
  observacion: '',
};

export default function CuentasPagar() {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modalCuenta, setModalCuenta] = useState(false);
  const [modalPago, setModalPago] = useState(false);
  const [modalHistorial, setModalHistorial] = useState(false);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  const [nuevaCuenta, setNuevaCuenta] = useState(cuentaInicial);
  const [pago, setPago] = useState(pagoInicial);
  const [movimientos, setMovimientos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [cajasBanco, setCajasBanco] = useState([]);
  const [cajasChicas, setCajasChicas] = useState([]);

  const cargar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ tipo: 'PAGAR', limit: '200' });
    if (filtroEstado) params.set('estado', filtroEstado);
    const respuesta = await api.get(`/cuentas?${params}`);
    if (respuesta.ok) {
      setCuentas(respuesta.data.resultado || []);
      setError('');
    } else {
      setError(respuesta.data?.mensaje || 'No se pudieron cargar las cuentas');
    }
    setLoading(false);
  }, [filtroEstado]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    Promise.all([
      api.get('/caja-banco/lista?estado=ABIERTA&limit=100'),
      api.get('/caja-chica/lista?estado=ABIERTA&limit=100'),
    ]).then(([banco, chica]) => {
      if (banco.ok) {
        setCajasBanco(
          (banco.data.resultado || []).filter(caja => caja.estado === 'ABIERTA'),
        );
      }
      if (chica.ok) {
        setCajasChicas(
          (chica.data.resultado || []).filter(caja => caja.estado === 'ABIERTA'),
        );
      }
    });
  }, []);

  useEffect(() => {
    if (!modalPago) return;
    const cajaTipo = pago.metodoPago === 'EFECTIVO' ? 'CHICA' : 'BANCO';
    const cajas = cajaTipo === 'CHICA' ? cajasChicas : cajasBanco;
    setPago(actual => ({
      ...actual,
      cajaTipo,
      cajaId: cajas.some(caja => String(caja.id) === String(actual.cajaId))
        ? actual.cajaId
        : cajas[0]?.id ?? '',
    }));
  }, [modalPago, pago.metodoPago, cajasBanco, cajasChicas]);

  const resumen = useMemo(() => cuentas.reduce((acumulado, cuenta) => {
    const saldo = Number(valor(cuenta, 'saldo', 'saldo') || 0);
    acumulado.total += Number(valor(cuenta, 'montoTotal', 'monto_total') || 0);
    acumulado.saldo += saldo;
    if (cuenta.estado === 'VENCIDA') acumulado.vencidas += 1;
    if (cuenta.estado === 'PENDIENTE' || cuenta.estado === 'PARCIAL') {
      acumulado.activas += 1;
    }
    return acumulado;
  }, {
    total: 0,
    saldo: 0,
    vencidas: 0,
    activas: 0,
  }), [cuentas]);

  async function crearCuenta(evento) {
    evento.preventDefault();
    if (!nuevaCuenta.terceroNombre.trim() || !(Number(nuevaCuenta.montoTotal) > 0)) {
      setError('Acreedor y monto son requeridos');
      return;
    }
    setSaving(true);
    const operacionId = crypto.randomUUID();
    const respuesta = await api.post('/cuentas/pagar', {
      operacion_id: operacionId,
      idempotency_key: `CUENTA_PAGAR:${operacionId}`,
      tipo_cuenta_por_pagar: 'Prestamo',
      tercero_nombre: nuevaCuenta.terceroNombre.trim(),
      tercero_tipo: 'OTRO',
      monto_total: Number(nuevaCuenta.montoTotal),
      fecha_vencimiento: nuevaCuenta.fechaVencimiento || null,
      referencia_tipo: 'CUENTA_MANUAL',
      referencia_codigo: operacionId,
      observacion: nuevaCuenta.observacion.trim() || null,
    });
    setSaving(false);
    if (!respuesta.ok) {
      setError(respuesta.data?.mensaje || 'No se pudo crear la cuenta');
      return;
    }
    setModalCuenta(false);
    setNuevaCuenta(cuentaInicial);
    await cargar();
  }

  function abrirPago(cuenta) {
    setCuentaSeleccionada(cuenta);
    setPago({
      ...pagoInicial,
      monto: String(valor(cuenta, 'saldo', 'saldo') || ''),
    });
    setError('');
    setModalPago(true);
  }

  async function registrarPago(evento) {
    evento.preventDefault();
    if (!(Number(pago.monto) > 0) || !pago.cajaId) {
      setError('Monto y caja abierta son requeridos');
      return;
    }
    setSaving(true);
    const operacionId = crypto.randomUUID();
    const cuentaId = valor(cuentaSeleccionada, 'id', 'id');
    const respuesta = await api.post(`/cuentas/${cuentaId}/pagos`, {
      operacion_id: operacionId,
      idempotency_key: `PAGO_CUENTA:${cuentaId}:${operacionId}`,
      monto: Number(pago.monto),
      metodo_pago: pago.metodoPago,
      caja_tipo: pago.cajaTipo,
      caja_id: Number(pago.cajaId),
      referencia_pago: pago.referenciaPago.trim() || null,
      observacion: pago.observacion.trim() || null,
    });
    setSaving(false);
    if (!respuesta.ok) {
      setError(respuesta.data?.mensaje || 'No se pudo registrar el pago');
      return;
    }
    setModalPago(false);
    setCuentaSeleccionada(null);
    await cargar();
  }

  async function abrirHistorial(cuenta) {
    setCuentaSeleccionada(cuenta);
    setMovimientos([]);
    setModalHistorial(true);
    const cuentaId = valor(cuenta, 'id', 'id');
    const respuesta = await api.get(`/cuentas/${cuentaId}/movimientos`);
    if (respuesta.ok) setMovimientos(respuesta.data.resultado || []);
  }

  const cajasPago = pago.cajaTipo === 'CHICA' ? cajasChicas : cajasBanco;

  return (
    <div className="page">
      <div className="page-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
      }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>Cuentas por pagar</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Compras a crédito, préstamos y pagos a proveedores
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalCuenta(true)}>
          + Nueva cuenta manual
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <StatCard label="Cuentas activas" value={resumen.activas} color="#3498db" />
        <StatCard label="Total registrado" value={dinero(resumen.total)} color="#6f42c1" />
        <StatCard label="Saldo pendiente" value={dinero(resumen.saldo)} color="#dc3545" />
        <StatCard label="Vencidas" value={resumen.vencidas} color="#fd7e14" />
      </div>

      <div className="card" style={{ padding: 16 }}>
        <label className="form-label" htmlFor="estado-cuenta">Estado</label>
        <select
          id="estado-cuenta"
          className="form-control"
          value={filtroEstado}
          onChange={evento => setFiltroEstado(evento.target.value)}
          style={{ maxWidth: 260 }}
        >
          <option value="">Todos</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="PARCIAL">Parciales</option>
          <option value="PAGADA">Pagadas</option>
          <option value="VENCIDA">Vencidas</option>
          <option value="ANULADA">Anuladas</option>
        </select>
      </div>

      <TableCard
        loading={loading}
        empty={!loading && cuentas.length === 0}
        emptyText="No existen cuentas por pagar para los filtros seleccionados"
      >
        <table>
          <thead>
            <tr>
              <th>Acreedor</th>
              <th>Origen</th>
              <th>Emisión</th>
              <th>Vencimiento</th>
              <th>Total</th>
              <th>Pagado</th>
              <th>Saldo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cuentas.map(cuenta => {
              const estilo = estadoEstilo[cuenta.estado] || estadoEstilo.PENDIENTE;
              const activa = ['PENDIENTE', 'PARCIAL'].includes(cuenta.estado);
              return (
                <tr key={cuenta.id}>
                  <td>{valor(cuenta, 'terceroNombre', 'tercero_nombre') || '—'}</td>
                  <td>{cuenta.origen || '—'}</td>
                  <td>{fecha(valor(cuenta, 'fechaEmision', 'fecha_emision'))}</td>
                  <td>{fecha(valor(cuenta, 'fechaVencimiento', 'fecha_vencimiento'))}</td>
                  <td>{dinero(valor(cuenta, 'montoTotal', 'monto_total'))}</td>
                  <td>{dinero(valor(cuenta, 'montoAbonado', 'monto_abonado'))}</td>
                  <td style={{ fontWeight: 700 }}>{dinero(cuenta.saldo)}</td>
                  <td>
                    <span style={{ ...estilo, padding: '3px 9px', borderRadius: 99 }}>
                      {cuenta.estado}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => abrirHistorial(cuenta)}
                      >
                        Historial
                      </button>
                      {activa && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => abrirPago(cuenta)}
                        >
                          Pagar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>

      <FormModal
        abierto={modalCuenta}
        titulo="Nueva cuenta por pagar"
        subtitulo="Registro manual para préstamos u otras obligaciones"
        onCerrar={() => setModalCuenta(false)}
        onSubmit={crearCuenta}
        saving={saving}
        error={error}
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Acreedor</label>
            <input
              className="form-control"
              value={nuevaCuenta.terceroNombre}
              onChange={evento => setNuevaCuenta({
                ...nuevaCuenta,
                terceroNombre: evento.target.value,
              })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Monto total</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="form-control"
              value={nuevaCuenta.montoTotal}
              onChange={evento => setNuevaCuenta({
                ...nuevaCuenta,
                montoTotal: evento.target.value,
              })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Vencimiento</label>
            <input
              type="date"
              className="form-control"
              value={nuevaCuenta.fechaVencimiento}
              onChange={evento => setNuevaCuenta({
                ...nuevaCuenta,
                fechaVencimiento: evento.target.value,
              })}
            />
          </div>
          <div className="form-group full">
            <label className="form-label">Observación</label>
            <textarea
              className="form-control"
              value={nuevaCuenta.observacion}
              onChange={evento => setNuevaCuenta({
                ...nuevaCuenta,
                observacion: evento.target.value,
              })}
            />
          </div>
        </div>
      </FormModal>

      <FormModal
        abierto={modalPago}
        titulo="Registrar pago"
        subtitulo={valor(cuentaSeleccionada, 'terceroNombre', 'tercero_nombre')}
        onCerrar={() => setModalPago(false)}
        onSubmit={registrarPago}
        saving={saving}
        error={error}
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Monto</label>
            <input
              type="number"
              min="0.01"
              max={Number(cuentaSeleccionada?.saldo || 0)}
              step="0.01"
              className="form-control"
              value={pago.monto}
              onChange={evento => setPago({ ...pago, monto: evento.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Método de pago</label>
            <select
              className="form-control"
              value={pago.metodoPago}
              onChange={evento => setPago({ ...pago, metodoPago: evento.target.value })}
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">
              {pago.cajaTipo === 'CHICA' ? 'Caja chica' : 'Caja banco'}
            </label>
            <select
              className="form-control"
              value={pago.cajaId}
              onChange={evento => setPago({ ...pago, cajaId: evento.target.value })}
              required
            >
              <option value="">Seleccione una caja abierta</option>
              {cajasPago.map(caja => (
                <option key={caja.id} value={caja.id}>
                  #{caja.id} — {dinero(caja.monto_actual ?? caja.saldo_actual)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Referencia</label>
            <input
              className="form-control"
              value={pago.referenciaPago}
              onChange={evento => setPago({
                ...pago,
                referenciaPago: evento.target.value,
              })}
            />
          </div>
          <div className="form-group full">
            <label className="form-label">Observación</label>
            <textarea
              className="form-control"
              value={pago.observacion}
              onChange={evento => setPago({ ...pago, observacion: evento.target.value })}
            />
          </div>
        </div>
      </FormModal>

      <FormModal
        abierto={modalHistorial}
        titulo="Historial de la cuenta"
        subtitulo={valor(cuentaSeleccionada, 'terceroNombre', 'tercero_nombre')}
        onCerrar={() => setModalHistorial(false)}
        onSubmit={evento => evento.preventDefault()}
        hideSave
      >
        <TableCard
          noCard
          empty={movimientos.length === 0}
          emptyText="La cuenta todavía no registra movimientos"
        >
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Movimiento</th>
                <th>Monto</th>
                <th>Saldo anterior</th>
                <th>Saldo nuevo</th>
                <th>Método</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map(movimiento => (
                <tr key={movimiento.id}>
                  <td>{fecha(valor(movimiento, 'createdAt', 'created_at'))}</td>
                  <td>{valor(movimiento, 'tipoMovimiento', 'tipo_movimiento')}</td>
                  <td>{dinero(movimiento.monto)}</td>
                  <td>{dinero(valor(movimiento, 'saldoAnterior', 'saldo_anterior'))}</td>
                  <td>{dinero(valor(movimiento, 'saldoNuevo', 'saldo_nuevo'))}</td>
                  <td>{valor(movimiento, 'metodoPago', 'metodo_pago') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </FormModal>
    </div>
  );
}
