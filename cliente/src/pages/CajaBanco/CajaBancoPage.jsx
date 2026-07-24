// cliente/src/pages/CajaBanco/CajaBancoPage.jsx
import { Building2, CalendarCheck, CircleDollarSign, LockOpen, Plus, WalletCards } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import FilterCard, { FilterItem, filterInputStyle } from '../../components/common/FilterCard';
import StatCard from '../../components/common/StatCard';
import TableCard from '../../components/common/TableCard';
import EstadoBadge from '../../components/shared/EstadoBadge';
import '../../components/shared/FinanceModule.css';
import { useAuth } from '../../context/AuthContext';
import { notificarAdvertencia, notificarError } from '../../utils/confirmaciones';
import { FECHA, FMT, NUMERO, RESULTADO_LISTA } from '../../utils/formato';
import { CajaBancoAperturaModal } from './CajaBancoModal';

const PAGE_SIZE = 20;

export default function CajaBancoPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [cajas, setCajas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierta, setModalAbierta] = useState(false);
  const [page, setPage] = useState(0);
  const [filtros, setFiltros] = useState({
    estado: '',
    fechaDesde: '',
    fechaHasta: '',
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100', offset: '0' });
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor) params.set(clave, valor);
    });
    const respuesta = await api.get(`/caja-banco/lista?${params}`);
    setLoading(false);
    if (!respuesta.ok) {
      setCajas([]);
      await notificarError(respuesta, 'No se pudieron cargar las cajas banco.');
      return;
    }
    setCajas(RESULTADO_LISTA(respuesta));
  }, [filtros]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { setPage(0); }, [filtros]);

  const resumen = useMemo(() => {
    const mesActual = new Date().toISOString().slice(0, 7);
    return cajas.reduce((total, caja) => {
      total.total += 1;
      total.abiertas += caja.estado === 'ABIERTA' ? 1 : 0;
      total.cerradasMes += caja.estado === 'CERRADA'
        && String(caja.cerrado_en || caja.updated_at || '').slice(0, 7) === mesActual ? 1 : 0;
      if (caja.estado === 'ABIERTA') total.saldo += NUMERO(caja.saldo_actual);
      total.capital += NUMERO(caja.saldo_inicial);
      return total;
    }, { total: 0, abiertas: 0, cerradasMes: 0, saldo: 0, capital: 0 });
  }, [cajas]);

  const filas = cajas.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  async function solicitarApertura() {
    const respuesta = await api.get('/caja-banco/abierta');
    const abierta = respuesta.ok ? respuesta.data?.resultado : null;
    if (abierta?.id) {
      await notificarAdvertencia(
        `Ya existe una Caja Banco abierta (#${abierta.id}). Ciérrela antes de abrir otra.`,
        'Caja Banco abierta',
      );
      return;
    }
    setModalAbierta(true);
  }

  return (
    <div className="page finance-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Caja Banco</h1>
          <p className="page-subtitle">Control de fondos bancarios y movimientos financieros</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={solicitarApertura}>
            <Plus size={16} /> Abrir Caja Banco
          </button>
        )}
      </div>

      <div className="finance-kpi-grid finance-kpi-grid--wide">
        <StatCard icon={<Building2 size={21} />} label="Total cajas" value={resumen.total} color="#2980b9" />
        <StatCard icon={<LockOpen size={21} />} label="Abiertas" value={resumen.abiertas} color="#27ae60" />
        <StatCard icon={<CalendarCheck size={21} />} label="Cerradas este mes" value={resumen.cerradasMes} color="#6c757d" />
        <StatCard icon={<CircleDollarSign size={21} />} label="Saldo total" value={FMT(resumen.saldo)} color="#27ae60" />
        <StatCard icon={<WalletCards size={21} />} label="Capital inicial" value={FMT(resumen.capital)} color="#2980b9" />
      </div>

      <FilterCard
        titulo="Filtros"
        resultado={!loading ? `${cajas.length} caja${cajas.length === 1 ? '' : 's'}` : ''}
        onLimpiar={() => setFiltros({ estado: '', fechaDesde: '', fechaHasta: '' })}
      >
        <FilterItem label="Estado">
          <select
            style={filterInputStyle}
            value={filtros.estado}
            onChange={(event) => setFiltros({ ...filtros, estado: event.target.value })}
          >
            <option value="">Todos</option>
            <option value="ABIERTA">Abierta</option>
            <option value="CERRADA">Cerrada</option>
          </select>
        </FilterItem>
        <FilterItem label="Fecha desde">
          <input
            type="date"
            style={filterInputStyle}
            value={filtros.fechaDesde}
            onChange={(event) => setFiltros({ ...filtros, fechaDesde: event.target.value })}
          />
        </FilterItem>
        <FilterItem label="Fecha hasta">
          <input
            type="date"
            style={filterInputStyle}
            value={filtros.fechaHasta}
            onChange={(event) => setFiltros({ ...filtros, fechaHasta: event.target.value })}
          />
        </FilterItem>
      </FilterCard>

      <TableCard
        loading={loading}
        loadingText="Cargando cajas banco..."
        empty={!loading && cajas.length === 0}
        emptyText="No existen cajas banco para los filtros seleccionados."
        page={page}
        hasNext={(page + 1) * PAGE_SIZE < cajas.length}
        onPrevPage={() => setPage((actual) => actual - 1)}
        onNextPage={() => setPage((actual) => actual + 1)}
      >
        <table className="finance-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Período</th>
              <th>Estado</th>
              <th>Saldo Inicial</th>
              <th>Saldo Actual</th>
              <th>Ingresos Acum.</th>
              <th>Egresos Acum.</th>
              <th>Usuario</th>
              <th>Cerrado Por</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((caja) => (
              <tr key={caja.id}>
                <td>{FECHA(caja.fecha)}</td>
                <td>{caja.periodo || '—'}</td>
                <td><EstadoBadge estado={caja.estado} /></td>
                <td className="finance-amount">{FMT(caja.saldo_inicial)}</td>
                <td className={`finance-amount ${NUMERO(caja.saldo_actual) >= 0 ? 'finance-amount--positive' : 'finance-amount--negative'}`}>
                  {FMT(caja.saldo_actual)}
                </td>
                <td className="finance-amount finance-amount--positive">{FMT(caja.ingresos_acumulados)}</td>
                <td className="finance-amount finance-amount--negative">{FMT(caja.egresos_acumulados)}</td>
                <td>{caja.usuario_nombre || '—'}</td>
                <td>{caja.cerrado_por_nombre || '—'}</td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/caja-banco/${caja.id}`)}>
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <CajaBancoAperturaModal
        abierto={modalAbierta}
        onCerrar={() => setModalAbierta(false)}
        onAbierta={(caja) => {
          setModalAbierta(false);
          cargar();
          if (caja?.id) navigate(`/caja-banco/${caja.id}`);
        }}
      />
    </div>
  );
}
