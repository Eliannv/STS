import { useState, useEffect } from 'react';
import { api } from '../../api/api';
import StatCard from '../common/StatCard';
import { ShoppingCart, DollarSign, CreditCard, TrendingUp, Handshake, Wallet, CircleDollarSign, Landmark, X } from 'lucide-react';

function fmt(v) {
  const n = parseFloat(v ?? 0);
  return isNaN(n) ? '$0.00' : '$' + n.toFixed(2);
}
function fmtN(v) { return parseInt(v ?? 0); }

function getRolTexto(rol) {
  if (!rol) return '—';
  return rol === 'ADMINISTRADOR' ? 'Administrador' : 'Operador';
}

export default function EmpleadoDetalleModal({ empleado, mes, anio, onCerrar }) {
  const [detalle, setDetalle] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!empleado) return;
    setLoading(true);
    Promise.all([
      api.get(`/empleado-metricas/detalle/${empleado.id}?mes=${mes}&anio=${anio}`),
      api.get(`/empleado-metricas/historial/${empleado.id}?meses=6`),
    ]).then(([dRes, hRes]) => {
      if (dRes.ok) setDetalle(dRes.data.resultado);
      if (hRes.ok) setHistorial(hRes.data.resultado || []);
      setLoading(false);
    });
  }, [empleado, mes, anio]);

  if (!empleado) return null;

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" style={{ maxWidth: 900, width: '96%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Detalle de Empleado</span>
          <button className="btn-icon" onClick={onCerrar}><X size={18} /></button>
        </div>

        {/* Cabecera del empleado */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e9ecef', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: '50%',
            background: '#3498db', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, flexShrink: 0,
          }}>
            {(empleado.nombre_completo || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{empleado.nombre_completo}</div>
            <div style={{ fontSize: 12, color: '#6c757d' }}>{getRolTexto(empleado.rol)} · {empleado.email}</div>
          </div>
          <span style={{
            marginLeft: 'auto', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: empleado.activo ? '#d4edda' : '#f8d7da',
            color: empleado.activo ? '#155724' : '#721c24',
          }}>
            {empleado.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6c757d' }}>
              <div className="spinner" /><p style={{ marginTop: 12 }}>Calculando métricas...</p>
            </div>
          ) : detalle ? (
            <>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#495057', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Resumen Comercial</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12, marginBottom: 20 }}>
                <StatCard icon={<ShoppingCart size={20} />} label="Ventas" value={fmtN(detalle.ventas?.totalVentas)} color="#3498db" />
                <StatCard icon={<DollarSign size={20} />} label="Total vendido" value={fmt(detalle.ventas?.montoTotalVendido)} color="#2980b9" />
                <StatCard icon={<CreditCard size={20} />} label="Monto abonado" value={fmt(detalle.ventas?.montoAbonado)} color="#1abc9c" />
                <StatCard icon={<TrendingUp size={20} />} label="Prom. venta" value={fmt(detalle.ventas?.promedioPorVenta)} color="#27ae60" />
              </div>

              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#495057', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Cobros de Deuda</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12, marginBottom: 20 }}>
                <StatCard icon={<Handshake size={20} />} label="Cobros" value={fmtN(detalle.cobros?.cantidadCobros)} color="#e67e22" />
                <StatCard icon={<Wallet size={20} />} label="Monto cobrado" value={fmt(detalle.cobros?.montoCobrado)} color="#e74c3c" />
              </div>

              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#495057', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Movimientos en Cajas</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12, marginBottom: 24 }}>
                <StatCard icon={<CircleDollarSign size={20} />} label="Caja Chica (mov.)" value={fmtN(detalle.cajaChica?.cantidad)} color="#9b59b6" />
                <StatCard icon={<CircleDollarSign size={20} />} label="C. Chica (monto)" value={fmt(detalle.cajaChica?.montoIngresado)} color="#8e44ad" />
                <StatCard icon={<Landmark size={20} />} label="Caja Banco (mov.)" value={fmtN(detalle.cajaBanco?.cantidad)} color="#16a085" />
                <StatCard icon={<Landmark size={20} />} label="C. Banco (monto)" value={fmt(detalle.cajaBanco?.montoIngresado)} color="#1abc9c" />
              </div>

              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#495057', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Historial Últimos 6 Meses</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      {['Mes','Ventas','Monto vend.','Cobros','Monto cobrado','Total'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: '#6c757d', borderBottom: '2px solid #dee2e6', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map(m => (
                      <tr key={`${m.anio}-${m.mes}`} style={{ borderBottom: '1px solid #f0f2f5' }}>
                        <td style={{ padding: '7px 10px', fontWeight: 600 }}>{m.mes_nombre}</td>
                        <td style={{ padding: '7px 10px' }}>{fmtN(m.total_ventas)}</td>
                        <td style={{ padding: '7px 10px' }}>{fmt(m.monto_abonado)}</td>
                        <td style={{ padding: '7px 10px' }}>{fmtN(m.total_cobros)}</td>
                        <td style={{ padding: '7px 10px' }}>{fmt(m.monto_cobrado)}</td>
                        <td style={{ padding: '7px 10px', fontWeight: 700, color: '#2980b9' }}>{fmt(parseFloat(m.monto_abonado ?? 0) + parseFloat(m.monto_cobrado ?? 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 30, color: '#6c757d' }}>No se pudo cargar el detalle.</div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid #e9ecef', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
