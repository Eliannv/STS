import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cargarDashboardResumen } from '../api/dashboardApi';
import StatCard from '../components/common/StatCard';
import {
  ShoppingCart, DollarSign, Users, PackageOpen, Handshake,
  AlertTriangle, Package, BarChart2,
  PlusCircle, FileText, Wallet, Landmark, Truck, Notebook,
  ArrowRight, User, House, TrendingUp, TrendingDown, Activity,
} from 'lucide-react';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function fmt(v) {
  const n = parseFloat(v ?? 0);
  return isNaN(n) ? '$0.00' : '$' + n.toFixed(2);
}
function fmtFecha(f) {
  if (!f) return '—';
  const d = new Date(f);
  return isNaN(d) ? f : d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
}
const BADGE_ESTADO = {
  PAGADA:    { bg: '#d4edda', color: '#155724' },
  PENDIENTE: { bg: '#fff3cd', color: '#856404' },
  PARCIAL:   { bg: '#cce5ff', color: '#004085' },
};

function Section({ titulo, children, style }) {
  return (
    <div style={{ marginBottom: 24, ...style }}>
      <h2 style={{ fontSize: 12, fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 }}>
        {titulo}
      </h2>
      {children}
    </div>
  );
}

function CajaCard({ label, caja, stats, icon, colorOpen, route, navigate }) {
  const abierta = !!caja;
  const ingresos = stats?.totalIngresos  ?? 0;
  const egresos  = stats?.totalEgresos   ?? 0;
  const neto     = ingresos - egresos;
  const movs     = stats?.totalMovimientos ?? 0;

  return (
    <div
      onClick={() => caja && navigate(route + '/' + caja.id)}
      className="card"
      style={{
        padding: '16px 20px', cursor: caja ? 'pointer' : 'default',
        borderLeft: `4px solid ${abierta ? colorOpen : '#dee2e6'}`,
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => { if (caja) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, background: (abierta ? colorOpen : '#adb5bd') + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: abierta ? colorOpen : '#adb5bd' }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6c757d' }}>{label}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: abierta ? '#212529' : '#adb5bd', lineHeight: 1.2 }}>
            {abierta ? fmt(caja.montoActual ?? caja.saldoActual) : 'Cerrada'}
          </div>
          {abierta && (
            <div style={{ fontSize: 11, color: '#6c757d' }}>Inicial: {fmt(caja.montoInicial ?? caja.saldoInicial)}</div>
          )}
        </div>
        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: abierta ? colorOpen + '1a' : '#e9ecef', color: abierta ? colorOpen : '#6c757d', whiteSpace: 'nowrap' }}>
          {abierta ? 'ABIERTA' : 'CERRADA'}
        </span>
      </div>

      {/* Estadísticas del mes */}
      <div style={{ borderTop: '1px solid #f0f2f5', paddingTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <TrendingUp size={12} color="#27ae60" />
            <span style={{ fontSize: 10, color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>Ingresos</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#27ae60' }}>{fmt(ingresos)}</div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <TrendingDown size={12} color="#e74c3c" />
            <span style={{ fontSize: 10, color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>Egresos</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e74c3c' }}>{fmt(egresos)}</div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <DollarSign size={12} color={neto >= 0 ? '#2980b9' : '#e74c3c'} />
            <span style={{ fontSize: 10, color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>Neto</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: neto >= 0 ? '#2980b9' : '#e74c3c' }}>
            {neto >= 0 ? '+' : ''}{fmt(neto)}
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <Activity size={12} color="#6c757d" />
            <span style={{ fontSize: 10, color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>Movs.</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#495057' }}>{movs}</div>
        </div>
      </div>
      <div style={{ fontSize: 10, color: '#adb5bd', marginTop: 6 }}>Estadísticas del mes actual</div>
    </div>
  );
}

function NavCard({ label, icon, color, route, navigate }) {
  return (
    <div onClick={() => navigate(route)} className="card"
      style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e9ecef'; e.currentTarget.style.transform = ''; }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#495057', flex: 1 }}>{label}</span>
      <ArrowRight size={13} color="#adb5bd" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { usuario, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [kpis,    setKpis]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDashboardResumen().then(r => {
      if (r.ok) setKpis(r.data.resultado);
      setLoading(false);
    });
  }, []);

  const mesActual = new Date().toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });

  const accesosRapidos = [
    { label: 'Nueva Venta',   color: '#3498db', route: '/facturas/nueva',  icon: <PlusCircle  size={16} /> },
    { label: 'Cobrar Deuda',  color: '#e74c3c', route: '/facturas/cobrar', icon: <Handshake   size={16} /> },    
    { label: 'Ver Facturas',  color: '#27ae60', route: '/facturas',        icon: <FileText    size={16} /> },
    { label: 'Clientes',          color: '#3498db', route: '/clientes',    icon: <Users    size={16} /> },
    
    { label: 'Productos',         color: '#9b59b6', route: '/productos',   icon: <Package  size={16} /> },
    { label: 'Proveedores',       color: '#e67e22', route: '/proveedores', icon: <Truck    size={16} /> },
    
    ...(isAdmin ? [{ label: 'Empleados', color: '#2c3e50', route: '/empleados', icon: <BarChart2 size={16} /> }] : []),
    { label: 'Usuarios',          color: '#1abc9c', route: '/usuarios',    icon: <User     size={16} /> },

    { label: 'Ingresos',     color: '#f39c12', route: '/ingresos',    icon: <PackageOpen size={16} /> },
    { label: 'Sucursales',   color: '#8e44ad', route: '/sucursales',  icon: <House       size={16} /> },
    
  ];

  return (
    <div className="page">

      {/* ── Header ── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Bienvenido, {usuario?.nombre}!</h1>
          <p className="page-subtitle">
            Sales Technology System · Óptica Macías ·{' '}
            <span style={{ textTransform: 'capitalize' }}>{mesActual}</span>
          </p>
        </div>
      </div>

      {/* ── KPIs del mes ── */}
      <Section titulo={`Resumen de ${mesActual}`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <StatCard icon={<ShoppingCart size={20} />} label="Ventas del mes"     value={loading ? '…' : kpis?.ventas.totalVentasMes  ?? 0} subtext={loading ? '' : `${kpis?.ventas.ventasPendientes ?? 0} pendientes de cobro`} color="#3498db" />
          <StatCard icon={<DollarSign   size={20} />} label="Monto vendido"      value={loading ? '…' : fmt(kpis?.ventas.montoTotalMes)}   subtext={loading ? '' : `Cobrado: ${fmt(kpis?.ventas.montoAbonadoMes)}`}         color="#27ae60" />
          <StatCard icon={<Users        size={20} />} label="Clientes activos"   value={loading ? '…' : kpis?.clientes.totalActivos   ?? 0} subtext={loading ? '' : `+${kpis?.clientes.nuevosMes ?? 0} nuevos este mes`}      color="#9b59b6" />
          <StatCard icon={<AlertTriangle size={20}/>} label="Deudas pendientes"  value={loading ? '…' : fmt(kpis?.deudas.totalDeuda)}       subtext={loading ? '' : `${kpis?.deudas.facturasConDeuda ?? 0} facturas con saldo`} color="#e74c3c" />
          <StatCard icon={<PackageOpen  size={20} />} label="Ingresos del mes"   value={loading ? '…' : kpis?.ingresos.totalIngresosMes ?? 0} subtext={loading ? '' : `${kpis?.ingresos.borradores ?? 0} en borrador`}        color="#e67e22" />
          <StatCard icon={<Package      size={20} />} label="Productos activos"  value={loading ? '…' : kpis?.productos.totalActivos   ?? 0} subtext={loading ? '' : `${kpis?.productos.sinStock ?? 0} sin stock`}            color="#1abc9c" />
        </div>
      </Section>

      {/* ── Cajas ── */}
      <Section titulo="Estado de Cajas">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <CajaCard
            label="Caja Chica" icon={<Wallet   size={18} />} colorOpen="#27ae60"
            caja={loading  ? null : kpis?.cajaChica}
            stats={loading ? null : kpis?.cajaChicaStats}
            route="/caja-chica" navigate={navigate}
          />
          <CajaCard
            label="Caja Banco" icon={<Landmark size={18} />} colorOpen="#3498db"
            caja={loading  ? null : kpis?.cajaBanco}
            stats={loading ? null : kpis?.cajaBancoStats}
            route="/caja-banco" navigate={navigate}
          />
        </div>
      </Section>

      {/* ── Accesos Rápidos ── */}
      <Section titulo="Accesos Rápidos">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 10 }}>
          {accesosRapidos.map(c => <NavCard key={c.route} label={c.label} icon={c.icon} color={c.color} route={c.route} navigate={navigate} />)}
        </div>
      </Section>

      {/* ── Últimas ventas ── */}
      <Section titulo="Últimas Ventas">
        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#6c757d', fontSize: 13 }}>
              <div className="spinner" style={{ margin: '0 auto 8px' }} />Cargando...
            </div>
          ) : (kpis?.ventasRecientes?.length ?? 0) === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#6c757d', fontSize: 13 }}>Sin ventas registradas aún.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  {['Factura','Cliente','Total','Estado','Fecha',''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#6c757d', borderBottom: '2px solid #dee2e6', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kpis.ventasRecientes.map(v => {
                  const badge = BADGE_ESTADO[v.estado_pago] ?? { bg: '#e9ecef', color: '#495057' };
                  return (
                    <tr key={v.id} style={{ borderBottom: '1px solid #f0f2f5', cursor: 'pointer' }}
                      onClick={() => navigate(`/facturas/${v.id}`)}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontFamily: 'monospace', background: '#f0f4ff', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{v.id_personalizado || `#${v.id}`}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{v.cliente_nombre}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#27ae60' }}>{fmt(v.total)}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ ...badge, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{v.estado_pago}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#6c757d', fontSize: 12 }}>{fmtFecha(v.created_at)}</td>
                      <td style={{ padding: '10px 14px' }}><ArrowRight size={14} color="#adb5bd" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div style={{ padding: '8px 14px', borderTop: '1px solid #f0f2f5', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => navigate('/facturas')}>
              Ver todas <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </Section>


    </div>
  );
}
