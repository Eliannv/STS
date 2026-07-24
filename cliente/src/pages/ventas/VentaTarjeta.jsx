// cliente/src/pages/ventas/VentaTarjeta.jsx
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { api } from '../../api/api';
import FilterCard, {
  FilterItem,
  filterInputStyle,
} from '../../components/common/FilterCard';
import StatCard from '../../components/common/StatCard';
import TableCard from '../../components/common/TableCard';

const FMT = (valor) => `$${Number(valor || 0).toLocaleString('es-EC', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const FECHAFMT = (fecha) => {
  if (!fecha) return '—';
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime())
    ? fecha
    : valor.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
};

const ESTADO_BADGE = {
  PENDIENTE: { bg: '#fff3cd', color: '#856404', label: 'Pendiente' },
  PROCESANDO: { bg: '#dbeafe', color: '#1d4ed8', label: 'Procesando' },
  PARCIALMENTE_ACREDITADA: {
    bg: '#ffedd5',
    color: '#c2410c',
    label: 'Acreditación parcial',
  },
  ACREDITADA: { bg: '#d4edda', color: '#155724', label: 'Acreditada' },
  RECHAZADA: { bg: '#fee2e2', color: '#b91c1c', label: 'Rechazada' },
  ANULADA: { bg: '#e5e7eb', color: '#4b5563', label: 'Anulada' },
  LEGACY_LIQUIDADA: {
    bg: '#e0e7ff',
    color: '#4338ca',
    label: 'Liquidada histórica',
  },
};

const BADGE = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 600,
};

const iconoTarjeta = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

const iconoDinero = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const iconoBanco = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m3 10 9-7 9 7" />
    <path d="M5 10v9" />
    <path d="M9 10v9" />
    <path d="M15 10v9" />
    <path d="M19 10v9" />
    <path d="M3 21h18" />
  </svg>
);

const iconoCosto = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12h8" />
  </svg>
);

const resumenVacio = {
  total_ventas: 0,
  monto_total: 0,
  monto_bruto_acreditado: 0,
  monto_neto_acreditado: 0,
  comision_acumulada: 0,
  retencion_acumulada: 0,
};

export default function VentaTarjeta() {
  const navigate = useNavigate();
  const [ventas, setVentas] = useState([]);
  const [resumen, setResumen] = useState(resumenVacio);
  const [cargando, setCargando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroBuscar, setFiltroBuscar] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  const cargarVentas = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado) params.append('estado', filtroEstado);
      if (filtroBuscar) params.append('buscar', filtroBuscar);
      if (filtroFechaDesde) params.append('fechaDesde', filtroFechaDesde);
      if (filtroFechaHasta) params.append('fechaHasta', filtroFechaHasta);

      const respuesta = await api.get(`/venta-tarjeta/listar?${params}`);
      if (!respuesta.ok) {
        throw new Error(
          respuesta.data.resultado
          || respuesta.data.mensaje
          || 'Error al cargar ventas',
        );
      }
      const resultado = respuesta.data.resultado || [];
      setVentas(Array.isArray(resultado) ? resultado : []);
    } catch (error) {
      setVentas([]);
      Swal.fire('Error', error.message || 'Error al cargar ventas con tarjeta', 'error');
    } finally {
      setCargando(false);
    }
  }, [filtroBuscar, filtroEstado, filtroFechaDesde, filtroFechaHasta]);

  const cargarResumen = useCallback(async () => {
    try {
      const respuesta = await api.get('/venta-tarjeta/resumen/ventas');
      setResumen(respuesta.ok
        ? { ...resumenVacio, ...(respuesta.data.resultado || {}) }
        : resumenVacio);
    } catch {
      setResumen(resumenVacio);
    }
  }, []);

  useEffect(() => {
    cargarVentas();
    cargarResumen();
  }, [cargarResumen, cargarVentas]);

  function limpiarFiltros() {
    setFiltroBuscar('');
    setFiltroEstado('');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
  }

  const costosBancarios =
    Number(resumen.comision_acumulada || 0)
    + Number(resumen.retencion_acumulada || 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ventas con Tarjeta</h1>
          <p className="page-subtitle">Control de acreditaciones bancarias de ventas con tarjeta</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        <StatCard icon={iconoTarjeta} label="Total ventas" value={resumen.total_ventas} color="#3498db" />
        <StatCard icon={iconoDinero} label="Monto esperado" value={FMT(resumen.monto_total)} color="#9b59b6" />
        <StatCard icon={iconoBanco} label="Bruto acreditado" value={FMT(resumen.monto_bruto_acreditado)} color="#0ea5e9" />
        <StatCard icon={iconoBanco} label="Neto recibido" value={FMT(resumen.monto_neto_acreditado)} color="#27ae60" />
        <StatCard icon={iconoCosto} label="Costos bancarios" value={FMT(costosBancarios)} color="#e67e22" />
      </div>

      <FilterCard onLimpiar={limpiarFiltros}>
        <FilterItem label="Buscar" span={3}>
          <div style={{ position: 'relative' }}>
            <svg
              style={{
                position: 'absolute',
                left: 9,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#aaa',
                pointerEvents: 'none',
              }}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              style={{ ...filterInputStyle, paddingLeft: 30 }}
              placeholder="Factura o cliente..."
              value={filtroBuscar}
              onChange={(event) => setFiltroBuscar(event.target.value)}
            />
          </div>
        </FilterItem>
        <FilterItem label="Estado">
          <select
            value={filtroEstado}
            onChange={(event) => setFiltroEstado(event.target.value)}
            style={filterInputStyle}
          >
            <option value="">Todos</option>
            {Object.entries(ESTADO_BADGE).map(([estado, badge]) => (
              <option key={estado} value={estado}>{badge.label}</option>
            ))}
          </select>
        </FilterItem>
        <FilterItem label="Desde">
          <input
            type="date"
            value={filtroFechaDesde}
            onChange={(event) => setFiltroFechaDesde(event.target.value)}
            style={filterInputStyle}
          />
        </FilterItem>
        <FilterItem label="Hasta">
          <input
            type="date"
            value={filtroFechaHasta}
            onChange={(event) => setFiltroFechaHasta(event.target.value)}
            style={filterInputStyle}
          />
        </FilterItem>
      </FilterCard>

      <TableCard
        scrollY
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
              <th>Monto esperado</th>
              <th>Bruto acreditado</th>
              <th>Neto recibido</th>
              <th>Saldo</th>
              <th>Última acreditación</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((venta) => {
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
                  <td style={{ color: '#0ea5e9', fontWeight: 600 }}>{FMT(venta.monto_bruto_acreditado)}</td>
                  <td style={{ color: '#27ae60', fontWeight: 600 }}>{FMT(venta.monto_neto_acreditado)}</td>
                  <td style={{ fontWeight: 600, color: Number(venta.saldo_pendiente) > 0 ? '#e74c3c' : '#27ae60' }}>
                    {FMT(venta.saldo_pendiente)}
                  </td>
                  <td style={{ fontSize: 12, color: '#6c757d' }}>{FECHAFMT(venta.fecha_ultima_acreditacion)}</td>
                  <td>
                    <span style={{ ...BADGE, background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/ventas/venta-tarjeta/${venta.id}`)}
                    >
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
