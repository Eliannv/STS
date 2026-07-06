import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Search, CreditCard, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import './VentaTarjeta.css';

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

export default function VentaTarjeta() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  // State
  const [ventas, setVentas] = useState([]);
  const [resumen, setResumen] = useState({ total_ventas: 0, monto_total: 0, saldo_pendiente_total: 0 });
  const [cargando, setCargando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroBuscar, setFiltroBuscar] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  // Funciones
  async function cargarVentas() {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado) params.append('estado', filtroEstado);
      if (filtroBuscar) params.append('buscar', filtroBuscar);
      if (filtroFechaDesde) params.append('fechaDesde', filtroFechaDesde);
      if (filtroFechaHasta) params.append('fechaHasta', filtroFechaHasta);

      const r = await api.get(`/venta-tarjeta/listar?${params}`);
      console.log('Respuesta cargarVentas:', r.data);
      
      if (r.ok) {
        const resultado = r.data.resultado || [];
        setVentas(Array.isArray(resultado) ? resultado : []);
      } else {
        console.error('Error en respuesta:', r.data);
        setVentas([]);
        Swal.fire('Error', r.data.resultado || 'Error al cargar ventas', 'error');
      }
    } catch (error) {
      console.error('Error cargarVentas:', error);
      setVentas([]);
      Swal.fire('Error', 'Error al cargar ventas tarjeta', 'error');
    } finally {
      setCargando(false);
    }
  }

  async function cargarResumen() {
    try {
      const r = await api.get('/venta-tarjeta/resumen/ventas');
      console.log('Respuesta cargarResumen:', r.data);
      
      if (r.ok) {
        const resultado = r.data.resultado || {};
        setResumen({
          total_ventas: resultado.total_ventas || 0,
          monto_total: resultado.monto_total || 0,
          saldo_pendiente_total: resultado.saldo_pendiente_total || 0,
          monto_recibido: resultado.monto_recibido || 0
        });
      } else {
        console.error('Error en resumen:', r.data);
        setResumen({ total_ventas: 0, monto_total: 0, saldo_pendiente_total: 0, monto_recibido: 0 });
      }
    } catch (error) {
      console.error('Error cargarResumen:', error);
      setResumen({ total_ventas: 0, monto_total: 0, saldo_pendiente_total: 0, monto_recibido: 0 });
    }
  }

  // Effects
  useEffect(() => {
    cargarVentas();
    cargarResumen();
  }, [filtroEstado, filtroBuscar, filtroFechaDesde, filtroFechaHasta]);

  function handleBuscarChange(e) {
    setFiltroBuscar(e.target.value);
  }

  function handleEstadoChange(e) {
    setFiltroEstado(e.target.value);
  }

  function handleFechaDesdeChange(e) {
    setFiltroFechaDesde(e.target.value);
  }

  function handleFechaHastaChange(e) {
    setFiltroFechaHasta(e.target.value);
  }

  function handleVerDetalle(id) {
    navigate(`/ventas/venta-tarjeta/${id}`);
  }

  return (
    <div className="venta-tarjeta-container">
      {/* Encabezado */}
      <div className="vt-header">
        <h1>
          <CreditCard size={32} />
          Ventas con Tarjeta
        </h1>
        <p>Gestión de depósitos recibidos del banco</p>
      </div>

      {/* Stats */}
      <div className="vt-stats">
        <div className="vt-stat-card">
          <div className="vt-stat-label">Total Ventas</div>
          <div className="vt-stat-value">{resumen.total_ventas || 0}</div>
        </div>
        <div className="vt-stat-card">
          <div className="vt-stat-label">Monto Total</div>
          <div className="vt-stat-value">{FMT(resumen.monto_total)}</div>
        </div>
        <div className="vt-stat-card">
          <div className="vt-stat-label">Saldo Pendiente</div>
          <div className="vt-stat-value" style={{ color: resumen.saldo_pendiente_total > 0 ? '#dc3545' : '#28a745' }}>
            {FMT(resumen.saldo_pendiente_total)}
          </div>
        </div>
        <div className="vt-stat-card">
          <div className="vt-stat-label">Recibido del Banco</div>
          <div className="vt-stat-value" style={{ color: '#28a745' }}>
            {FMT((resumen.monto_total || 0) - (resumen.saldo_pendiente_total || 0))}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="vt-filtros">
        <div className="vt-filtro-grupo">
          <label>Búsqueda</label>
          <div className="vt-search-input">
            <Search size={18} />
            <input
              type="text"
              placeholder="Factura, cliente, banco..."
              value={filtroBuscar}
              onChange={handleBuscarChange}
            />
          </div>
        </div>

        <div className="vt-filtro-grupo">
          <label>Estado</label>
          <select value={filtroEstado} onChange={handleEstadoChange}>
            <option value="">Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="LIQUIDADA">Liquidada</option>
          </select>
        </div>

        <div className="vt-filtro-grupo">
          <label>Desde</label>
          <input
            type="date"
            value={filtroFechaDesde}
            onChange={handleFechaDesdeChange}
          />
        </div>

        <div className="vt-filtro-grupo">
          <label>Hasta</label>
          <input
            type="date"
            value={filtroFechaHasta}
            onChange={handleFechaHastaChange}
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="vt-tabla-container">
        {cargando ? (
          <div className="vt-loading">Cargando...</div>
        ) : !Array.isArray(ventas) || ventas.length === 0 ? (
          <div className="vt-sin-datos">
            <AlertCircle size={40} />
            <p>No hay ventas con tarjeta</p>
          </div>
        ) : (
          <table className="vt-tabla">
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
              {ventas.map(venta => (
                <tr key={venta.id}>
                  <td className="vt-factura">{venta.factura_id_personalizado || venta.factura_id}</td>
                  <td>{venta.cliente_nombre}</td>
                  <td>{FECHAFMT(venta.fecha_venta)}</td>
                  <td className="vt-monto">{FMT(venta.monto_total)}</td>
                  <td className="vt-recibido">{FMT(venta.monto_recibido)}</td>
                  <td className="vt-saldo" style={{ color: venta.saldo_pendiente > 0 ? '#dc3545' : '#28a745' }}>
                    {FMT(venta.saldo_pendiente)}
                  </td>
                  <td>{venta.banco || '—'}</td>
                  <td>
                    <span
                      className="vt-badge"
                      style={ESTADO_BADGE[venta.estado]}
                    >
                      {ESTADO_BADGE[venta.estado]?.label || venta.estado}
                    </span>
                  </td>
                  <td>
                    <button
                      className="vt-btn-ver"
                      onClick={() => handleVerDetalle(venta.id)}
                      title="Ver detalles y registrar abonos"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
