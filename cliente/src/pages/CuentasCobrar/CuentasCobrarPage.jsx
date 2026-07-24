// cliente/src/pages/CuentasCobrar/CuentasCobrarPage.jsx
import { AlertTriangle, CalendarClock, CircleDollarSign, HandCoins, Plus, ReceiptText, Search, TrendingUp, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { CAMPO, DIAS_ANTIGUEDAD, FECHA, FECHAHORA, FMT, HOY, NUMERO, PORCENTAJE, RESULTADO_LISTA } from '../../utils/formato';
import { CobroCuentaModal, NuevaCuentaCobrarModal } from './CuentasCobrarModal';

const FILTROS_INICIALES = {
  periodo: 'TODOS',
  estado: '',
  buscar: '',
  soloVencidas: false,
  antiguedad: '',
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

function coincideAntiguedad(dias, rango) {
  if (!rango) return true;
  if (rango === '0-30') return dias <= 30;
  if (rango === '31-60') return dias >= 31 && dias <= 60;
  if (rango === '61-90') return dias >= 61 && dias <= 90;
  return dias > 90;
}

function badgeAntiguedad(dias, saldo) {
  if (!(NUMERO(saldo) > 0)) return <span style={{ color: '#6c757d' }}>—</span>;
  const color = dias > 90 ? '#b91c1c' : dias > 60 ? '#dc2626' : dias > 30 ? '#d97706' : '#2980b9';
  return (
    <span style={{ padding: '3px 8px', borderRadius: 999, background: `${color}18`, color, fontSize: 11, fontWeight: 700 }}>
      {dias} días
    </span>
  );
}

export default function CuentasCobrarPage() {
  const { isAdmin } = useAuth();
  const [cuentas, setCuentas] = useState([]);
  const [cajasBanco, setCajasBanco] = useState([]);
  const [cajasChicas, setCajasChicas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [ultimoCobro, setUltimoCobro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  const [modalNueva, setModalNueva] = useState(false);
  const [modalCobro, setModalCobro] = useState(false);
  const [drawer, setDrawer] = useState(false);

  const cargarUltimoCobro = useCallback(async (lista) => {
    const candidatas = lista
      .filter((cuenta) => NUMERO(CAMPO(cuenta, 'montoAbonado', 'monto_abonado')) > 0)
      .sort((a, b) => new Date(CAMPO(b, 'updatedAt', 'updated_at', 0)) - new Date(CAMPO(a, 'updatedAt', 'updated_at', 0)))
      .slice(0, 5);
    if (candidatas.length === 0) {
      setUltimoCobro(null);
      return;
    }
    const resultados = await Promise.allSettled(
      candidatas.map((cuenta) => api.get(`/cuentas/${cuenta.id}/movimientos`)),
    );
    const cobros = resultados.flatMap((resultado) => (
      resultado.status === 'fulfilled' && resultado.value.ok
        ? RESULTADO_LISTA(resultado.value)
        : []
    )).filter((movimiento) => ['ABONO', 'PAGO'].includes(CAMPO(movimiento, 'tipoMovimiento', 'tipo_movimiento')));
    cobros.sort((a, b) => new Date(CAMPO(b, 'createdAt', 'created_at', 0)) - new Date(CAMPO(a, 'createdAt', 'created_at', 0)));
    setUltimoCobro(cobros[0] || null);
  }, []);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [cuentasResultado, bancoResultado, chicaResultado] = await Promise.allSettled([
      api.get('/cuentas?tipo=COBRAR&limit=200'),
      api.get('/caja-banco/lista?estado=ABIERTA&limit=100'),
      api.get('/caja-chica/lista?estado=ABIERTA&limit=100'),
    ]);
    setLoading(false);
    if (cuentasResultado.status !== 'fulfilled' || !cuentasResultado.value.ok) {
      setCuentas([]);
      await notificarError(cuentasResultado.value, 'No se pudieron cargar las cuentas por cobrar.');
    } else {
      const lista = RESULTADO_LISTA(cuentasResultado.value);
      setCuentas(lista);
      cargarUltimoCobro(lista);
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
  }, [cargarUltimoCobro]);

  useEffect(() => { cargar(); }, [cargar]);

  const cuentasFiltradas = useMemo(() => cuentas.filter((cuenta) => {
    const vencimiento = CAMPO(cuenta, 'fechaVencimiento', 'fecha_vencimiento');
    const dias = DIAS_ANTIGUEDAD(vencimiento);
    const texto = `${CAMPO(cuenta, 'terceroNombre', 'tercero_nombre', '')} ${CAMPO(cuenta, 'referenciaCodigo', 'referencia_codigo', '')}`.toLowerCase();
    const vencida = cuenta.estado === 'VENCIDA' || (vencimiento && vencimiento < HOY && NUMERO(cuenta.saldo) > 0);
    return (!filtros.buscar || texto.includes(filtros.buscar.toLowerCase()))
      && (!filtros.estado || cuenta.estado === filtros.estado)
      && (!filtros.soloVencidas || vencida)
      && coincideAntiguedad(dias, filtros.antiguedad)
      && pertenecePeriodo(fechaCuenta(cuenta), filtros.periodo);
  }), [cuentas, filtros]);

  const resumen = useMemo(() => {
    const valores = cuentas.reduce((acumulado, cuenta) => {
      const total = NUMERO(CAMPO(cuenta, 'montoTotal', 'monto_total'));
      const cobrado = NUMERO(CAMPO(cuenta, 'montoAbonado', 'monto_abonado'));
      const vencimiento = CAMPO(cuenta, 'fechaVencimiento', 'fecha_vencimiento');
      const vencida = cuenta.estado === 'VENCIDA' || (vencimiento && vencimiento < HOY && NUMERO(cuenta.saldo) > 0);
      acumulado.total += total;
      acumulado.cobrado += cobrado;
      acumulado.pendiente += NUMERO(cuenta.saldo);
      acumulado.activas += ['PENDIENTE', 'PARCIAL', 'VENCIDA'].includes(cuenta.estado) ? 1 : 0;
      acumulado.vencidas += vencida ? 1 : 0;
      return acumulado;
    }, { total: 0, cobrado: 0, pendiente: 0, activas: 0, vencidas: 0 });
    const limiteSemana = new Date();
    limiteSemana.setDate(limiteSemana.getDate() + 7);
    const semana = limiteSemana.toISOString().slice(0, 10);
    const vencenSemana = cuentas.filter((cuenta) => {
      const vencimiento = CAMPO(cuenta, 'fechaVencimiento', 'fecha_vencimiento');
      return vencimiento >= HOY && vencimiento <= semana && ['PENDIENTE', 'PARCIAL'].includes(cuenta.estado);
    }).length;
    const vencimientos = cuentas
      .filter((cuenta) => ['PENDIENTE', 'PARCIAL', 'VENCIDA'].includes(cuenta.estado))
      .map((cuenta) => CAMPO(cuenta, 'fechaVencimiento', 'fecha_vencimiento'))
      .filter(Boolean)
      .sort();
    return {
      ...valores,
      promedio: cuentas.length ? valores.total / cuentas.length : 0,
      porcentajeCobrado: PORCENTAJE(valores.cobrado, valores.total),
      deudaPeriodo: cuentasFiltradas.reduce((total, cuenta) => total + NUMERO(CAMPO(cuenta, 'montoTotal', 'monto_total')), 0),
      proximoVencimiento: vencimientos.find((fecha) => fecha >= HOY) || vencimientos[0],
      vencenSemana,
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

  function abrirCobro(cuenta) {
    setCuentaSeleccionada(cuenta);
    setModalCobro(true);
  }

  async function anular(cuenta) {
    const confirmado = await confirmarAccionDestructiva(
      `La cuenta de ${CAMPO(cuenta, 'terceroNombre', 'tercero_nombre', 'este cliente')} quedará anulada y conservará su historial.`,
      'Anular cuenta por cobrar',
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
          <h1 className="page-title">Cuentas por Cobrar</h1>
          <p className="page-subtitle">Gestión de créditos otorgados a clientes</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setModalNueva(true)}>
            <Plus size={16} /> Nueva cuenta manual
          </button>
        )}
      </div>

      <div className="finance-kpi-grid">
        <StatCard icon={<CircleDollarSign size={21} />} label="Total pendiente" value={FMT(resumen.pendiente)} color="#e74c3c" />
        <StatCard icon={<Users size={21} />} label="Cuentas activas" value={resumen.activas} color="#2980b9" />
        <StatCard icon={<AlertTriangle size={21} />} label="Vencidas" value={resumen.vencidas} color="#e74c3c" />
        <StatCard icon={<HandCoins size={21} />} label="Total cobrado" value={FMT(resumen.cobrado)} color="#27ae60" />
        <StatCard icon={<TrendingUp size={21} />} label="% cobrado" value={`${resumen.porcentajeCobrado.toFixed(1)}%`} color="#27ae60" />
        <StatCard label="Promedio por cuenta" value={FMT(resumen.promedio)} color="#6f42c1" />
        <StatCard label="Deuda del período" value={FMT(resumen.deudaPeriodo)} color="#e67e22" />
        <StatCard label="Último cobro" value={ultimoCobro ? FMT(ultimoCobro.monto) : '—'} subtext={ultimoCobro ? FECHAHORA(CAMPO(ultimoCobro, 'createdAt', 'created_at')) : 'Sin cobros'} color="#27ae60" />
        <StatCard icon={<CalendarClock size={21} />} label="Próximo vencimiento" value={FECHA(resumen.proximoVencimiento)} color="#e74c3c" />
      </div>

      <div className="finance-global-progress">
        <div className="finance-global-progress__labels">
          <span>Cobrado {resumen.porcentajeCobrado.toFixed(1)}%</span>
          <span>Pendiente {(100 - resumen.porcentajeCobrado).toFixed(1)}%</span>
        </div>
        <BarraProgreso completado={resumen.porcentajeCobrado} />
      </div>

      {resumen.vencidas > 0 && (
        <button className="finance-alert finance-alert--danger" type="button" onClick={() => setFiltros({ ...filtros, soloVencidas: true })}>
          <span>🔴 {resumen.vencidas} cuenta{resumen.vencidas === 1 ? '' : 's'} vencida{resumen.vencidas === 1 ? '' : 's'}</span>
          <strong>Ver todas</strong>
        </button>
      )}
      {resumen.vencenSemana > 0 && (
        <div className="finance-alert finance-alert--warning">
          <span>🟡 {resumen.vencenSemana} cuenta{resumen.vencenSemana === 1 ? '' : 's'} vence{resumen.vencenSemana === 1 ? '' : 'n'} esta semana</span>
        </div>
      )}

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
        <FilterItem label="Antigüedad">
          <select style={filterInputStyle} value={filtros.antiguedad} onChange={(evento) => setFiltros({ ...filtros, antiguedad: evento.target.value })}>
            <option value="">Todas</option>
            <option value="0-30">0-30 días</option>
            <option value="31-60">31-60 días</option>
            <option value="61-90">61-90 días</option>
            <option value="+90">+90 días</option>
          </select>
        </FilterItem>
        <FilterItem label="Buscar" span={2}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: 9, color: '#6c757d' }} />
            <input style={{ ...filterInputStyle, paddingLeft: 32 }} placeholder="Cliente o factura" value={filtros.buscar} onChange={(evento) => setFiltros({ ...filtros, buscar: evento.target.value })} />
          </div>
        </FilterItem>
        <FilterItem label="Vencidas solamente">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 34 }}>
            <input type="checkbox" checked={filtros.soloVencidas} onChange={(evento) => setFiltros({ ...filtros, soloVencidas: evento.target.checked })} />
            Mostrar solo vencidas
          </label>
        </FilterItem>
      </FilterCard>

      <TableCard loading={loading} empty={!loading && cuentasFiltradas.length === 0} emptyText="No existen cuentas por cobrar para los filtros seleccionados.">
        <table className="finance-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Factura referencia</th>
              <th>Creado por</th>
              <th>Monto total</th>
              <th>Cobrado</th>
              <th>Saldo</th>
              <th>Vencimiento</th>
              <th>Antigüedad</th>
              <th>Estado</th>
              <th>Progreso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cuentasFiltradas.map((cuenta) => {
              const total = NUMERO(CAMPO(cuenta, 'montoTotal', 'monto_total'));
              const cobrado = NUMERO(CAMPO(cuenta, 'montoAbonado', 'monto_abonado'));
              const vencimiento = CAMPO(cuenta, 'fechaVencimiento', 'fecha_vencimiento');
              const dias = DIAS_ANTIGUEDAD(vencimiento);
              const activa = ['PENDIENTE', 'PARCIAL', 'VENCIDA'].includes(cuenta.estado);
              const facturaId = CAMPO(cuenta, 'referenciaId', 'referencia_id');
              return (
                <tr key={cuenta.id}>
                  <td>{FECHA(fechaCuenta(cuenta))}</td>
                  <td>{CAMPO(cuenta, 'terceroNombre', 'tercero_nombre', '—')}</td>
                  <td>
                    {facturaId ? (
                      <Link to={`/facturas/${facturaId}`}>{CAMPO(cuenta, 'referenciaCodigo', 'referencia_codigo', `#${facturaId}`)}</Link>
                    ) : CAMPO(cuenta, 'referenciaCodigo', 'referencia_codigo', '—')}
                  </td>
                  <td>{CAMPO(cuenta, 'usuarioNombre', 'usuario_nombre', '—')}</td>
                  <td>{FMT(total)}</td>
                  <td className="finance-amount finance-amount--positive">{FMT(cobrado)}</td>
                  <td className="finance-amount finance-amount--negative">{FMT(cuenta.saldo)}</td>
                  <td>{FECHA(vencimiento)}</td>
                  <td>{badgeAntiguedad(dias, cuenta.saldo)}</td>
                  <td><EstadoBadge estado={cuenta.estado} /></td>
                  <td><BarraProgreso completado={PORCENTAJE(cobrado, total)} compacta /></td>
                  <td>
                    <div className="finance-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => abrirHistorial(cuenta)}>Historial</button>
                      {activa && <button className="btn btn-primary btn-sm" onClick={() => abrirCobro(cuenta)}>Cobrar</button>}
                      {isAdmin && activa && <button className="btn btn-danger btn-sm" onClick={() => anular(cuenta)}>Anular</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>

      <NuevaCuentaCobrarModal abierto={modalNueva} onCerrar={() => setModalNueva(false)} onGuardado={cargar} />
      <CobroCuentaModal abierto={modalCobro} cuenta={cuentaSeleccionada} cajasBanco={cajasBanco} cajasChicas={cajasChicas} onCerrar={() => setModalCobro(false)} onGuardado={cargar} />
      <CuentaHistorialDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        cuenta={cuentaSeleccionada}
        movimientos={movimientos}
        loading={loadingHistorial}
        titulo="Historial de cobros"
        extra={CAMPO(cuentaSeleccionada, 'referenciaId', 'referencia_id') ? (
          <div style={{ marginBottom: 18 }}>
            <Link className="btn btn-ghost btn-sm" to={`/facturas/${CAMPO(cuentaSeleccionada, 'referenciaId', 'referencia_id')}`}>
              <ReceiptText size={15} /> Ver factura original
            </Link>
          </div>
        ) : null}
      />
    </div>
  );
}
