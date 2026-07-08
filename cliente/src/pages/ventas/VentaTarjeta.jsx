import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import StatCard from '../../components/common/StatCard';
import FilterCard, { FilterItem, filterInputStyle } from '../../components/common/FilterCard';
import TableCard from '../../components/common/TableCard';

const FMT = v => `$${parseFloat(v || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;
const FECHAFMT = s => {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const ESTADO_BADGE = {
  PENDIENTE: { bg: '#fff3cd', color: '#856404', label: 'Pendiente' },
  LIQUIDADA: { bg: '#d4edda', color: '#155724', label: 'Liquidada' },
};

const BADGE = {
  display: 'inline-block', padding: '2px 8px', borderRadius: 20,
  fontSize: 11, fontWeight: 600,
};

export default function VentaTarjeta() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [ventas, setVentas] = useState([]);
  const [resumen, setResumen] = useState({ total_ventas: 0, monto_total: 0, saldo_pendiente_total: 0, monto_recibido: 0 });
  const [cargando, setCargando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroBuscar, setFiltroBuscar] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  async function cargarVentas() {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado) params.append('estado', filtroEstado);
      if (filtroBuscar) params.append('buscar', filtroBuscar);
      if (filtroFechaDesde) params.append('fechaDesde', filtroFechaDesde);
      if (filtroFechaHasta) params.append('fechaHasta', filtroFechaHasta);

      const r = await api.get(`/venta-tarjeta/listar?${params}`);
      if (r.ok) {
        const resultado = r.data.resultado || [];
        setVentas(Array.isArray(resultado) ? resultado : []);
      } else {
        setVentas([]);
        Swal.fire('Error', r.data.resultado || 'Error al cargar ventas', 'error');
      }
    } catch (error) {
      setVentas([]);
      Swal.fire('Error', 'Error al cargar ventas tarjeta', 'error');
    } finally {
      setCargando(false);
    }
  }

  async function cargarResumen() {
    try {
      const r = await api.get('/venta-tarjeta/resumen/ventas');
      if (r.ok) {
        const resultado = r.data.resultado || {};
        setResumen({
          total_ventas: resultado.total_ventas || 0,
          monto_total: resultado.monto_total || 0,
          saldo_pendiente_total: resultado.saldo_pendiente_total || 0,
          monto_recibido: resultado.monto_recibido || 0,
        });
      } else {
        setResumen({ total_ventas: 0, monto_total: 0, saldo_pendiente_total: 0, monto_recibido: 0 });
      }
    } catch (error) {
      setResumen({ total_ventas: 0, monto_total: 0, saldo_pendiente_total: 0, monto_recibido: 0 });
    }
  }

  useEffect(() => {
    cargarVentas();
    cargarResumen();
  }, [filtroEstado, filtroBuscar, filtroFechaDesde, filtroFechaHasta]);

  function limpiarFiltros() {
    setFiltroBuscar(''); setFiltroEstado(''); setFiltroFechaDesde(''); setFiltroFechaHasta('');
  }

  function handleVerDetalle(id) {
    navigate(`/ventas/venta-tarjeta/${id}`);
  }

  return (
    <div className="page">

      <div className="page-header">
        <div>
          <h1 className="page-title">Ventas con Tarjeta</h1>
          <p className="page-subtitle">Gestión de depósitos recibidos del banco</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        <StatCard icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
          label="Total ventas" value={resumen.total_ventas || 0} color="#3498db" />
        <StatCard icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          label="Monto total" value={FMT(resumen.monto_total)} color="#9b59b6" />
        <StatCard icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
          label="Saldo pendiente" value={FMT(resumen.saldo_pendiente_total)} color={resumen.saldo_pendiente_total > 0 ? '#e74c3c' : '#27ae60'} />
        <StatCard icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          label="Recibido banco" value={FMT((resumen.monto_total || 0) - (resumen.saldo_pendiente_total || 0))} color="#27ae60" />
      </div>

      <FilterCard onLimpiar={limpiarFiltros}>
        <FilterItem label="Buscar" span={3}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input style={{ ...filterInputStyle, paddingLeft: 30 }} placeholder="Factura, cliente, banco..."
              value={filtroBuscar} onChange={e => setFiltroBuscar(e.target.value)} />
          </div>
        </FilterItem>
        <FilterItem label="Estado">
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={filterInputStyle}>
            <option value="">Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="LIQUIDADA">Liquidada</option>
          </select>
        </FilterItem>
        <FilterItem label="Desde">
          <input type="date" value={filtroFechaDesde} onChange={e => setFiltroFechaDesde(e.target.value)} style={filterInputStyle} />
        </FilterItem>
        <FilterItem label="Hasta">
          <input type="date" value={filtroFechaHasta} onChange={e => setFiltroFechaHasta(e.target.value)} style={filterInputStyle} />
        </FilterItem>
      </FilterCard>

      <TableCard scrollY
        loading={cargando}
        empty={ventas.length === 0}
        emptyText="No hay ventas con tarjeta"
        hidePagination
      >
        <table>
          <thead>
            <tr>
              <th>Factura</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Monto Total</th>
              <th>Recibido</th>
              <th>Saldo</th>
              <th>Banco</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map(venta => {
              const badge = ESTADO_BADGE[venta.estado] || ESTADO_BADGE.PENDIENTE;
              return (
                <tr key={venta.id}>
                  <td>
                    <code style={{ background: '#f0f4ff', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                      {venta.factura_id_personalizado || venta.factura_id}
                    </code>
                  </td>
                  <td style={{ fontWeight: 600 }}>{venta.cliente_nombre}</td>
                  <td style={{ fontSize: 12, color: '#6c757d' }}>{FECHAFMT(venta.fecha_venta)}</td>
                  <td style={{ fontWeight: 600 }}>{FMT(venta.monto_total)}</td>
                  <td style={{ color: '#27ae60', fontWeight: 500 }}>{FMT(venta.monto_recibido)}</td>
                  <td style={{ fontWeight: 600, color: venta.saldo_pendiente > 0 ? '#e74c3c' : '#27ae60' }}>
                    {FMT(venta.saldo_pendiente)}
                  </td>
                  <td>{venta.banco || '—'}</td>
                  <td>
                    <span style={{ ...BADGE, background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => handleVerDetalle(venta.id)}>
                      Ver
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}
