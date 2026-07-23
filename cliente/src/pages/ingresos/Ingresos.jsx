import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { generarReporte } from '../../api/reportesApi';
import { useAuth } from '../../context/AuthContext';
import { FilePen, File, FileSpreadsheet } from 'lucide-react';
import FilterCard, { FilterItem, filterInputStyle } from '../../components/common/FilterCard';
import StatCard from '../../components/common/StatCard';
import TableCard from '../../components/common/TableCard';
import { exportarIngresosExcel } from '../../utils/exportarExcel';

const PAGE_SIZE = 10;
const FMT = v => `$${parseFloat(v || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;
const FMT_FECHA = s => s ? new Date(s + 'T00:00:00').toLocaleDateString('es-EC') : '—';

export default function Ingresos() {
  const navigate  = useNavigate();
  const { isAdmin } = useAuth();

  const [lista, setLista]         = useState([]);
  const [page, setPage]           = useState(0);
  const [loading, setLoading]     = useState(true);
  const [buscar, setBuscar]       = useState('');
  const [estado, setEstado]       = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const [proveedores, setProveedores] = useState([]);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef(null);

  // Cerrar menú al clic fuera
  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAbierto(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    let activo = true;
    api.get('/proveedores?limit=100&offset=0').then(response => {
      if (activo && response.ok) setProveedores(response.data.resultado || []);
    });
    return () => { activo = false; };
  }, []);

  // Stats derivados
  const totalFacturas   = lista.length;
  const totalBorradores = lista.filter(i => i.estado === 'BORRADOR').length;
  const totalPagado     = lista
    .filter(i => i.estado === 'FINALIZADO')
    .reduce((sum, i) => sum + parseFloat(i.total || 0), 0);
  const totalItems      = lista.reduce((sum, i) => sum + parseInt(i.total_items || 0), 0);
  const pagina = lista.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasNext = (page + 1) * PAGE_SIZE < lista.length;

  const cargar = useCallback(async () => {
    setLoading(true);
    const response = await generarReporte({
      endpoint: 'ingresos/mercaderia',
      filtros: { buscar, estado, fechaDesde, fechaHasta, proveedorId },
      paginacion: { page: 1, pageSize: 5000 },
    }).catch(() => null);
    setLista(response?.report?.rows || []);
    setLoading(false);
  }, [buscar, estado, fechaDesde, fechaHasta, proveedorId]);

  useEffect(() => {
    const timeout = setTimeout(() => setPage(0), 0);
    return () => clearTimeout(timeout);
  }, [buscar, estado, fechaDesde, fechaHasta, proveedorId]);
  useEffect(() => {
    const t = setTimeout(cargar, 300);
    return () => clearTimeout(t);
  }, [cargar]);

  async function eliminar(id) {
    if (!confirm('¿Eliminar este ingreso (solo disponible en BORRADOR)?')) return;
    const res = await api.delete('/ingreso/eliminar', { id });
    if (res.ok) cargar();
  }

  function chipEstado(e) {
    if (e === 'FINALIZADO') return { bg: '#d4edda', color: '#155724', label: 'Finalizado' };
    return { bg: '#fff3cd', color: '#856404', label: 'Borrador' };
  }

  return (
    <div className="page">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Ingresos</h1>
          <p className="page-subtitle">Registro de compras y entradas de inventario</p>
        </div>
        {isAdmin && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button className="btn btn-primary" onClick={() => setMenuAbierto(v => !v)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nuevo ingreso
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 4 }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {menuAbierto && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100,
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 220, overflow: 'hidden',
              }}>
                <button
                  onClick={() => { setMenuAbierto(false); navigate('/ingresos/nuevo'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left', fontSize: 14, color: '#1e293b', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontSize: 20 }}><FilePen /></span>
                  <div>
                    <div style={{ fontWeight: 600 }}>Ingreso manual</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Ingresar productos uno a uno</div>
                  </div>
                </button>
                <div style={{ height: 1, background: '#f1f5f9', margin: '0 12px' }} />
                <button
                  onClick={() => { setMenuAbierto(false); navigate('/ingresos/importar'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left', fontSize: 14, color: '#1e293b', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontSize: 20 }}><File /></span>
                  <div>
                    <div style={{ fontWeight: 600 }}>Importar desde Excel</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Carga masiva desde plantilla</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <StatCard
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
          label="Total facturas" value={totalFacturas} color="#3498db" />
        <StatCard
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          label="Total pagado" value={FMT(totalPagado)} color="#27ae60" />
        <StatCard
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>}
          label="Unidades ingresadas" value={totalItems.toLocaleString()} color="#9b59b6" />
        <StatCard
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          label="Pendientes (borrador)" value={totalBorradores} color="#f39c12" />
      </div>

      <FilterCard
        resultado={`${lista.length} ingreso${lista.length === 1 ? '' : 's'}`}
        onLimpiar={() => { setBuscar(''); setEstado(''); setFechaDesde(''); setFechaHasta(''); setProveedorId(''); }}
      >
        <FilterItem label="Buscar" span={2}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input style={{ ...filterInputStyle, paddingLeft: 30 }} placeholder="Factura, proveedor, ID..."
              value={buscar} onChange={e => setBuscar(e.target.value)} />
          </div>
        </FilterItem>
        <FilterItem label="Estado">
          <select value={estado} onChange={e => setEstado(e.target.value)} style={filterInputStyle}>
            <option value="">Todos</option>
            <option value="BORRADOR">Borrador</option>
            <option value="FINALIZADO">Finalizado</option>
          </select>
        </FilterItem>
        <FilterItem label="Proveedor">
          <select value={proveedorId} onChange={e => setProveedorId(e.target.value)} style={filterInputStyle}>
            <option value="">Todos</option>
            {proveedores.map(proveedor => <option key={proveedor.id} value={proveedor.id}>{proveedor.nombre}</option>)}
          </select>
        </FilterItem>
        <FilterItem label="Desde">
          <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} style={filterInputStyle} />
        </FilterItem>
        <FilterItem label="Hasta">
          <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} style={filterInputStyle} />
        </FilterItem>
        <FilterItem label="Exportar">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => exportarIngresosExcel(lista, { fechaDesde, fechaHasta })}
            disabled={lista.length === 0}
            style={{ justifyContent: 'center' }}
          >
            <FileSpreadsheet size={15} /> Excel
          </button>
        </FilterItem>
      </FilterCard>

      <TableCard scrollY
        loading={loading}
        empty={lista.length === 0}
        emptyText="Sin ingresos registrados"
        emptyColSpan={isAdmin ? 9 : 8}
        page={page}
        hasNext={hasNext}
        onPrevPage={() => setPage(p => p - 1)}
        onNextPage={() => setPage(p => p + 1)}
        hidePagination={lista.length <= PAGE_SIZE}
      >
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Proveedor</th><th>N° Factura</th>
              <th>Fecha</th><th>Tipo</th><th>Productos</th>
              <th>Total</th><th>Estado</th>
              {isAdmin && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {pagina.map(ing => {
                const chip = chipEstado(ing.estado);
                return (
                  <tr key={ing.id}>
                    <td>
                      <code style={{ background: '#f0f4ff', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
                        {ing.id_personalizado || `#${ing.id}`}
                      </code>
                    </td>
                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ing.proveedor_nombre || <span style={{ color: 'var(--text-muted)' }}>Sin proveedor</span>}
                    </td>
                    <td>{ing.numero_factura}</td>
                    <td>{FMT_FECHA(ing.fecha)}</td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                        background: ing.tipo_compra === 'CONTADO' ? '#e8f5e9' : '#fce4ec',
                        color: ing.tipo_compra === 'CONTADO' ? '#2e7d32' : '#880e4f',
                      }}>
                        {ing.tipo_compra}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {ing.cantidad_detalles ?? 0} líneas
                    </td>
                    <td><strong>{FMT(ing.total)}</strong></td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px',
                        borderRadius: 99, background: chip.bg, color: chip.color,
                      }}>
                        {chip.label}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon" title="Ver detalle" onClick={() => navigate(`/ingresos/${ing.id}`)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        {ing.estado === 'BORRADOR' && (
                          <button className="btn-icon" title="Continuar ingreso" onClick={() => navigate(`/ingresos/${ing.id}/productos`)}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                              <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
                            </svg>
                          </button>
                        )}
                        {ing.estado === 'BORRADOR' && (
                          <button className="btn-icon danger" title="Eliminar" onClick={() => eliminar(ing.id)}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}
