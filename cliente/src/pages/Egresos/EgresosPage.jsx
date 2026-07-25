// cliente/src/pages/Egresos/EgresosPage.jsx
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock3,
  Eye,
  FilePenLine,
  PackageMinus,
  Plus,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  descartarEgreso,
  extraerDatosEgreso,
  listarTodosEgresos,
  obtenerEgreso,
} from '../../api/egresosApi';
import FilterCard, { FilterItem, filterInputStyle } from '../../components/common/FilterCard';
import StatCard from '../../components/common/StatCard';
import TableCard from '../../components/common/TableCard';
import TipoEgresoIcon from '../../components/common/TipoEgresoIcon';
import { obtenerEtiquetaTipoEgreso, TIPOS_EGRESO } from '../../components/common/tipoEgreso';
import EstadoBadge from '../../components/shared/EstadoBadge';
import '../../components/shared/FinanceModule.css';
import { useAuth } from '../../context/AuthContext';
import {
  confirmarAccionDestructiva,
  extraerMensajeError,
  notificarError,
  notificarExito,
} from '../../utils/confirmaciones';
import { FECHA, FMT, NUMERO } from '../../utils/formato';
import EgresoAnularModal from './EgresoAnularModal';
import EgresoConfirmarModal from './EgresoConfirmarModal';
import EgresoNuevoModal from './EgresoNuevoModal';
import './Egresos.css';

const PAGE_SIZE = 20;
const FILTROS_INICIALES = {
  buscar: '',
  tipoEgreso: '',
  estado: '',
  fechaDesde: '',
  fechaHasta: '',
};

const coincideBusqueda = (egreso, buscar) => {
  const termino = buscar.trim().toLocaleLowerCase('es');
  if (!termino) return true;
  return [
    egreso.id_personalizado,
    egreso.proveedor_nombre,
    egreso.descripcion,
    egreso.documento_referencia,
  ].some((valor) => String(valor || '').toLocaleLowerCase('es').includes(termino));
};

export default function EgresosPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [egresos, setEgresos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accionandoId, setAccionandoId] = useState(null);
  const [page, setPage] = useState(0);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [egresoConfirmar, setEgresoConfirmar] = useState(null);
  const [egresoAnular, setEgresoAnular] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const { buscar: _buscar, ...filtrosServidor } = filtros;
    const resultado = await listarTodosEgresos(filtrosServidor);
    setLoading(false);
    if (!resultado.respuesta.ok) {
      setEgresos([]);
      await notificarError(resultado.respuesta, 'No se pudieron cargar los egresos.');
      return;
    }
    setEgresos(resultado.rows);
  }, [filtros]);

  useEffect(() => {
    const temporizador = setTimeout(cargar, 250);
    return () => clearTimeout(temporizador);
  }, [cargar]);

  const filtrados = useMemo(
    () => egresos.filter((egreso) => coincideBusqueda(egreso, filtros.buscar)),
    [egresos, filtros.buscar],
  );

  const resumen = useMemo(() => filtrados.reduce((total, egreso) => {
    total.total += 1;
    if (egreso.estado === 'BORRADOR') total.borradores += 1;
    if (egreso.estado === 'CONFIRMADO') {
      total.confirmados += 1;
      total.costo += NUMERO(egreso.costo_total);
    }
    if (egreso.estado === 'ANULADO') total.anulados += 1;
    if (egreso.estado_financiero === 'PENDIENTE') total.pendientesFinancieros += 1;
    return total;
  }, {
    total: 0,
    borradores: 0,
    confirmados: 0,
    anulados: 0,
    costo: 0,
    pendientesFinancieros: 0,
  }), [filtrados]);

  const filas = filtrados.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function actualizarFiltro(campo, valor) {
    setFiltros((actual) => ({ ...actual, [campo]: valor }));
    setPage(0);
  }

  async function cargarEgresoAccion(id, setter) {
    setAccionandoId(id);
    const respuesta = await obtenerEgreso(id);
    setAccionandoId(null);
    if (!respuesta.ok) {
      await notificarError(respuesta, 'No se pudo cargar el egreso.');
      return;
    }
    setter(extraerDatosEgreso(respuesta));
  }

  async function descartar(item) {
    const confirmado = await confirmarAccionDestructiva({
      title: 'Descartar borrador',
      text: `El egreso ${item.id_personalizado || `#${item.id}`} quedará como descartado.`,
      confirmButtonText: 'Sí, descartar',
    });
    if (!confirmado) return;

    setAccionandoId(item.id);
    const respuesta = await descartarEgreso(item.id);
    setAccionandoId(null);
    if (!respuesta.ok) {
      await notificarError(extraerMensajeError(respuesta, 'No se pudo descartar el egreso.'));
      return;
    }
    await notificarExito('El borrador fue descartado correctamente.');
    cargar();
  }

  return (
    <div className="page finance-page egresos-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Egresos de Mercadería</h1>
          <p className="page-subtitle">Bajas, devoluciones y salidas de inventario</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setModalNuevo(true)}>
            <Plus size={16} /> Nuevo Egreso
          </button>
        )}
      </div>

      <div className="egresos-kpi-grid">
        <StatCard icon={<PackageMinus size={21} />} label="Total egresos" value={resumen.total} color="#2980b9" />
        <StatCard icon={<FilePenLine size={21} />} label="Borradores" value={resumen.borradores} color="#d4a017" />
        <StatCard icon={<CheckCircle2 size={21} />} label="Confirmados" value={resumen.confirmados} color="#27ae60" />
        <StatCard icon={<Ban size={21} />} label="Anulados" value={resumen.anulados} color="#e74c3c" />
        <StatCard icon={<PackageMinus size={21} />} label="Costo total retirado" value={FMT(resumen.costo)} color="#8e44ad" />
        {resumen.pendientesFinancieros > 0 && (
          <StatCard
            icon={<Clock3 size={21} />}
            label="Pendiente financiero"
            value={resumen.pendientesFinancieros}
            color="#e67e22"
            subtext="Requiere procesamiento en caja"
          />
        )}
      </div>

      <FilterCard
        titulo="Filtros"
        resultado={!loading ? `${filtrados.length} egreso${filtrados.length === 1 ? '' : 's'}` : ''}
        onLimpiar={() => {
          setFiltros(FILTROS_INICIALES);
          setPage(0);
        }}
      >
        <FilterItem label="Buscar" span={2}>
          <input
            style={filterInputStyle}
            value={filtros.buscar}
            onChange={(event) => actualizarFiltro('buscar', event.target.value)}
            placeholder="ID, proveedor o descripción..."
          />
        </FilterItem>
        <FilterItem label="Tipo de egreso">
          <select
            style={filterInputStyle}
            value={filtros.tipoEgreso}
            onChange={(event) => actualizarFiltro('tipoEgreso', event.target.value)}
          >
            <option value="">Todos</option>
            {TIPOS_EGRESO.map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}
          </select>
        </FilterItem>
        <FilterItem label="Estado">
          <select
            style={filterInputStyle}
            value={filtros.estado}
            onChange={(event) => actualizarFiltro('estado', event.target.value)}
          >
            <option value="">Todos</option>
            <option value="BORRADOR">Borrador</option>
            <option value="CONFIRMADO">Confirmado</option>
            <option value="ANULADO">Anulado</option>
            <option value="DESCARTADO">Descartado</option>
          </select>
        </FilterItem>
        <FilterItem label="Fecha desde">
          <input
            type="date"
            style={filterInputStyle}
            value={filtros.fechaDesde}
            onChange={(event) => actualizarFiltro('fechaDesde', event.target.value)}
          />
        </FilterItem>
        <FilterItem label="Fecha hasta">
          <input
            type="date"
            style={filterInputStyle}
            value={filtros.fechaHasta}
            onChange={(event) => actualizarFiltro('fechaHasta', event.target.value)}
          />
        </FilterItem>
      </FilterCard>

      <TableCard
        loading={loading}
        loadingText="Cargando egresos..."
        empty={!loading && filtrados.length === 0}
        emptyIcon={<PackageMinus size={34} />}
        emptyText="No existen egresos para los filtros seleccionados."
        emptyAction={isAdmin ? (
          <button className="btn btn-primary btn-sm" onClick={() => setModalNuevo(true)}>
            <Plus size={15} /> Crear primer egreso
          </button>
        ) : null}
        page={page}
        hasNext={(page + 1) * PAGE_SIZE < filtrados.length}
        onPrevPage={() => setPage((actual) => actual - 1)}
        onNextPage={() => setPage((actual) => actual + 1)}
        hidePagination={filtrados.length <= PAGE_SIZE}
      >
        <table className="finance-table egreso-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Tipo Egreso</th>
              <th>Descripción</th>
              <th>Proveedor</th>
              <th>Fecha</th>
              <th>Items</th>
              <th>Costo Total</th>
              <th>Estado</th>
              <th>Est. Financiero</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((egreso) => (
              <tr key={egreso.id}>
                <td><code>{egreso.id_personalizado || `#${egreso.id}`}</code></td>
                <td>
                  <span className="egreso-type-cell">
                    <TipoEgresoIcon tipo={egreso.tipo_egreso} />
                    {obtenerEtiquetaTipoEgreso(egreso.tipo_egreso)}
                  </span>
                </td>
                <td title={egreso.descripcion}>
                  {String(egreso.descripcion || '—').slice(0, 58)}
                  {String(egreso.descripcion || '').length > 58 ? '…' : ''}
                </td>
                <td>{egreso.proveedor_nombre || '—'}</td>
                <td>{FECHA(egreso.fecha)}</td>
                <td>{egreso.cantidad_detalles ?? egreso.total_items ?? '—'}</td>
                <td className="finance-amount">{FMT(egreso.costo_total)}</td>
                <td><EstadoBadge estado={egreso.estado} /></td>
                <td>
                  {egreso.estado_financiero !== 'NO_APLICA'
                    ? <EstadoBadge estado={egreso.estado_financiero} />
                    : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>
                <td>
                  <div className="egresos-actions">
                    <button
                      className="btn-icon"
                      title={egreso.estado === 'BORRADOR' ? 'Ver o editar' : 'Ver detalle'}
                      onClick={() => navigate(`/egresos/${egreso.id}`)}
                    >
                      {egreso.estado === 'BORRADOR' ? <FilePenLine size={15} /> : <Eye size={15} />}
                    </button>
                    {isAdmin && egreso.estado === 'BORRADOR' && (
                      <>
                        <button
                          className="btn-icon"
                          title="Confirmar"
                          disabled={accionandoId === egreso.id}
                          onClick={() => cargarEgresoAccion(egreso.id, setEgresoConfirmar)}
                        >
                          <CheckCircle2 size={15} />
                        </button>
                        <button
                          className="btn-icon danger"
                          title="Descartar"
                          disabled={accionandoId === egreso.id}
                          onClick={() => descartar(egreso)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                    {isAdmin && egreso.estado === 'CONFIRMADO' && (
                      <button
                        className="btn-icon danger"
                        title="Anular"
                        disabled={accionandoId === egreso.id}
                        onClick={() => cargarEgresoAccion(egreso.id, setEgresoAnular)}
                      >
                        <AlertCircle size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <EgresoNuevoModal
        abierto={modalNuevo}
        onCerrar={() => setModalNuevo(false)}
        onCreado={() => {
          setModalNuevo(false);
          cargar();
        }}
      />
      {egresoConfirmar && (
        <EgresoConfirmarModal
          abierto
          egreso={egresoConfirmar}
          onCerrar={() => setEgresoConfirmar(null)}
          onConfirmado={() => {
            setEgresoConfirmar(null);
            cargar();
          }}
        />
      )}
      {egresoAnular && (
        <EgresoAnularModal
          abierto
          egreso={egresoAnular}
          onCerrar={() => setEgresoAnular(null)}
          onAnulado={() => {
            setEgresoAnular(null);
            cargar();
          }}
        />
      )}
    </div>
  );
}
