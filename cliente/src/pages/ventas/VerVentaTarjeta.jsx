import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { ChevronLeft, Plus, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import AbonoTarjetaModal from '../../components/ventas/AbonoTarjetaModal';
import './VerVentaTarjeta.css';

const FMT = v => `$${parseFloat(v || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;
const FECHAFMT = s => {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const ESTADO_BADGE = {
  PENDIENTE: { bg: '#fff3cd', color: '#856404', label: 'Pendiente' },
  LIQUIDADA: { bg: '#d4edda', color: '#155724', label: 'Liquidada' },
};

export default function VerVentaTarjeta() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [venta, setVenta] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Funciones
  async function cargarVenta() {
    try {
      setCargando(true);
      const r = await api.get(`/venta-tarjeta/${id}`);
      console.log('Respuesta cargarVenta:', r.data);
      
      if (r.ok) {
        setVenta(r.data.resultado);
      } else {
        Swal.fire('Error', r.data.resultado || 'Error al cargar venta', 'error');
        navigate('/ventas/venta-tarjeta');
      }
    } catch (error) {
      console.error('Error cargarVenta:', error);
      Swal.fire('Error', 'Error al cargar venta tarjeta', 'error');
      navigate('/ventas/venta-tarjeta');
    } finally {
      setCargando(false);
    }
  }

  async function cargarHistorial() {
    try {
      const r = await api.get(`/venta-tarjeta/${id}/historial`);
      console.log('Respuesta cargarHistorial:', r.data);
      
      if (r.ok) {
        const resultado = r.data.resultado || [];
        setHistorial(Array.isArray(resultado) ? resultado : []);
      }
    } catch (error) {
      console.error('Error cargarHistorial:', error);
    }
  }

  async function handleAbonoGuardado() {
    setMostrarModal(false);
    await cargarVenta();
    await cargarHistorial();
    Swal.fire('Éxito', 'Abono registrado correctamente', 'success');
  }

  // Effects
  useEffect(() => {
    cargarVenta();
    cargarHistorial();
  }, [id]);

  if (cargando) {
    return (
      <div className="vvt-container">
        <div className="vvt-loading">Cargando...</div>
      </div>
    );
  }

  if (!venta) {
    return (
      <div className="vvt-container">
        <div className="vvt-error">Venta no encontrada</div>
      </div>
    );
  }

  const progreso = venta.monto_total > 0 ? (venta.monto_recibido / venta.monto_total) * 100 : 0;

  return (
    <div className="vvt-container">
      {/* Encabezado */}
      <div className="vvt-header">
        <button className="vvt-btn-volver" onClick={() => navigate('/ventas/venta-tarjeta')}>
          <ChevronLeft size={20} />
          Volver
        </button>
        <div>
          <h1>Factura #{venta.factura_id_personalizado || venta.factura_id}</h1>
          <p className="vvt-subtitle">{venta.cliente_nombre}</p>
        </div>
      </div>

      {/* Información Principal */}
      <div className="vvt-grid">
        {/* Tarjeta Izquierda */}
        <div className="vvt-card">
          <div className="vvt-card-section">
            <h3>Información de la Venta</h3>
            <div className="vvt-info-row">
              <label>Fecha:</label>
              <span>{FECHAFMT(venta.fecha_venta)}</span>
            </div>
            <div className="vvt-info-row">
              <label>Cliente:</label>
              <span>{venta.cliente_nombre_completo || venta.cliente_nombre}</span>
            </div>
            <div className="vvt-info-row">
              <label>Banco:</label>
              <span>{venta.banco || '—'}</span>
            </div>
            <div className="vvt-info-row">
              <label>Últimos 4 dígitos:</label>
              <span>{venta.ultimos_cuatro_tarjeta || '—'}</span>
            </div>
            <div className="vvt-info-row">
              <label>Observación:</label>
              <span>{venta.observacion || '—'}</span>
            </div>
          </div>

          <div className="vvt-card-section">
            <h3>Estado</h3>
            <div style={{ marginTop: '12px' }}>
              <span
                className="vvt-badge-grande"
                style={ESTADO_BADGE[venta.estado]}
              >
                {ESTADO_BADGE[venta.estado]?.label || venta.estado}
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta Derecha */}
        <div className="vvt-card vvt-card-montos">
          <div className="vvt-monto-item">
            <div className="vvt-monto-label">Monto Total</div>
            <div className="vvt-monto-valor">{FMT(venta.monto_total)}</div>
          </div>

          <div className="vvt-progreso-contenedor">
            <div className="vvt-progreso-etiqueta">
              <span>Recibido del Banco</span>
              <span>{FMT(venta.monto_recibido)}</span>
            </div>
            <div className="vvt-progreso-barra">
              <div
                className="vvt-progreso-lleno"
                style={{ width: `${Math.min(progreso, 100)}%` }}
              />
            </div>
            <div className="vvt-progreso-porcentaje">{progreso.toFixed(1)}%</div>
          </div>

          <div className="vvt-monto-item">
            <div className="vvt-monto-label">Saldo Pendiente</div>
            <div className="vvt-monto-valor" style={{ color: venta.saldo_pendiente > 0 ? '#dc3545' : '#28a745' }}>
              {FMT(venta.saldo_pendiente)}
            </div>
          </div>

          {venta.saldo_pendiente > 0 && (
            <button className="vvt-btn-registrar" onClick={() => setMostrarModal(true)}>
              <Plus size={18} />
              Registrar Abono
            </button>
          )}
        </div>
      </div>

      {/* Historial de Abonos */}
      <div className="vvt-card vvt-card-historial">
        <h3>Historial de Depósitos</h3>
        
        {historial.length === 0 ? (
          <div className="vvt-sin-historial">
            <AlertCircle size={32} />
            <p>Sin abonos registrados aún</p>
          </div>
        ) : !Array.isArray(historial) ? (
          <div className="vvt-sin-historial">
            <AlertCircle size={32} />
            <p>Error al cargar historial</p>
          </div>
        ) : (
          <table className="vvt-tabla-historial">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              {historial.map(abono => (
                <tr key={abono.id}>
                  <td>{FECHAFMT(abono.fecha)}</td>
                  <td className="vvt-monto-historial">{FMT(abono.monto)}</td>
                  <td>{abono.observacion || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Registrar Abono */}
      {mostrarModal && (
        <AbonoTarjetaModal
          ventaTarjetaId={venta.id}
          saldoPendiente={venta.saldo_pendiente}
          onGuardar={handleAbonoGuardado}
          onCerrar={() => setMostrarModal(false)}
        />
      )}
    </div>
  );
}
