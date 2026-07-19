import { useState, useEffect, useCallback, useMemo } from 'react';
import { resumenEmpleados } from '../../api/empleadoMetricasApi';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/common/StatCard';
import TableCard from '../../components/common/TableCard';
import FilterCard, { FilterItem, filterInputStyle } from '../../components/common/FilterCard';
import EmpleadoDetalleModal from '../../components/empleados/EmpleadoDetalleModal';
import { ShoppingCart, DollarSign, Handshake, Wallet, Trophy, Medal, Award, Search, X, Eye } from 'lucide-react';

function fmt(v) {
  const n = parseFloat(v ?? 0);
  return isNaN(n) ? '$0.00' : '$' + n.toFixed(2);
}
function fmtN(v) { return parseInt(v ?? 0); }

function getMedallaIcon(pos) {
  if (pos === 1) return <Trophy size={18} color="#f1c40f" />;
  if (pos === 2) return <Medal size={18} color="#bdc3c7" />;
  return <Award size={18} color="#e67e22" />;
}

function getRolTexto(rol) {
  if (!rol) return '—';
  return rol === 'ADMINISTRADOR' ? 'Administrador' : 'Operador';
}

function generarPeriodos(n = 12) {
  const periodos = [];
  const ahora = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const mes  = d.getMonth() + 1;
    const anio = d.getFullYear();
    const label = d.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
    periodos.push({ mes, anio, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return periodos;
}

function RankingCard({ titulo, items }) {
  return (
    <div className="card" style={{ flex: 1 }}>
      <div className="card-header"><span className="card-title">{titulo}</span></div>
      <div style={{ padding: '8px 0' }}>
        {items.length === 0
          ? <div style={{ padding: '16px 20px', color: '#6c757d', fontSize: 13 }}>Sin datos en este período</div>
          : items.map(item => (
            <div key={item.posicion} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 20px', borderBottom: '1px solid #f0f2f5',
            }}>
              {getMedallaIcon(item.posicion)}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.empleadoNombre}</div>
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#2980b9', whiteSpace: 'nowrap' }}>{item.textoValor}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}

export default function EmpleadoEstadisticas() {
  const { isAdmin } = useAuth();

  const periodos = generarPeriodos(18);
  const [periodoSel, setPeriodoSel] = useState(`${periodos[0].mes}/${periodos[0].anio}`);

  const [empleados,      setEmpleados]      = useState([]);
  const [rankingVentas,  setRankingVentas]  = useState([]);
  const [rankingMontos,  setRankingMontos]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');

  const [filtroEstado,    setFiltroEstado]    = useState('todos');
  const [filtroRol,       setFiltroRol]       = useState('todos');
  const [filtroActividad, setFiltroActividad] = useState('todos');
  const [filtroMinVentas, setFiltroMinVentas] = useState('');
  const [ordenarPor,      setOrdenarPor]      = useState('ventas_desc');
  const [filtroBuscar,    setFiltroBuscar]    = useState('');

  const [empleadoDetalle, setEmpleadoDetalle] = useState(null);

  const [mesParsed, aniosParsed] = periodoSel.split('/').map(Number);

  const cargar = useCallback(async () => {
    setLoading(true); setError('');
    const [mes, anio] = periodoSel.split('/').map(Number);
    const res = await resumenEmpleados(mes, anio);
    if (res.ok) {
      const { empleados: emps, rankingVentas: rv, rankingMontos: rm } = res.data.resultado;
      setEmpleados(emps || []);
      setRankingVentas(rv || []);
      setRankingMontos(rm || []);
    } else {
      setError('No se pudieron cargar las métricas de empleados.');
    }
    setLoading(false);
  }, [periodoSel]);

  useEffect(() => { cargar(); }, [cargar]);

  const empleadosFiltrados = useMemo(() => {
    let lista = [...empleados];
    // Estado activo
    if (filtroEstado === 'activos')   lista = lista.filter(e => e.activo);
    if (filtroEstado === 'inactivos') lista = lista.filter(e => !e.activo);
    // Rol
    if (filtroRol !== 'todos') lista = lista.filter(e => e.rol === filtroRol);
    // Actividad en el período
    if (filtroActividad === 'con_ventas')  lista = lista.filter(e => fmtN(e.total_ventas) > 0);
    if (filtroActividad === 'sin_ventas')  lista = lista.filter(e => fmtN(e.total_ventas) === 0);
    if (filtroActividad === 'con_cobros')  lista = lista.filter(e => fmtN(e.cantidad_cobros) > 0);
    if (filtroActividad === 'activos_per') lista = lista.filter(e => fmtN(e.total_ventas) > 0 || fmtN(e.cantidad_cobros) > 0);
    // Mínimo de ventas
    const minV = parseInt(filtroMinVentas);
    if (!isNaN(minV) && minV > 0) lista = lista.filter(e => fmtN(e.total_ventas) >= minV);
    // Búsqueda por nombre/email
    if (filtroBuscar.trim()) {
      const q = filtroBuscar.toLowerCase();
      lista = lista.filter(e => e.nombre_completo?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q));
    }
    // Ordenar
    if      (ordenarPor === 'ventas_desc')  lista.sort((a,b) => fmtN(b.total_ventas) - fmtN(a.total_ventas));
    else if (ordenarPor === 'ventas_asc')   lista.sort((a,b) => fmtN(a.total_ventas) - fmtN(b.total_ventas));
    else if (ordenarPor === 'monto_desc')   lista.sort((a,b) => parseFloat(b.monto_total_vendido ?? 0) - parseFloat(a.monto_total_vendido ?? 0));
    else if (ordenarPor === 'cobros_desc')  lista.sort((a,b) => fmtN(b.cantidad_cobros) - fmtN(a.cantidad_cobros));
    else if (ordenarPor === 'nombre')       lista.sort((a,b) => (a.nombre_completo || '').localeCompare(b.nombre_completo || '', 'es'));
    return lista;
  }, [empleados, filtroEstado, filtroRol, filtroActividad, filtroMinVentas, filtroBuscar, ordenarPor]);

  const totalVentasPeriodo  = empleados.reduce((s, e) => s + fmtN(e.total_ventas), 0);
  const totalMontoPeriodo   = empleados.reduce((s, e) => s + parseFloat(e.monto_total_vendido ?? 0), 0);
  const totalCobrosPeriodo  = empleados.reduce((s, e) => s + fmtN(e.cantidad_cobros), 0);
  const totalMontoCobrosPeriodo = empleados.reduce((s, e) => s + parseFloat(e.monto_cobrado ?? 0), 0);

  if (!isAdmin) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Estadísticas de Empleados</h1>
        </div>
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#6c757d' }}>
          Solo los administradores pueden ver las estadísticas de empleados.
        </div>
      </div>
    );
  }

  return (
    <div className="page">

      <div className="page-header">
        <div>
          <h1 className="page-title">Estadísticas de Empleados</h1>
          <p className="page-subtitle">Rendimiento y métricas del personal por período</p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: 8, padding: '12px 16px', color: '#721c24', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 20 }}>
          <StatCard icon={<ShoppingCart size={20} />} label="Ventas en el período" value={totalVentasPeriodo} color="#3498db" />
          <StatCard icon={<DollarSign size={20} />} label="Monto vendido" value={fmt(totalMontoPeriodo)} color="#2980b9" />
          <StatCard icon={<Handshake size={20} />} label="Cobros de deuda" value={totalCobrosPeriodo} color="#e67e22" />
          <StatCard icon={<Wallet size={20} />} label="Monto cobrado" value={fmt(totalMontoCobrosPeriodo)} color="#e74c3c" />
        </div>
      )}

      {!loading && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <RankingCard titulo="Top 3 por N.º de Ventas" items={rankingVentas} />
          <RankingCard titulo="Top 3 por Monto Vendido" items={rankingMontos} />
        </div>
      )}

      <FilterCard
        titulo="Filtros de análisis"
        onLimpiar={() => {
          setFiltroEstado('todos'); setFiltroRol('todos');
          setFiltroActividad('todos'); setFiltroMinVentas('');
          setOrdenarPor('ventas_desc'); setFiltroBuscar('');
        }}
        resultado={empleadosFiltrados.length !== empleados.length
          ? `${empleadosFiltrados.length} de ${empleados.length} empleados`
          : `${empleados.length} empleados`}
      >

        {/* Buscar */}
        <FilterItem label="Buscar empleado" span={2}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }} />
            <input
              style={{ ...filterInputStyle, paddingLeft: 30 }}
              placeholder="Nombre o email..."
              value={filtroBuscar}
              onChange={e => setFiltroBuscar(e.target.value)}
            />
            {filtroBuscar && (
              <button onClick={() => setFiltroBuscar('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6c757d', padding: 0, display: 'flex' }}>
                <X size={14} />
              </button>
            )}
          </div>
        </FilterItem>

        {/* Período */}
        <FilterItem label="Período" span={1}>
          <select value={periodoSel} onChange={e => setPeriodoSel(e.target.value)} style={filterInputStyle}>
            {periodos.map(p => (
              <option key={`${p.mes}/${p.anio}`} value={`${p.mes}/${p.anio}`}>{p.label}</option>
            ))}
          </select>
        </FilterItem>

        {/* Estado */}
        <FilterItem label="Estado">
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={filterInputStyle}>
            <option value="todos">Todos</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
        </FilterItem>

        {/* Rol */}
        <FilterItem label="Rol">
          <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)} style={filterInputStyle}>
            <option value="todos">Todos los roles</option>
            <option value="ADMINISTRADOR">Administrador</option>
            <option value="OPERADOR">Operador</option>
          </select>
        </FilterItem>

        {/* Actividad en el período */}
        <FilterItem label="Actividad en el período">
          <select value={filtroActividad} onChange={e => setFiltroActividad(e.target.value)} style={filterInputStyle}>
            <option value="todos">Todos</option>
            <option value="activos_per">Con actividad (ventas o cobros)</option>
            <option value="con_ventas">Con ventas</option>
            <option value="sin_ventas">Sin ventas</option>
            <option value="con_cobros">Con cobros</option>
          </select>
        </FilterItem>

        {/* Mínimo de ventas */}
        <FilterItem label="Mín. ventas en el período">
          <input
            type="number"
            min="0"
            placeholder="Ej: 5"
            value={filtroMinVentas}
            onChange={e => setFiltroMinVentas(e.target.value)}
            style={filterInputStyle}
          />
        </FilterItem>

        {/* Ordenar */}
        <FilterItem label="Ordenar por">
          <select value={ordenarPor} onChange={e => setOrdenarPor(e.target.value)} style={filterInputStyle}>
            <option value="ventas_desc">Mayor N.º ventas</option>
            <option value="ventas_asc">Menor N.º ventas</option>
            <option value="monto_desc">Mayor monto vendido</option>
            <option value="cobros_desc">Mayor monto cobros</option>
            <option value="nombre">Nombre A → Z</option>
          </select>
        </FilterItem>
      </FilterCard>

      <TableCard
        loading={loading}
        empty={empleadosFiltrados.length === 0}
        emptyText="No hay empleados con los filtros seleccionados."
        loadingText="Calculando métricas..."
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                {['Empleado','Rol','Estado','Ventas','Monto Vendido','Abonado','Cobros','Monto Cobrado','Acciones'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#6c757d', borderBottom: '2px solid #dee2e6', whiteSpace: 'nowrap', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {empleadosFiltrados.map(e => (
                <tr key={e.id}
                  style={{ borderBottom: '1px solid #f0f2f5', cursor: 'pointer' }}
                  onMouseEnter={ev => ev.currentTarget.style.background = '#f8f9fa'}
                  onMouseLeave={ev => ev.currentTarget.style.background = ''}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: '#3498db', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, flexShrink: 0,
                      }}>
                        {(e.nombre_completo || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{e.nombre_completo}</div>
                        <div style={{ fontSize: 11, color: '#6c757d' }}>{e.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#6c757d' }}>{getRolTexto(e.rol)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: e.activo ? '#d4edda' : '#f8d7da',
                      color: e.activo ? '#155724' : '#721c24',
                    }}>
                      {e.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: fmtN(e.total_ventas) > 0 ? '#2980b9' : '#adb5bd' }}>
                    {fmtN(e.total_ventas)}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#212529' }}>{fmt(e.monto_total_vendido)}</td>
                  <td style={{ padding: '10px 14px', color: '#212529' }}>{fmt(e.monto_abonado)}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: fmtN(e.cantidad_cobros) > 0 ? '#e67e22' : '#adb5bd' }}>
                    {fmtN(e.cantidad_cobros)}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#212529' }}>{fmt(e.monto_cobrado)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setEmpleadoDetalle(e)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Eye size={14} /> Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCard>

      {empleadoDetalle && (
        <EmpleadoDetalleModal
          empleado={empleadoDetalle}
          mes={mesParsed}
          anio={aniosParsed}
          onCerrar={() => setEmpleadoDetalle(null)}
        />
      )}
    </div>
  );
}
