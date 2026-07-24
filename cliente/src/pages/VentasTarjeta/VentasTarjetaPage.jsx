// cliente/src/pages/VentasTarjeta/VentasTarjetaPage.jsx
import { Banknote, CreditCard, Landmark, ReceiptText, Search, WalletCards } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import FilterCard, { FilterItem, filterInputStyle } from '../../components/common/FilterCard';
import StatCard from '../../components/common/StatCard';
import TableCard from '../../components/common/TableCard';
import EstadoBadge from '../../components/shared/EstadoBadge';
import '../../components/shared/FinanceModule.css';
import { notificarError } from '../../utils/confirmaciones';
import { FECHA, FMT, NUMERO, RESULTADO_LISTA } from '../../utils/formato';
import VentaTarjetaModal from './VentaTarjetaModal';

const RESUMEN_VACIO = {
  total_ventas: 0,
  monto_total: 0,
  monto_bruto_acreditado: 0,
  monto_neto_acreditado: 0,
  comision_acumulada: 0,
  retencion_acumulada: 0,
};

export default function VentasTarjetaPage() {
  const navigate = useNavigate();
  const [ventas, setVentas] = useState([]);
  const [resumen, setResumen] = useState(RESUMEN_VACIO);
  const [loading, setLoading] = useState(true);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [filtros, setFiltros] = useState({
    buscar: '',
    estado: '',
    fechaDesde: '',
    fechaHasta: '',
    banco: '',
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor) params.set(clave, valor);
    });
    const [ventasResultado, resumenResultado] = await Promise.allSettled([
      api.get(`/venta-tarjeta/listar?${params}`),
      api.get('/venta-tarjeta/resumen/ventas'),
    ]);
    setLoading(false);

    if (ventasResultado.status !== 'fulfilled' || !ventasResultado.value.ok) {
      setVentas([]);
      await notificarError(ventasResultado.value, 'No se pudieron cargar las ventas con tarjeta.');
    } else {
      setVentas(RESULTADO_LISTA(ventasResultado.value));
    }
    setResumen(
      resumenResultado.status === 'fulfilled' && resumenResultado.value.ok
        ? { ...RESUMEN_VACIO, ...(resumenResultado.value.data.resultado || {}) }
        : RESUMEN_VACIO,
    );
  }, [filtros]);

  useEffect(() => { cargar(); }, [cargar]);

  const costos = NUMERO(resumen.comision_acumulada) + NUMERO(resumen.retencion_acumulada);

  return (
    <div className="page finance-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ventas con Tarjeta</h1>
          <p className="page-subtitle">Control de acreditaciones y costos bancarios</p>
        </div>
      </div>

      <div className="finance-kpi-grid">
        <StatCard icon={<CreditCard size={21} />} label="Total ventas" value={resumen.total_ventas} color="#2980b9" />
        <StatCard icon={<ReceiptText size={21} />} label="Monto esperado" value={FMT(resumen.monto_total)} color="#6f42c1" />
        <StatCard icon={<Landmark size={21} />} label="Bruto acreditado" value={FMT(resumen.monto_bruto_acreditado)} color="#2980b9" />
        <StatCard icon={<WalletCards size={21} />} label="Neto recibido" value={FMT(resumen.monto_neto_acreditado)} color="#27ae60" />
        <StatCard icon={<Banknote size={21} />} label="Costos bancarios" value={FMT(costos)} color="#e74c3c" />
      </div>

      <FilterCard
        titulo="Filtros"
        onLimpiar={() => setFiltros({ buscar: '', estado: '', fechaDesde: '', fechaHasta: '', banco: '' })}
        resultado={!loading ? `${ventas.length} venta${ventas.length === 1 ? '' : 's'}` : ''}
      >
        <FilterItem label="Buscar" span={2}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 9, top: 9, color: '#94a3b8' }} />
            <input style={{ ...filterInputStyle, paddingLeft: 30 }} placeholder="Factura o cliente" value={filtros.buscar} onChange={(event) => setFiltros({ ...filtros, buscar: event.target.value })} />
          </div>
        </FilterItem>
        <FilterItem label="Estado">
          <select style={filterInputStyle} value={filtros.estado} onChange={(event) => setFiltros({ ...filtros, estado: event.target.value })}>
            <option value="">Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="PARCIALMENTE_ACREDITADA">Parcialmente acreditada</option>
            <option value="ACREDITADA">Acreditada</option>
            <option value="LEGACY_LIQUIDADA">Liquidada histórica</option>
            <option value="ANULADA">Anulada</option>
          </select>
        </FilterItem>
        <FilterItem label="Desde">
          <input type="date" style={filterInputStyle} value={filtros.fechaDesde} onChange={(event) => setFiltros({ ...filtros, fechaDesde: event.target.value })} />
        </FilterItem>
        <FilterItem label="Hasta">
          <input type="date" style={filterInputStyle} value={filtros.fechaHasta} onChange={(event) => setFiltros({ ...filtros, fechaHasta: event.target.value })} />
        </FilterItem>
        <FilterItem label="Banco">
          <input style={filterInputStyle} value={filtros.banco} onChange={(event) => setFiltros({ ...filtros, banco: event.target.value })} placeholder="Nombre del banco" />
        </FilterItem>
      </FilterCard>

      <TableCard
        loading={loading}
        loadingText="Cargando ventas con tarjeta..."
        empty={!loading && ventas.length === 0}
        emptyIcon={<CreditCard size={34} />}
        emptyText="No existen ventas con tarjeta para los filtros seleccionados."
        hidePagination
      >
        <table className="finance-table">
          <thead>
            <tr>
              <th>Factura</th><th>Cliente</th><th>Fecha Venta</th><th>Total Esperado</th>
              <th>Bruto Acreditado</th><th>Neto Recibido</th><th>Saldo Pendiente</th>
              <th>Última Acreditación</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((venta) => {
              const puedeRegistrar = ['PENDIENTE', 'PARCIALMENTE_ACREDITADA'].includes(venta.estado);
              return (
                <tr key={venta.id}>
                  <td><code>{venta.factura_id_personalizado || venta.factura_id}</code></td>
                  <td style={{ fontWeight: 600 }}>{venta.cliente_nombre || '—'}</td>
                  <td>{FECHA(venta.fecha_venta)}</td>
                  <td className="finance-amount">{FMT(venta.monto_total)}</td>
                  <td className="finance-amount" style={{ color: '#2980b9' }}>{FMT(venta.monto_bruto_acreditado)}</td>
                  <td className="finance-amount finance-amount--positive">{FMT(venta.monto_neto_acreditado)}</td>
                  <td className={`finance-amount ${NUMERO(venta.saldo_pendiente) > 0 ? 'finance-amount--negative' : 'finance-amount--positive'}`}>{FMT(venta.saldo_pendiente)}</td>
                  <td>{FECHA(venta.fecha_ultima_acreditacion)}</td>
                  <td>
                    <EstadoBadge
                      estado={venta.estado}
                      title={venta.estado === 'LEGACY_LIQUIDADA' ? 'Registro histórico sin movimientos financieros retroactivos.' : undefined}
                    />
                  </td>
                  <td>
                    {venta.estado !== 'ANULADA' && (
                      <button
                        className={`btn ${puedeRegistrar ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                        onClick={() => puedeRegistrar
                          ? setVentaSeleccionada(venta)
                          : navigate(`/ventas/venta-tarjeta/${venta.id}`)}
                      >
                        {puedeRegistrar ? 'Registrar ingreso' : 'Ver'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>

      <VentaTarjetaModal
        abierto={Boolean(ventaSeleccionada)}
        venta={ventaSeleccionada}
        onCerrar={() => setVentaSeleccionada(null)}
        onRegistrada={cargar}
      />
    </div>
  );
}
