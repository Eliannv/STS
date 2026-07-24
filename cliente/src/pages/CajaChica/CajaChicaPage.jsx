// cliente/src/pages/CajaChica/CajaChicaPage.jsx
import { Banknote, CircleDollarSign, LockOpen, Plus, ReceiptText, WalletCards } from 'lucide-react';
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
import { CajaChicaAperturaModal } from './CajaChicaModal';

const PAGE_SIZE = 20;

export default function CajaChicaPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [cajas, setCajas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierta, setModalAbierta] = useState(false);
  const [page, setPage] = useState(0);
  const [filtros, setFiltros] = useState({ estado: '', fechaDesde: '', fechaHasta: '' });

  const cargar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100', offset: '0' });
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor) params.set(clave, valor);
    });
    const respuesta = await api.get(`/caja-chica/lista?${params}`);
    setLoading(false);
    if (!respuesta.ok) {
      setCajas([]);
      await notificarError(respuesta, 'No se pudieron cargar las cajas chicas.');
      return;
    }
    setCajas(RESULTADO_LISTA(respuesta));
  }, [filtros]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { setPage(0); }, [filtros]);

  const resumen = useMemo(() => cajas.reduce((total, caja) => {
    total.total += 1;
    total.abiertas += caja.estado === 'ABIERTA' ? 1 : 0;
    total.cerradas += caja.estado === 'CERRADA' ? 1 : 0;
    total.saldo += NUMERO(caja.monto_actual);
    total.capital += NUMERO(caja.monto_inicial);
    total.gastado += NUMERO(caja.egresos_acumulados);
    return total;
  }, { total: 0, abiertas: 0, cerradas: 0, saldo: 0, capital: 0, gastado: 0 }), [cajas]);

  async function solicitarApertura() {
    const respuesta = await api.get('/caja-banco/abierta');
    const banco = respuesta.ok ? respuesta.data?.resultado : null;
    if (!banco?.id) {
      await notificarAdvertencia('Debe abrir una Caja Banco antes de crear una Caja Chica.', 'Caja Banco requerida');
      return;
    }
    setModalAbierta(true);
  }

  const filas = cajas.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="page finance-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Caja Chica</h1>
          <p className="page-subtitle">Administración de efectivo operativo y gastos menores</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={solicitarApertura}><Plus size={16} /> Abrir Nueva Caja</button>
        )}
      </div>

      <div className="finance-kpi-grid">
        <StatCard icon={<ReceiptText size={21} />} label="Total cajas" value={resumen.total} color="#2980b9" />
        <StatCard icon={<LockOpen size={21} />} label="Abiertas" value={resumen.abiertas} color="#27ae60" />
        <StatCard icon={<ReceiptText size={21} />} label="Cerradas" value={resumen.cerradas} color="#6c757d" />
        <StatCard icon={<CircleDollarSign size={21} />} label="Saldo total" value={FMT(resumen.saldo)} color="#27ae60" />
        <StatCard icon={<WalletCards size={21} />} label="Capital inicial" value={FMT(resumen.capital)} color="#2980b9" />
        <StatCard icon={<Banknote size={21} />} label="Total gastado" value={FMT(resumen.gastado)} color="#e74c3c" />
      </div>

      <FilterCard
        titulo="Filtros"
        resultado={!loading ? `${cajas.length} caja${cajas.length === 1 ? '' : 's'}` : ''}
        onLimpiar={() => setFiltros({ estado: '', fechaDesde: '', fechaHasta: '' })}
      >
        <FilterItem label="Estado">
          <select style={filterInputStyle} value={filtros.estado} onChange={(event) => setFiltros({ ...filtros, estado: event.target.value })}>
            <option value="">Todos</option>
            <option value="ABIERTA">Abierta</option>
            <option value="CERRADA">Cerrada</option>
          </select>
        </FilterItem>
        <FilterItem label="Fecha desde">
          <input type="date" style={filterInputStyle} value={filtros.fechaDesde} onChange={(event) => setFiltros({ ...filtros, fechaDesde: event.target.value })} />
        </FilterItem>
        <FilterItem label="Fecha hasta">
          <input type="date" style={filterInputStyle} value={filtros.fechaHasta} onChange={(event) => setFiltros({ ...filtros, fechaHasta: event.target.value })} />
        </FilterItem>
      </FilterCard>

      <TableCard
        loading={loading}
        loadingText="Cargando cajas chicas..."
        empty={!loading && cajas.length === 0}
        emptyText="No existen cajas chicas para los filtros seleccionados."
        page={page}
        hasNext={(page + 1) * PAGE_SIZE < cajas.length}
        onPrevPage={() => setPage((actual) => actual - 1)}
        onNextPage={() => setPage((actual) => actual + 1)}
      >
        <table className="finance-table">
          <thead>
            <tr>
              <th>Fecha</th><th>Estado</th><th>Monto Inicial</th><th>Monto Actual</th>
              <th>Gastado</th><th>Ingresos Acum.</th><th>Egresos Acum.</th>
              <th>Caja Banco</th><th>Usuario</th><th>Cerrado Por</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((caja) => (
              <tr key={caja.id}>
                <td>{FECHA(caja.fecha)}</td>
                <td><EstadoBadge estado={caja.estado} /></td>
                <td>{FMT(caja.monto_inicial)}</td>
                <td className="finance-amount finance-amount--positive">{FMT(caja.monto_actual)}</td>
                <td className="finance-amount finance-amount--negative">{FMT(caja.egresos_acumulados)}</td>
                <td className="finance-amount finance-amount--positive">{FMT(caja.ingresos_acumulados)}</td>
                <td className="finance-amount finance-amount--negative">{FMT(caja.egresos_acumulados)}</td>
                <td>#{caja.caja_banco_id || '—'}</td>
                <td>{caja.usuario_nombre || '—'}</td>
                <td>{caja.cerrado_por_nombre || '—'}</td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => navigate(`/caja-chica/${caja.id}`)}>Ver detalle</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <CajaChicaAperturaModal
        abierto={modalAbierta}
        onCerrar={() => setModalAbierta(false)}
        onAbierta={(caja) => {
          setModalAbierta(false);
          cargar();
          if (caja?.id) navigate(`/caja-chica/${caja.id}`);
        }}
      />
    </div>
  );
}
