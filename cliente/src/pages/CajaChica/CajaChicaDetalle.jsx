// cliente/src/pages/CajaChica/CajaChicaDetalle.jsx
import {
  ArrowLeft,
  BanknoteArrowDown,
  BanknoteArrowUp,
  CircleDollarSign,
  Gauge,
  Plus,
  Printer,
  RefreshCw,
  ReceiptText,
  WalletCards,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/api';
import RegistrarMovimientoChicaModal from '../../components/cajas/RegistrarMovimientoChicaModal';
import StatCard from '../../components/common/StatCard';
import TableCard from '../../components/common/TableCard';
import EstadoBadge from '../../components/shared/EstadoBadge';
import '../../components/shared/FinanceModule.css';
import { useAuth } from '../../context/AuthContext';
import { notificarError } from '../../utils/confirmaciones';
import { imprimirCaja } from '../../utils/imprimirCaja';
import { CAMPO, FECHA, FECHAHORA, FMT, NUMERO, RESULTADO_LISTA } from '../../utils/formato';
import { CajaChicaCierreModal, CajaChicaReposicionModal } from './CajaChicaModal';

const PAGE_SIZE = 20;

function Info({ label, value }) {
  return (
    <div>
      <div className="finance-info__label">{label}</div>
      <div className="finance-info__value">{value}</div>
    </div>
  );
}

export default function CajaChicaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [caja, setCaja] = useState(null);
  const [cajaBanco, setCajaBanco] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [modalCierre, setModalCierre] = useState(false);
  const [modalReposicion, setModalReposicion] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [cajaResultado, movimientosResultado] = await Promise.allSettled([
      api.get(`/caja-chica/buscar/${id}`),
      api.get(`/caja-chica/${id}/movimientos?limit=200&page=0`),
    ]);
    if (cajaResultado.status !== 'fulfilled' || !cajaResultado.value.ok) {
      setLoading(false);
      await notificarError(cajaResultado.value, 'No se pudo cargar la Caja Chica.');
      return;
    }
    const cajaActual = cajaResultado.value.data.resultado;
    setCaja(cajaActual);
    setMovimientos(
      movimientosResultado.status === 'fulfilled' && movimientosResultado.value.ok
        ? RESULTADO_LISTA(movimientosResultado.value)
        : [],
    );
    if (cajaActual.caja_banco_id) {
      const bancoResultado = await api.get(`/caja-banco/buscar/${cajaActual.caja_banco_id}`);
      setCajaBanco(bancoResultado.ok ? bancoResultado.data.resultado : null);
    } else {
      setCajaBanco(null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  const resumen = useMemo(() => movimientos.reduce((total, movimiento) => {
    const monto = NUMERO(movimiento.monto);
    if (movimiento.tipo === 'INGRESO') {
      total.ingresos += monto;
      total.cantIngresos += 1;
    } else if (movimiento.tipo === 'EGRESO') {
      total.egresos += monto;
      total.cantEgresos += 1;
    }
    return total;
  }, { ingresos: 0, egresos: 0, cantIngresos: 0, cantEgresos: 0 }), [movimientos]);

  if (loading) return <div className="page"><div className="spinner-wrapper"><div className="spinner" /></div></div>;
  if (!caja) return <div className="page"><div className="empty-state">Caja Chica no encontrada.</div></div>;

  const abierta = caja.estado === 'ABIERTA';
  const balance = resumen.ingresos - resumen.egresos;
  const promedio = movimientos.length
    ? (resumen.ingresos + resumen.egresos) / movimientos.length
    : 0;
  const filas = movimientos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="page finance-page">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-title">Caja Chica — {FECHA(caja.fecha)}</h1>
            <EstadoBadge estado={caja.estado} />
          </div>
          <p className="page-subtitle">
            Abierta por {caja.usuario_nombre || '—'} · cerrada por {caja.cerrado_por_nombre || '—'}
          </p>
        </div>
        <div className="finance-actions no-print">
          <button className="btn btn-ghost" onClick={() => imprimirCaja({
            caja,
            movimientos,
            tipoCaja: 'CHICA',
            resumen,
          })}><Printer size={16} /> Imprimir</button>
          {abierta && isAdmin && (
            <button className="btn btn-ghost" onClick={() => setModalReposicion(true)}><RefreshCw size={16} /> Reponer Caja</button>
          )}
          {abierta && (
            <button className="btn btn-primary" onClick={() => setModalMovimiento(true)}><Plus size={16} /> Movimiento</button>
          )}
          {abierta && isAdmin && <button className="btn btn-danger" onClick={() => setModalCierre(true)}>Cerrar Caja</button>}
          <button className="btn btn-ghost" onClick={() => navigate('/caja-chica')}><ArrowLeft size={16} /> Volver</button>
        </div>
      </div>

      <div className="finance-kpi-grid">
        <StatCard icon={<BanknoteArrowDown size={21} />} label="Total ingresos" value={FMT(resumen.ingresos)} color="#27ae60" subtext={`${resumen.cantIngresos} ingresos`} />
        <StatCard icon={<BanknoteArrowUp size={21} />} label="Total egresos" value={FMT(resumen.egresos)} color="#e74c3c" subtext={`${resumen.cantEgresos} egresos`} />
        <StatCard icon={<CircleDollarSign size={21} />} label="Balance neto" value={FMT(balance)} color={balance >= 0 ? '#27ae60' : '#e74c3c'} />
        <StatCard icon={<Gauge size={21} />} label="Promedio movimiento" value={FMT(promedio)} color="#2980b9" />
        <StatCard icon={<WalletCards size={21} />} label="Monto inicial" value={FMT(caja.monto_inicial)} color="#6c757d" />
        <StatCard icon={<ReceiptText size={21} />} label="Monto actual" value={FMT(caja.monto_actual)} color={NUMERO(caja.monto_actual) >= 0 ? '#27ae60' : '#e74c3c'} />
      </div>

      <div className="finance-section">
        <div className="finance-section__header"><h3>Auditoría de la caja</h3></div>
        <div className="finance-section__body finance-info-grid">
          <Info label="Fecha creación" value={FECHAHORA(caja.created_at)} />
          <Info label="Fecha apertura" value={FECHAHORA(caja.fecha_apertura || caja.created_at)} />
          <Info label="Abierta por" value={caja.usuario_nombre || '—'} />
          <Info label="Fecha cierre" value={FECHAHORA(caja.cerrado_en)} />
          <Info label="Cerrada por" value={caja.cerrado_por_nombre || '—'} />
          <Info label="Caja Banco vinculada" value={cajaBanco ? `#${cajaBanco.id} · ${FMT(cajaBanco.saldo_actual)}` : '—'} />
        </div>
      </div>

      <TableCard
        header={<strong>Movimientos ({movimientos.length})</strong>}
        empty={movimientos.length === 0}
        emptyIcon={<ReceiptText size={32} />}
        emptyText="Esta caja todavía no registra movimientos."
        page={page}
        hasNext={(page + 1) * PAGE_SIZE < movimientos.length}
        onPrevPage={() => setPage((actual) => actual - 1)}
        onNextPage={() => setPage((actual) => actual + 1)}
      >
        <table className="finance-table">
          <thead>
            <tr>
              <th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th>Referencia</th>
              <th>Monto</th><th>Saldo Anterior</th><th>Saldo Nuevo</th><th>Usuario</th>
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
                  <td><EstadoBadge estado={movimiento.tipo} /></td>
                  <td>{movimiento.categoria || '—'}</td>
                  <td>{movimiento.descripcion || movimiento.observacion || '—'}</td>
                  <td>{referencia}</td>
                  <td className={`finance-amount ${movimiento.tipo === 'INGRESO' ? 'finance-amount--positive' : 'finance-amount--negative'}`}>
                    {movimiento.tipo === 'INGRESO' ? '+' : '−'}{FMT(movimiento.monto)}
                  </td>
                  <td>{FMT(CAMPO(movimiento, 'saldoAnterior', 'saldo_anterior'))}</td>
                  <td>{FMT(CAMPO(movimiento, 'saldoNuevo', 'saldo_nuevo'))}</td>
                  <td>{CAMPO(movimiento, 'usuarioNombre', 'usuario_nombre', '—')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>

      {caja.estado === 'CERRADA' && (
        <div className="finance-section">
          <div className="finance-section__header"><h3>Arqueo de cierre</h3></div>
          <div className="finance-section__body finance-info-grid">
            <Info label="Saldo contado" value={FMT(caja.saldo_contado_cierre)} />
            <Info label="Diferencia" value={FMT(caja.diferencia_cierre)} />
            <Info label="Motivo" value={caja.motivo_diferencia || 'Sin diferencia'} />
            <Info label="Transferido a banco" value={caja.transferir_a_banco ? 'Sí' : 'No'} />
          </div>
        </div>
      )}

      <RegistrarMovimientoChicaModal
        abierto={modalMovimiento}
        cajaChicaId={Number(id)}
        saldoActual={NUMERO(caja.monto_actual)}
        onCerrar={() => setModalMovimiento(false)}
        onRegistrado={cargar}
      />
      <CajaChicaCierreModal
        abierto={modalCierre}
        caja={caja}
        cajaBanco={cajaBanco}
        onCerrar={() => setModalCierre(false)}
        onCerrada={cargar}
      />
      <CajaChicaReposicionModal
        abierto={modalReposicion}
        caja={caja}
        cajaBanco={cajaBanco}
        onCerrar={() => setModalReposicion(false)}
        onRepuesta={cargar}
      />
    </div>
  );
}
