// cliente/src/pages/CuentasPagar/CuentasPagarPage.jsx
import { CalendarClock, CircleDollarSign, HandCoins, Plus, ReceiptText, Search, TrendingUp, WalletCards } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../api/api';
import FilterCard, { FilterItem, filterInputStyle } from '../../components/common/FilterCard';
import StatCard from '../../components/common/StatCard';
import TableCard from '../../components/common/TableCard';
import BarraProgreso from '../../components/shared/BarraProgreso';
import CuentaHistorialDrawer from '../../components/shared/CuentaHistorialDrawer';
import EstadoBadge from '../../components/shared/EstadoBadge';
import '../../components/shared/FinanceModule.css';
import { useAuth } from '../../context/AuthContext';
import { confirmarAccionDestructiva, notificarError, notificarExito } from '../../utils/confirmaciones';
import { CAMPO, FECHA, FECHAHORA, FMT, HOY, NUMERO, PORCENTAJE, RESULTADO_LISTA } from '../../utils/formato';
import { NuevaCuentaPagarModal, PagoCuentaPagarModal } from './CuentasPagarModal';

const FILTROS_INICIALES = {
  periodo: 'TODOS',
  estado: '',
  tipo: '',
  buscar: '',
};

function fechaCuenta(cuenta) {
  return CAMPO(cuenta, 'fechaEmision', 'fecha_emision', cuenta.fecha);
}

function pertenecePeriodo(valor, periodo) {
  if (periodo === 'TODOS') return true;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return false;
  const hoy = new Date();
  if (periodo === 'MES') return fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth();
  if (periodo === 'TRES_MESES') {
    const limite = new Date(hoy);
    limite.setMonth(limite.getMonth() - 3);
    return fecha >= limite;
  }
  return fecha.getFullYear() === hoy.getFullYear();
}

export default function CuentasPagarPage() {
  const { isAdmin } = useAuth();
  const [cuentas, setCuentas] = useState([]);
  const [cajasBanco, setCajasBanco] = useState([]);
  const [cajasChicas, setCajasChicas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [ultimoPago, setUltimoPago] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  const [modalNueva, setModalNueva] = useState(false);
  const [modalPago, setModalPago] = useState(false);
  const [drawer, setDrawer] = useState(false);

  const cargarUltimoPago = useCallback(async (lista) => {
    const candidatas = lista
      .filter((cuenta) => NUMERO(CAMPO(cuenta, 'montoAbonado', 'monto_abonado')) > 0)
      .sort((a, b) => new Date(CAMPO(b, 'updatedAt', 'updated_at', 0)) - new Date(CAMPO(a, 'updatedAt', 'updated_at', 0)))
      .slice(0, 5);
    if (candidatas.length === 0) {
      setUltimoPago(null);
      return;
    }
    const resultados = await Promise.allSettled(
      candidatas.map((cuenta) => api.get(`/cuentas/${cuenta.id}/movimientos`)),
    );
    const pagos = resultados.flatMap((resultado) => (
      resultado.status === 'fulfilled' && resultado.value.ok
        ? RESULTADO_LISTA(resultado.value)
        : []
    )).filter((movimiento) => ['PAGO', 'ABONO'].includes(CAMPO(movimiento, 'tipoMovimiento', 'tipo_movimiento')));
    pagos.sort((a, b) => new Date(CAMPO(b, 'createdAt', 'created_at', 0)) - new Date(CAMPO(a, 'createdAt', 'created_at', 0)));
    setUltimoPago(pagos[0] || null);
  }, []);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [cuentasResultado, bancoResultado, chicaResultado] = await Promise.allSettled([
      api.get('/cuentas?tipo=PAGAR&limit=200'),
      api.get('/caja-banco/lista?estado=ABIERTA&limit=100'),
      api.get('/caja-chica/lista?estado=ABIERTA&limit=100'),
    ]);
    setLoading(false);

    if (cuentasResultado.status !== 'fulfilled' || !cuentasResultado.value.ok) {
      setCuentas([]);
      await notificarError(cuentasResultado.value, 'No se pudieron cargar las cuentas por pagar.');
    } else {
      const lista = RESULTADO_LISTA(cuentasResultado.value);
      setCuentas(lista);
      cargarUltimoPago(lista);
    }
    setCajasBanco(
      bancoResultado.status === 'fulfilled' && bancoResultado.value.ok
        ? RESULTADO_LISTA(bancoResultado.value).filter((caja) => caja.estado === 'ABIERTA')
        : [],
    );
    setCajasChicas(
      chicaResultado.status === 'fulfilled' && chicaResultado.value.ok
        ? RESULTADO_LISTA(chicaResultado.value).filter((caja) => caja.estado === 'ABIERTA')
        : [],
    );
  }, [cargarUltimoPago]);

  useEffect(() => { cargar(); }, [cargar]);

  const cuentasFiltradas = useMemo(() => cuentas.filter((cuenta) => {
    const texto = `${CAMPO(cuenta, 'terceroNombre', 'tercero_nombre', '')} ${cuenta.observacion || ''}`.toLowerCase();
    const coincideBusqueda = !filtros.buscar || texto.includes(filtros.buscar.toLowerCase());
    const coincideEstado = !filtros.estado || cuenta.estado === filtros.estado;
    const tipo = CAMPO(cuenta, 'tipoCuentaPorPagar', 'tipo_cuenta_por_pagar', '');
    return coincideBusqueda
      && coincideEstado
      && (!filtros.tipo || String(tipo).toUpperCase() === filtros.tipo)
      && pertenecePeriodo(fechaCuenta(cuenta), filtros.periodo);
  }), [cuentas, filtros]);

  const resumen = useMemo(() => {
    const valores = cuentas.reduce((acumulado, cuenta) => {
      const total = NUMERO(CAMPO(cuenta, 'montoTotal', 'monto_total'));
      const pagado = NUMERO(CAMPO(cuenta, 'montoAbonado', 'monto_abonado'));
      acumulado.total += total;
      acumulado.pagado += pagado;
      acumulado.pendiente += NUMERO(cuenta.saldo);
      acumulado.activas += ['PENDIENTE', 'PARCIAL', 'VENCIDA'].includes(cuenta.estado) ? 1 : 0;
      return acumulado;
    }, { total: 0, pagado: 0, pendiente: 0, activas: 0 });
    const vencimientos = cuentas
      .filter((cuenta) => ['PENDIENTE', 'PARCIAL', 'VENCIDA'].includes(cuenta.estado))
      .map((cuenta) => CAMPO(cuenta, 'fechaVencimiento', 'fecha_vencimiento'))
      .filter(Boolean)
      .sort();
    const deudaPeriodo = cuentasFiltradas.reduce(
      (total, cuenta) => total + NUMERO(CAMPO(cuenta, 'montoTotal', 'monto_total')),
      0,
    );
    return {
      ...valores,
      promedio: cuentas.length ? valores.total / cuentas.length : 0,
      porcentajePagado: PORCENTAJE(valores.pagado, valores.total),
      proximoVencimiento: vencimientos.find((fecha) => fecha >= HOY) || vencimientos[0],
      deudaPeriodo,
    };
  }, [cuentas, cuentasFiltradas]);

  async function abrirHistorial(cuenta) {
    setCuentaSeleccionada(cuenta);
    setMovimientos([]);
    setDrawer(true);
    setLoadingHistorial(true);
    const respuesta = await api.get(`/cuentas/${cuenta.id}/movimientos`);
    setLoadingHistorial(false);
    if (!respuesta.ok) {
      await notificarError(respuesta, 'No se pudo cargar el historial.');
      return;
    }
    setMovimientos(RESULTADO_LISTA(respuesta));
  }

  function abrirPago(cuenta) {
    setCuentaSeleccionada(cuenta);
    setModalPago(true);
  }

  async function anular(cuenta) {
    const confirmado = await confirmarAccionDestructiva(
      `La cuenta de ${CAMPO(cuenta, 'terceroNombre', 'tercero_nombre', 'este tercero')} quedará anulada y conservará su historial.`,
      'Anular cuenta por pagar',
      'Sí, anular',
    );
    if (!confirmado) return;
    const respuesta = await api.put(`/cuentas/${cuenta.id}/cancelar`, {});
    if (!respuesta.ok) {
      await notificarError(respuesta, 'No se pudo anular la cuenta.');
      return;
    }
    await notificarExito('La cuenta fue anulada.');
    cargar();
  }

  return (
    <div className="page finance-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cuentas por Pagar</h1>
          <p className="page-subtitle">Gestión de deudas que tenemos con terceros</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setModalNueva(true)}>
            <Plus size={16} /> Nueva cuenta manual
          </button>
        )}
      </div>

      <div className="finance-kpi-grid">
        <StatCard icon={<CircleDollarSign size={21} />} label="Total pendiente" value={FMT(resumen.pendiente)} color="#e74c3c" />
        <StatCard icon={<WalletCards size={21} />} label="Cuentas activas" value={resumen.activas} color="#2980b9" />
        <StatCard icon={<ReceiptText size={21} />} label="Total cuentas" value={cuentas.length} color="#6c757d" />
        <StatCard icon={<HandCoins size={21} />} label="Total pagado" value={FMT(resumen.pagado)} color="#27ae60" />
        <StatCard icon={<TrendingUp size={21} />} label="% pagado" value={`${resumen.porcentajePagado.toFixed(1)}%`} color="#27ae60" />
        <StatCard label="Promedio por cuenta" value={FMT(resumen.promedio)} color="#6f42c1" />
        <StatCard label="Deuda del período" value={FMT(resumen.deudaPeriodo)} color="#e67e22" />
        <StatCard label="Último pago" value={ultimoPago ? FMT(ultimoPago.monto) : '—'} subtext={ultimoPago ? FECHAHORA(CAMPO(ultimoPago, 'createdAt', 'created_at')) : 'Sin pagos'} color="#27ae60" />
        <StatCard icon={<CalendarClock size={21} />} label="Próximo vencimiento" value={FECHA(resumen.proximoVencimiento)} color="#e74c3c" />
      </div>

      <div className="finance-global-progress">
        <div className="finance-global-progress__labels">
          <span>Pagado {resumen.porcentajePagado.toFixed(1)}%</span>
          <span>Pendiente {(100 - resumen.porcentajePagado).toFixed(1)}%</span>
        </div>
        <BarraProgreso completado={resumen.porcentajePagado} />
      </div>

      <FilterCard
        titulo="Filtros"
        onLimpiar={() => setFiltros(FILTROS_INICIALES)}
        resultado={`${cuentasFiltradas.length} cuenta${cuentasFiltradas.length === 1 ? '' : 's'}`}
      >
        <FilterItem label="Período">
          <select style={filterInputStyle} value={filtros.periodo} onChange={(evento) => setFiltros({ ...filtros, periodo: evento.target.value })}>
            <option value="MES">Este mes</option>
            <option value="TRES_MESES">Últimos 3 meses</option>
            <option value="ANIO">Este año</option>
            <option value="TODOS">Todos</option>
          </select>
        </FilterItem>
        <FilterItem label="Estado">
          <select style={filterInputStyle} value={filtros.estado} onChange={(evento) => setFiltros({ ...filtros, estado: evento.target.value })}>
            <option value="">Todas</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="PARCIAL">Parcial</option>
            <option value="PAGADA">Pagada</option>
            <option value="VENCIDA">Vencida</option>
            <option value="ANULADA">Anulada</option>
          </select>
        </FilterItem>
        <FilterItem label="Tipo">
          <select style={filterInputStyle} value={filtros.tipo} onChange={(evento) => setFiltros({ ...filtros, tipo: evento.target.value })}>
            <option value="">Todas</option>
            <option value="DEUDA">Deuda</option>
            <option value="PRESTAMO">Préstamo</option>
          </select>
        </FilterItem>
        <FilterItem label="Buscar" span={2}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: 9, color: '#6c757d' }} />
            <input style={{ ...filterInputStyle, paddingLeft: 32 }} placeholder="Tercero u observación" value={filtros.buscar} onChange={(evento) => setFiltros({ ...filtros, buscar: evento.target.value })} />
          </div>
        </FilterItem>
      </FilterCard>

      <TableCard loading={loading} empty={!loading && cuentasFiltradas.length === 0} emptyText="No existen cuentas por pagar para los filtros seleccionados.">
        <table className="finance-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Observación</th>
              <th>Tipo</th>
              <th>Tercero</th>
              <th>Creado por</th>
              <th>Monto total</th>
              <th>Pagado</th>
              <th>Saldo</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th>Progreso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cuentasFiltradas.map((cuenta) => {
              const total = NUMERO(CAMPO(cuenta, 'montoTotal', 'monto_total'));
              const pagado = NUMERO(CAMPO(cuenta, 'montoAbonado', 'monto_abonado'));
              const activa = ['PENDIENTE', 'PARCIAL', 'VENCIDA'].includes(cuenta.estado);
              return (
                <tr key={cuenta.id}>
                  <td>{FECHA(fechaCuenta(cuenta))}</td>
                  <td>{cuenta.observacion || '—'}</td>
                  <td>{CAMPO(cuenta, 'tipoCuentaPorPagar', 'tipo_cuenta_por_pagar', 'Deuda')}</td>
                  <td>{CAMPO(cuenta, 'terceroNombre', 'tercero_nombre', '—')}</td>
                  <td>{CAMPO(cuenta, 'usuarioNombre', 'usuario_nombre', '—')}</td>
                  <td>{FMT(total)}</td>
                  <td className="finance-amount finance-amount--positive">{FMT(pagado)}</td>
                  <td className="finance-amount finance-amount--negative">{FMT(cuenta.saldo)}</td>
                  <td>{FECHA(CAMPO(cuenta, 'fechaVencimiento', 'fecha_vencimiento'))}</td>
                  <td><EstadoBadge estado={cuenta.estado} /></td>
                  <td><BarraProgreso completado={PORCENTAJE(pagado, total)} compacta /></td>
                  <td>
                    <div className="finance-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => abrirHistorial(cuenta)}>Historial</button>
                      {activa && <button className="btn btn-primary btn-sm" onClick={() => abrirPago(cuenta)}>Pagar</button>}
                      {isAdmin && activa && <button className="btn btn-danger btn-sm" onClick={() => anular(cuenta)}>Anular</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>

      <NuevaCuentaPagarModal abierto={modalNueva} onCerrar={() => setModalNueva(false)} onGuardado={cargar} cajasBanco={cajasBanco} />
      <PagoCuentaPagarModal abierto={modalPago} cuenta={cuentaSeleccionada} cajasBanco={cajasBanco} cajasChicas={cajasChicas} onCerrar={() => setModalPago(false)} onGuardado={cargar} />
      <CuentaHistorialDrawer open={drawer} onClose={() => setDrawer(false)} cuenta={cuentaSeleccionada} movimientos={movimientos} loading={loadingHistorial} titulo="Historial de pagos" />
    </div>
  );
}
