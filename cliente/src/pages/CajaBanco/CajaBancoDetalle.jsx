// cliente/src/pages/CajaBanco/CajaBancoDetalle.jsx
import {
  ArrowLeft,
  BanknoteArrowDown,
  BanknoteArrowUp,
  CircleDollarSign,
  Landmark,
  Plus,
  Printer,
  WalletCards,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/api';
import RegistrarMovimientoBancoModal from '../../components/cajas/RegistrarMovimientoBancoModal';
import FilterCard, { FilterItem, filterInputStyle } from '../../components/common/FilterCard';
import StatCard from '../../components/common/StatCard';
import TableCard from '../../components/common/TableCard';
import EstadoBadge from '../../components/shared/EstadoBadge';
import '../../components/shared/FinanceModule.css';
import ResumenFinanciero from '../../components/shared/ResumenFinanciero';
import { useAuth } from '../../context/AuthContext';
import { notificarError } from '../../utils/confirmaciones';
import { imprimirCaja } from '../../utils/imprimirCaja';
import {
  CAMPO,
  FECHA,
  FECHAHORA,
  FMT,
  NUMERO,
  RESULTADO_LISTA,
} from '../../utils/formato';
import { CajaBancoCierreModal } from './CajaBancoModal';

const PAGE_SIZE = 20;

const CATEGORIAS = {
  APERTURA: 'Apertura',
  REPOSICION_CAJA_CHICA: 'Reposición Caja Chica',
  TRANSFERENCIA_ENTRADA: 'Ingreso desde Caja Chica',
  DEVOLUCION_CAJA_CHICA: 'Devolución Caja Chica',
  TRANSFERENCIA_CLIENTE: 'Transferencia de cliente',
  VENTA_EFECTIVO: 'Venta en efectivo',
  VENTA_TRANSFERENCIA: 'Venta por transferencia',
  COBRO_DEUDA_EFECTIVO: 'Cobro de deuda',
  COBRO_DEUDA_TRANSFERENCIA: 'Cobro por transferencia',
  ACREDITACION_TARJETA: 'Acreditación de tarjeta',
  COMISION_BANCARIA: 'Comisión bancaria',
  RETENCION_BANCARIA: 'Retención bancaria',
  PAGO_PROVEEDOR: 'Pago a proveedor',
  AJUSTE: 'Ajuste',
  OTRO_INGRESO: 'Otro ingreso',
  OTRO_EGRESO: 'Otro egreso',
};

function Info({ label, value }) {
  return (
    <div>
      <div className="finance-info__label">{label}</div>
      <div className="finance-info__value">{value}</div>
    </div>
  );
}

export default function CajaBancoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [caja, setCaja] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cajasChicas, setCajasChicas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [modalCierre, setModalCierre] = useState(false);
  const [page, setPage] = useState(0);
  const [filtros, setFiltros] = useState({
    tipo: '',
    categoria: '',
    fechaDesde: '',
    fechaHasta: '',
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({ limit: '200', page: '0' });
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor) query.set(clave, valor);
    });
    const resultados = await Promise.allSettled([
      api.get(`/caja-banco/buscar/${id}`),
      api.get(`/caja-banco/${id}/movimientos?${query}`),
      api.get(`/caja-chica/lista?cajaBancoId=${id}&limit=100`),
    ]);
    const [cajaResultado, movimientoResultado, chicasResultado] = resultados;
    setLoading(false);

    if (cajaResultado.status !== 'fulfilled' || !cajaResultado.value.ok) {
      await notificarError(cajaResultado.value, 'No se pudo cargar la Caja Banco.');
      return;
    }
    setCaja(cajaResultado.value.data.resultado);
    setMovimientos(
      movimientoResultado.status === 'fulfilled' && movimientoResultado.value.ok
        ? RESULTADO_LISTA(movimientoResultado.value)
        : [],
    );
    setCajasChicas(
      chicasResultado.status === 'fulfilled' && chicasResultado.value.ok
        ? RESULTADO_LISTA(chicasResultado.value)
        : [],
    );
  }, [filtros, id]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { setPage(0); }, [filtros]);

  const resumen = useMemo(() => movimientos.reduce((total, movimiento) => {
    const monto = NUMERO(movimiento.monto);
    if (movimiento.tipo === 'INGRESO') total.ingresos += monto;
    if (movimiento.tipo === 'EGRESO') total.egresos += monto;
    if (
      movimiento.tipo === 'INGRESO'
      && ['TRANSFERENCIA_ENTRADA', 'DEVOLUCION_CAJA_CHICA'].includes(movimiento.categoria)
    ) total.ingresosChicas += monto;
    return total;
  }, { ingresos: 0, egresos: 0, ingresosChicas: 0 }), [movimientos]);

  const categorias = useMemo(() => {
    const acumulado = new Map();
    movimientos.forEach((movimiento) => {
      const clave = movimiento.categoria || 'SIN_CATEGORIA';
      const signo = movimiento.tipo === 'EGRESO' ? -1 : 1;
      acumulado.set(clave, (acumulado.get(clave) || 0) + signo * NUMERO(movimiento.monto));
    });
    return [...acumulado.entries()]
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  }, [movimientos]);

  if (loading) {
    return <div className="page"><div className="spinner-wrapper"><div className="spinner" /></div></div>;
  }
  if (!caja) {
    return (
      <div className="page">
        <div className="empty-state">Caja Banco no encontrada.</div>
        <button className="btn btn-ghost" onClick={() => navigate('/caja-banco')}><ArrowLeft size={16} /> Volver</button>
      </div>
    );
  }

  const abierta = caja.estado === 'ABIERTA';
  const filas = movimientos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const otrosIngresos = resumen.ingresos - resumen.ingresosChicas;

  return (
    <div className="page finance-page">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-title">Caja Banco — {FECHA(caja.fecha)}</h1>
            <EstadoBadge estado={caja.estado} />
          </div>
          <p className="page-subtitle">
            Apertura {FECHAHORA(caja.fecha_apertura || caja.created_at)} · {caja.usuario_nombre || 'Sin usuario'}
          </p>
        </div>
        <div className="finance-actions no-print">
          <button className="btn btn-ghost" onClick={() => imprimirCaja({
            caja,
            movimientos,
            tipoCaja: 'BANCO',
            cajasChicas,
            resumen,
          })}><Printer size={16} /> Imprimir</button>
          {abierta && isAdmin && (
            <button className="btn btn-primary" onClick={() => setModalMovimiento(true)}>
              <Plus size={16} /> Movimiento
            </button>
          )}
          {abierta && isAdmin && (
            <button className="btn btn-danger" onClick={() => setModalCierre(true)}>Cerrar Caja</button>
          )}
          <button className="btn btn-ghost" onClick={() => navigate('/caja-banco')}><ArrowLeft size={16} /> Volver</button>
        </div>
      </div>

      <div className="finance-kpi-grid">
        <StatCard icon={<WalletCards size={21} />} label="Saldo inicial" value={FMT(caja.saldo_inicial)} color="#2980b9" />
        <StatCard icon={<BanknoteArrowDown size={21} />} label="Ing. Cajas Chicas" value={FMT(resumen.ingresosChicas)} color="#27ae60" />
        <StatCard icon={<BanknoteArrowDown size={21} />} label="Otros ingresos" value={FMT(otrosIngresos)} color="#27ae60" />
        <StatCard icon={<BanknoteArrowUp size={21} />} label="Total egresos" value={FMT(resumen.egresos)} color="#e74c3c" />
        <StatCard icon={<CircleDollarSign size={21} />} label="Saldo actual" value={FMT(caja.saldo_actual)} color={NUMERO(caja.saldo_actual) >= 0 ? '#27ae60' : '#e74c3c'} />
      </div>

      <FilterCard
        titulo="Movimientos financieros"
        onLimpiar={() => setFiltros({ tipo: '', categoria: '', fechaDesde: '', fechaHasta: '' })}
        extra={<ResumenFinanciero ingresos={resumen.ingresos} egresos={resumen.egresos} />}
      >
        <FilterItem label="Tipo">
          <select style={filterInputStyle} value={filtros.tipo} onChange={(event) => setFiltros({ ...filtros, tipo: event.target.value })}>
            <option value="">Todos</option>
            <option value="INGRESO">Ingreso</option>
            <option value="EGRESO">Egreso</option>
          </select>
        </FilterItem>
        <FilterItem label="Categoría">
          <select style={filterInputStyle} value={filtros.categoria} onChange={(event) => setFiltros({ ...filtros, categoria: event.target.value })}>
            <option value="">Todas</option>
            {Object.entries(CATEGORIAS).map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
          </select>
        </FilterItem>
        <FilterItem label="Fecha desde">
          <input type="date" style={filterInputStyle} value={filtros.fechaDesde} onChange={(event) => setFiltros({ ...filtros, fechaDesde: event.target.value })} />
        </FilterItem>
        <FilterItem label="Fecha hasta">
          <input type="date" style={filterInputStyle} value={filtros.fechaHasta} onChange={(event) => setFiltros({ ...filtros, fechaHasta: event.target.value })} />
        </FilterItem>
      </FilterCard>

      {categorias.length > 0 && (
        <div className="finance-section" style={{ overflow: 'visible' }}>
          <div className="finance-section__header"><h3>Desglose por categoría</h3></div>
          <div className="table-container" style={{ border: 0, borderRadius: 0, overflowX: 'auto' }}>
            <table className="finance-table">
              <thead><tr><th>Categoría</th><th>Total neto</th></tr></thead>
              <tbody>
                {categorias.map((item) => (
                  <tr key={item.categoria}>
                    <td>{CATEGORIAS[item.categoria] || item.categoria}</td>
                    <td className={`finance-amount ${item.total >= 0 ? 'finance-amount--positive' : 'finance-amount--negative'}`}>
                      {item.total >= 0 ? '+' : '−'}{FMT(Math.abs(item.total))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TableCard
        header={<strong>Movimientos ({movimientos.length})</strong>}
        empty={movimientos.length === 0}
        emptyIcon={<Landmark size={32} />}
        emptyText="Esta caja todavía no registra movimientos financieros."
        page={page}
        hasNext={(page + 1) * PAGE_SIZE < movimientos.length}
        onPrevPage={() => setPage((actual) => actual - 1)}
        onNextPage={() => setPage((actual) => actual + 1)}
      >
        <table className="finance-table">
          <thead>
            <tr>
              <th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Origen</th>
              <th>Referencia</th><th>Monto</th><th>Saldo Anterior</th><th>Saldo Nuevo</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((movimiento) => {
              const referencia = [
                CAMPO(movimiento, 'referenciaTipo', 'referencia_tipo'),
                CAMPO(movimiento, 'referenciaCodigo', 'referencia_codigo'),
              ].filter(Boolean).join(' · ') || '—';
              return (
                <tr key={movimiento.id}>
                  <td>{FECHAHORA(CAMPO(movimiento, 'fechaOperacion', 'fecha_operacion', movimiento.fecha))}</td>
                  <td><EstadoBadge estado={movimiento.tipo} /> <span style={{ marginLeft: 5 }}>{CATEGORIAS[movimiento.categoria] || movimiento.categoria}</span></td>
                  <td>{movimiento.descripcion || movimiento.observacion || '—'}</td>
                  <td>{movimiento.origen || '—'}</td>
                  <td>{referencia}</td>
                  <td className={`finance-amount ${movimiento.tipo === 'INGRESO' ? 'finance-amount--positive' : 'finance-amount--negative'}`}>
                    {movimiento.tipo === 'INGRESO' ? '+' : '−'}{FMT(movimiento.monto)}
                  </td>
                  <td>{FMT(CAMPO(movimiento, 'saldoAnterior', 'saldo_anterior'))}</td>
                  <td className="finance-amount">{FMT(CAMPO(movimiento, 'saldoNuevo', 'saldo_nuevo'))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>

      <div className="finance-section" style={{ overflow: 'visible' }}>
        <div className="finance-section__header"><h3>Cajas Chicas asociadas</h3></div>
        <div className="table-container" style={{ border: 0, borderRadius: 0, overflowX: 'auto' }}>
          {cajasChicas.length === 0 ? (
            <div className="empty-state">No existen Cajas Chicas asociadas.</div>
          ) : (
            <table className="finance-table">
              <thead>
                <tr><th>Fecha</th><th>Estado</th><th>Monto Inicial</th><th>Monto Final</th><th>Abierta por</th><th>Cerrada por</th><th>Acción</th></tr>
              </thead>
              <tbody>
                {cajasChicas.map((item) => (
                  <tr key={item.id}>
                    <td>{FECHA(item.fecha)}</td>
                    <td><EstadoBadge estado={item.estado} /></td>
                    <td>{FMT(item.monto_inicial)}</td>
                    <td>{FMT(item.saldo_contado_cierre ?? item.monto_actual)}</td>
                    <td>{item.usuario_nombre || '—'}</td>
                    <td>{item.cerrado_por_nombre || '—'}</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => navigate(`/caja-chica/${item.id}`)}>Ver detalle</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {caja.estado === 'CERRADA' && (
        <div className="finance-section">
          <div className="finance-section__header"><h3>Arqueo de cierre</h3></div>
          <div className="finance-section__body finance-info-grid">
            <Info label="Saldo contado" value={FMT(caja.saldo_contado_cierre)} />
            <Info label="Diferencia" value={FMT(caja.diferencia_cierre)} />
            <Info label="Motivo" value={caja.motivo_diferencia || 'Sin diferencia'} />
            <Info label="Observación" value={caja.observacion_cierre || '—'} />
            <Info label="Fecha cierre" value={FECHAHORA(caja.cerrado_en)} />
            <Info label="Cerrado por" value={caja.cerrado_por_nombre || '—'} />
          </div>
        </div>
      )}

      <RegistrarMovimientoBancoModal
        abierto={modalMovimiento}
        cajaBancoId={Number(id)}
        saldoActual={NUMERO(caja.saldo_actual)}
        onCerrar={() => setModalMovimiento(false)}
        onRegistrado={cargar}
      />
      <CajaBancoCierreModal
        abierto={modalCierre}
        caja={caja}
        cajasChicas={cajasChicas}
        onCerrar={() => setModalCierre(false)}
        onCerrada={cargar}
      />
    </div>
  );
}
