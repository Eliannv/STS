// cliente/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSucursal } from '../context/SucursalContext';
import { cargarDashboardResumen } from '../api/dashboardApi';
import StatCard from '../components/common/StatCard';
import VentasMesChart from '../components/common/VentasMesChart';
import {
  ShoppingCart, DollarSign, Users, PackageOpen, Handshake,
  AlertTriangle, Package, BarChart2, 
  PlusCircle, FileText, Wallet, Landmark, Truck, Notebook,
  ArrowRight, User, House, TrendingUp, TrendingDown, Activity, Filter,
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

// El backend entrega el desglose en tres listas independientes (ventas, cajas e
// inventario). Se fusionan por sucursal para presentarlas en una sola tabla.
function filasDesglose(desglose) {
  const filas = new Map();
  const fila = (id) => {
    const clave = id ?? 'sin';
    if (!filas.has(clave)) {
      filas.set(clave, { sucursalId: id ?? null, sucursal: null, ventas: 0, total: 0, caja: null, unidades: 0, valor: 0 });
    }
    return filas.get(clave);
  };

  (desglose.ventas || []).forEach(v => {
    const f = fila(v.sucursalId);
    f.sucursal = v.sucursal || f.sucursal;
    f.ventas = v.ventas;
    f.total = v.total;
  });
  (desglose.cajasChicas || []).forEach(c => {
    const f = fila(c.sucursalId);
    f.sucursal = c.sucursal || f.sucursal;
    f.caja = c.montoActual;
  });
  (desglose.inventario || []).forEach(i => {
    const f = fila(i.sucursal_id ?? i.sucursalId);
    f.unidades = Number(i.unidades || 0);
    f.valor = Number(i.valor || 0);
  });

  return [...filas.values()].sort((a, b) => (a.sucursalId ?? 0) - (b.sucursalId ?? 0));
}
const BADGE_ESTADO = {
  PAGADA:    { bg: '#d4edda', color: '#155724' },
  PENDIENTE: { bg: '#fff3cd', color: '#856404' },
  PARCIAL:   { bg: '#cce5ff', color: '#004085' },
  ANULADA:   { bg: '#f8d7da', color: '#721c24' },
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

function CajaCard({ label, caja, stats, icon, colorOpen, route, navigate, selectNode }) {
  const abierta = !!caja;
  const ingresos = stats?.totalIngresos  ?? 0;
  const egresos  = stats?.totalEgresos   ?? 0;
  const neto     = stats?.flujoNeto ?? 0;
  const movs     = stats?.totalMovimientos ?? 0;

  return (
    <div
      onClick={(e) => { if (caja && !selectNode) navigate(route + '/' + caja.id); }}
      className="card"
      style={{
        padding: '16px 20px', cursor: (caja && !selectNode) ? 'pointer' : 'default',
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
        {selectNode ? (
          <div onClick={e => e.stopPropagation()} style={{ minWidth: 180 }}>
            {selectNode}
          </div>
        ) : (
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: abierta ? colorOpen + '1a' : '#e9ecef', color: abierta ? colorOpen : '#6c757d', whiteSpace: 'nowrap' }}>
            {abierta ? 'ABIERTA' : 'CERRADA'}
          </span>
        )}
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
  const { sucursales, sucursalActiva, setSucursalActiva, nombreSucursal, nombreSucursalOperativa, viendoTodas } = useSucursal();
  const navigate = useNavigate();
  const [kpis,    setKpis]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [cajaChicaOverride, setCajaChicaOverride] = useState(null);
  const [cajaChicaLoading, setCajaChicaLoading] = useState(false);
  const [sucursalCajaChicaLocal, setSucursalCajaChicaLocal] = useState('');

  useEffect(() => {
    cargarDashboardResumen().then(r => {
      if (r.ok) setKpis(r.data.resultado);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!viendoTodas || !sucursalCajaChicaLocal) {
      setCajaChicaOverride(null);
      return;
    }
    let activo = true;
    setCajaChicaLoading(true);
    cargarDashboardResumen(sucursalCajaChicaLocal).then(r => {
      if (!activo) return;
      if (r.ok) setCajaChicaOverride({
        cajaChica: r.data.resultado.cajaChica,
        cajaChicaStats: r.data.resultado.cajaChicaStats,
      });
      setCajaChicaLoading(false);
    });
    return () => { activo = false; };
  }, [sucursalCajaChicaLocal, viendoTodas]);

  useEffect(() => {
    if (viendoTodas && sucursales.length > 0 && !sucursalCajaChicaLocal) {
      setSucursalCajaChicaLocal(String(sucursales[0].id));
    }
  }, [viendoTodas, sucursales]);

  const mesActual = new Date().toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });

  const accesosRapidos = [
    { label: 'Nueva Venta',   color: '#3498db', route: '/facturas/nueva',  icon: <PlusCircle  size={16} /> },
    { label: 'Cuentas por Cobrar', color: '#e74c3c', route: '/cuentas-cobrar', icon: <Handshake size={16} /> },
    { label: 'Ver Facturas',  color: '#27ae60', route: '/facturas',        icon: <FileText    size={16} /> },
    { label: 'Clientes',          color: '#3498db', route: '/clientes',    icon: <Users    size={16} /> },
    
    { label: 'Productos',         color: '#9b59b6', route: '/productos',   icon: <Package  size={16} /> },
    { label: 'Proveedores',       color: '#e67e22', route: '/proveedores', icon: <Truck    size={16} /> },
    
    ...(isAdmin ? [{ label: 'Empleados', color: '#2c3e50', route: '/empleados', icon: <BarChart2 size={16} /> }] : []),
    { label: 'Usuarios',          color: '#1abc9c', route: '/usuarios',    icon: <User     size={16} /> },

    { label: 'Ingresos',     color: '#f39c12', route: '/ingresos',    icon: <PackageOpen size={16} /> },
    { label: 'Sucursales',   color: '#8e44ad', route: '/sucursales',  icon: <House       size={16} /> },
    
  ];

  const cajaChicaAbierta = !loading && !!(cajaChicaOverride?.cajaChica ?? kpis?.cajaChica);
  
  // Selector local para Caja Chica — SOLO se muestra en vista consolidada (viendoTodas)
  // NO cambia el selector global (no recarga la página)
  
  const selectorSucursalCaja = viendoTodas && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'stretch' }}>
      <label style={{ fontSize: 9, color: '#6c757d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        Sucursal (Caja Chica)
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={sucursalCajaChicaLocal || ''}
          onChange={(e) => setSucursalCajaChicaLocal(e.target.value)}
          style={{
            width: '100%',
            padding: '7px 28px 7px 10px',
            borderRadius: 8,
            border: '1px solid #dee2e6',
            background: '#fff',
            fontSize: 12,
            fontWeight: 600,
            color: '#2c3e50',
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
          }}
        >
          {sucursales.map(s => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
        <Filter size={14} style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', color: '#6c757d',
        }} />
      </div>
      <span style={{
        alignSelf: 'flex-end',
        marginTop: 4,
        padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 700,
        background: (cajaChicaAbierta ? '#27ae60' : '#e9ecef') + '1a',
        color: cajaChicaAbierta ? '#27ae60' : '#6c757d',
        whiteSpace: 'nowrap',
      }}>
        {loading ? '' : (cajaChicaAbierta ? 'ABIERTA' : 'CERRADA')}
      </span>
    </div>
  );

  const filasSucursal = (kpis?.desglose) ? filasDesglose(kpis.desglose) : [];

  return (
    <div className="page">

      {/* ── Header ── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Bienvenido, {usuario?.nombre}!</h1>
          <p className="page-subtitle">
            Sales Technology System · {viendoTodas ? 'Todas las sucursales' : nombreSucursalOperativa} ·{' '}
            <span style={{ textTransform: 'capitalize' }}>{mesActual}</span>
          </p>
        </div>
      </div>

      {/* ── KPIs del mes (8 tarjetas en una sola fila) ── */}
      <Section titulo={`Resumen de ${mesActual}`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <StatCard icon={<ShoppingCart size={20} />} label="Ventas del mes"     value={loading ? '…' : kpis?.ventas?.totalVentasMes  ?? 0} subtext={loading ? '' : `${kpis?.ventas?.totalVentas ?? 0} acumuladas · ${kpis?.ventas?.ventasPendientes ?? 0} pendientes`} color="#3498db" />
          <StatCard icon={<DollarSign   size={20} />} label="Monto vendido"      value={loading ? '…' : fmt(kpis?.ventas?.montoTotalMes)}   subtext={loading ? '' : `${kpis?.ventas?.totalVentas ?? 0} ventas registradas`} color="#27ae60" />
          <StatCard icon={<Handshake    size={20} />} label="Total cobrado"      value={loading ? '…' : fmt(kpis?.ventas?.montoAbonadoMes)} subtext={loading ? '' : `Acumulado: ${fmt(kpis?.ventas?.montoCobrado)}`} color="#16a085" />
          <StatCard icon={<Users        size={20} />} label="Clientes activos"   value={loading ? '…' : kpis?.clientes?.totalActivos   ?? 0} subtext={loading ? '' : `${kpis?.clientes?.totalClientes ?? 0} registrados · +${kpis?.clientes?.nuevosMes ?? 0} este mes`} color="#9b59b6" />
          <StatCard icon={<AlertTriangle size={20}/>} label="Deudas pendientes"  value={loading ? '…' : fmt(kpis?.deudas?.totalDeuda)}       subtext={loading ? '' : `${kpis?.deudas?.facturasConDeuda ?? 0} facturas con saldo`} color="#e74c3c" />
          <StatCard icon={<PackageOpen  size={20} />} label="Ingresos del mes"   value={loading ? '…' : kpis?.ingresos?.totalIngresosMes ?? 0} subtext={loading ? '' : `${kpis?.ingresos?.pendientes ?? 0} pendientes · ${fmt(kpis?.ingresos?.montoIngresosMes)}`} color="#e67e22" />
          <StatCard icon={<Package      size={20} />} label="Productos activos"  value={loading ? '…' : kpis?.productos?.totalActivos   ?? 0} subtext={loading ? '' : `${kpis?.productos?.unidadesStock ?? 0} unidades · ${kpis?.productos?.sinStock ?? 0} sin stock`} color="#1abc9c" />
          <StatCard icon={<BarChart2    size={20} />} label="Valor del inventario" value={loading ? '…' : fmt(kpis?.productos?.valorInventario)} subtext={loading ? '' : `${kpis?.productos?.conStock ?? 0} productos con stock`} color="#8e44ad" />
        </div>
      </Section>

      {/* ── Estado de Cajas (dos tarjetas grandes) ── */}
      <Section titulo="Estado de Cajas">
        <div className="dashboard-grid-2cajas">
          <CajaCard
            label="Caja Chica" icon={<Wallet size={18} />} colorOpen="#27ae60"
            caja={loading ? null : (cajaChicaOverride?.cajaChica ?? kpis?.cajaChica)}
            stats={loading ? null : (cajaChicaOverride?.cajaChicaStats ?? kpis?.cajaChicaStats)}
            route="/caja-chica" navigate={navigate}
            selectNode={selectorSucursalCaja}
          />
          <CajaCard
            label="Caja Banco" icon={<Landmark size={18} />} colorOpen="#3498db"
            caja={loading ? null : kpis?.cajaBanco}
            stats={loading ? null : kpis?.cajaBancoStats}
            route="/caja-banco" navigate={navigate}
          />
        </div>
      </Section>

      {/* ── Gráfico + Accesos (65/35, responsive) ── */}
      <Section titulo="Ventas del mes">
        <div className="dashboard-grid-65-35">
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: '#6c757d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Ventas diarias
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#3498db' }}>
                  {loading ? '…' : fmt(kpis?.ventas?.montoTotalMes)}
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#6c757d', textAlign: 'right' }}>
                {viendoTodas ? 'Todas las sucursales' : nombreSucursalOperativa}
              </div>
            </div>
            <VentasMesChart
              data={loading ? [] : (kpis?.ventasPorDia || [])}
              loading={loading}
              altura={260}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 }}>
              Accesos Rápidos
            </div>
            <div className="dashboard-accesos-grid">
              {accesosRapidos.map(c => <NavCard key={c.route} label={c.label} icon={c.icon} color={c.color} route={c.route} navigate={navigate} />)}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Tablas inferiores (65/35, responsive) ── */}
      <Section titulo="Detalle">
        <div className={viendoTodas ? 'dashboard-grid-65-35' : 'dashboard-grid-full'}>
          {/* Últimas Ventas */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #f0f2f5', fontWeight: 700, fontSize: 13, color: '#2c3e50' }}>
              Últimas Ventas
            </div>
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
                    {['Factura','Cliente','Total','Estado','Tipo','Método','Fecha',''].map(h => (
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
                        <td style={{ padding: '10px 14px', fontSize: 12 }}>{v.tipo_venta || '—'}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12 }}>{v.metodo_pago || '—'}</td>
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

          {/* Detalle por sucursal — solo en consolidado */}
          {viendoTodas && (
            <div className="card" style={{ overflow: 'hidden', alignSelf: 'start' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid #f0f2f5', fontWeight: 700, fontSize: 13, color: '#2c3e50' }}>
                Detalle por sucursal
              </div>
              {loading ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#6c757d', fontSize: 13 }}>
                  <div className="spinner" style={{ margin: '0 auto 8px' }} />Cargando...
                </div>
              ) : filasSucursal.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#6c757d', fontSize: 13 }}>Sin datos por sucursal.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead style={{ background: '#f8f9fa' }}>
                      <tr>
                        {['Sucursal','Ventas','Monto','Unidades','Inv.'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Sucursal' ? 'left' : 'right', fontWeight: 700, color: '#6c757d', borderBottom: '2px solid #dee2e6', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filasSucursal.map(fila => (
                        <tr key={fila.sucursalId ?? 'sin'} style={{ borderBottom: '1px solid #f0f2f5' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>{fila.sucursal || nombreSucursal(fila.sucursalId)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>{fila.ventas}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#27ae60' }}>{fmt(fila.total)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>{fila.unidades}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#8e44ad' }}>{fmt(fila.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, padding: '0 14px 8px' }}>
                Caja Banco no aparece: es central.
              </p>
            </div>
          )}
        </div>
      </Section>

    </div>
  );
}
