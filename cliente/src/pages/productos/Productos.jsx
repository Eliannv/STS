import { useCallback, useEffect, useMemo, useState } from 'react';
import { Boxes, CircleDollarSign, Package, PackageX, TrendingUp, TriangleAlert } from 'lucide-react';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import ProductoFormModal from '../../components/productos/ProductoFormModal';
import InfoTooltip from '../../components/common/InfoTooltip';
import FilterCard, { FilterItem, filterInputStyle } from '../../components/common/FilterCard';
import StatCard from '../../components/common/StatCard';
import TableCard from '../../components/common/TableCard';
import { exportarProductosExcel } from '../../utils/exportarExcel';

const STOCK_MINIMO = 5;
const PAGE_SIZE = 20;
const currencyFormatter = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });
const numberFormatter = new Intl.NumberFormat('es-EC');

const quickFilters = [
  { value: 'todos', label: 'Todos' },
  { value: 'con-stock', label: 'Con stock' },
  { value: 'stock-minimo', label: 'Stock mínimo' },
  { value: 'sin-stock', label: 'Sin stock' },
  { value: 'activos', label: 'Activos' },
  { value: 'inactivos', label: 'Inactivos' },
];

const numberValue = value => Number(value || 0);
const searchable = value => String(value || '').toLocaleLowerCase('es');

export default function Productos() {
  const { isAdmin } = useAuth();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buscarProd, setBuscarProd] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [filtroRapido, setFiltroRapido] = useState('todos');
  const [orden, setOrden] = useState('codigo');
  const [mostrarValorizacion, setMostrarValorizacion] = useState(false);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [productoSel, setProductoSel] = useState(null);
  const [page, setPage] = useState(0);

  const cargar = useCallback(async () => {
    setLoading(true);
    const respuesta = await api.get('/producto/lista?limit=5000&offset=0&estado=todos');
    setLista(respuesta.ok ? (respuesta.data.resultado || []) : []);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { setPage(0); }, [buscarProd, filtroGrupo, filtroProveedor, filtroRapido, orden]);

  const grupos = useMemo(() => [...new Set(lista.map(producto => producto.grupo).filter(Boolean))].sort(), [lista]);
  const proveedores = useMemo(() => [...new Set(lista.map(producto => producto.proveedor_nombre).filter(Boolean))].sort(), [lista]);

  const metricas = useMemo(() => {
    const controlados = lista.filter(producto => producto.tipo_control_stock !== 'ILIMITADO');
    const valorCosto = controlados.reduce((total, producto) => total + numberValue(producto.stock) * numberValue(producto.costo), 0);
    const valorVenta = controlados.reduce((total, producto) => total + numberValue(producto.stock) * numberValue(producto.pvp1), 0);
    return {
      totalProductos: lista.length,
      stockTotal: controlados.reduce((total, producto) => total + numberValue(producto.stock), 0),
      stockMinimo: controlados.filter(producto => numberValue(producto.stock) > 0 && numberValue(producto.stock) <= STOCK_MINIMO).length,
      sinStock: controlados.filter(producto => numberValue(producto.stock) <= 0).length,
      valorCosto,
      valorVenta,
      margenPotencial: valorVenta - valorCosto,
    };
  }, [lista]);

  const filtrados = useMemo(() => {
    const busqueda = searchable(buscarProd.trim());
    const resultado = lista.filter(producto => {
      const stock = numberValue(producto.stock);
      if (busqueda && ![producto.codigo, producto.nombre, producto.modelo, producto.color, producto.grupo, producto.proveedor_nombre].some(valor => searchable(valor).includes(busqueda))) return false;
      if (filtroGrupo && producto.grupo !== filtroGrupo) return false;
      if (filtroProveedor && producto.proveedor_nombre !== filtroProveedor) return false;
      if (filtroRapido === 'con-stock' && stock <= 0) return false;
      if (filtroRapido === 'stock-minimo' && (stock <= 0 || stock > STOCK_MINIMO || producto.tipo_control_stock === 'ILIMITADO')) return false;
      if (filtroRapido === 'sin-stock' && (stock > 0 || producto.tipo_control_stock === 'ILIMITADO')) return false;
      if (filtroRapido === 'activos' && !producto.activo) return false;
      if (filtroRapido === 'inactivos' && producto.activo) return false;
      return true;
    });

    return [...resultado].sort((a, b) => orden === 'recientes'
      ? new Date(b.created_at || 0) - new Date(a.created_at || 0)
      : String(a.codigo || '').localeCompare(String(b.codigo || ''), 'es', { numeric: true }));
  }, [lista, buscarProd, filtroGrupo, filtroProveedor, filtroRapido, orden]);

  const pagina = useMemo(() => filtrados.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtrados, page]);
  const hasNext = (page + 1) * PAGE_SIZE < filtrados.length;

  function limpiarFiltros() {
    setBuscarProd('');
    setFiltroGrupo('');
    setFiltroProveedor('');
    setFiltroRapido('todos');
  }

  function abrirEditar(producto) {
    setProductoSel(producto);
    setEditando(producto.id);
    setModal(true);
  }

  function cerrar() {
    setModal(false);
    setEditando(null);
    setProductoSel(null);
  }

  const stats = [
    { label: 'Total de productos', value: numberFormatter.format(metricas.totalProductos), color: '#3498db', icon: Package },
    { label: 'Stock total', value: numberFormatter.format(metricas.stockTotal), color: '#1abc9c', icon: Boxes },
    { label: 'Stock mínimo', value: numberFormatter.format(metricas.stockMinimo), color: '#f39c12', icon: TriangleAlert, subtext: `Umbral: ${STOCK_MINIMO} unidades` },
    { label: 'Sin stock', value: numberFormatter.format(metricas.sinStock), color: '#e74c3c', icon: PackageX },
  ];

  const valueStats = [
    { label: 'Valor total a costo', value: currencyFormatter.format(metricas.valorCosto), color: '#e67e22', icon: CircleDollarSign },
    { label: 'Valor total a precio de venta', value: currencyFormatter.format(metricas.valorVenta), color: '#27ae60', icon: TrendingUp },
    { label: 'Margen potencial', value: currencyFormatter.format(metricas.margenPotencial), color: '#8e44ad', icon: TrendingUp },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Productos
            <InfoTooltip title="Agregar Productos">Para agregar nuevos productos al catálogo, crea un nuevo ingreso y agrega los productos desde allí.</InfoTooltip>
          </h1>
          <p className="page-subtitle">Centro de consulta y valorización del inventario</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, margin: '20px 0 12px' }}>
        {stats.map(({ icon: Icon, ...stat }) => <StatCard key={stat.label} {...stat} icon={<Icon size={20} />} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 20 }}>
        {valueStats.map(({ icon: Icon, ...stat }) => <StatCard key={stat.label} {...stat} icon={<Icon size={20} />} />)}
      </div>

      <FilterCard
        titulo="Opciones de filtrado y exportación"
        extra={<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{quickFilters.map(filtro => <button key={filtro.value} type="button" className={`btn btn-sm ${filtroRapido === filtro.value ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFiltroRapido(filtro.value)}>{filtro.label}</button>)}</div>}
        onLimpiar={limpiarFiltros}
        resultado={`${filtrados.length} producto${filtrados.length === 1 ? '' : 's'}`}
      >
        <FilterItem label="Buscar" span={2}>
          <input style={filterInputStyle} placeholder="Nombre, código, modelo, color o grupo" value={buscarProd} onChange={event => setBuscarProd(event.target.value)} />
        </FilterItem>
        <FilterItem label="Grupo">
          <select value={filtroGrupo} onChange={event => setFiltroGrupo(event.target.value)} style={filterInputStyle}>
            <option value="">Todos</option>
            {grupos.map(grupo => <option key={grupo} value={grupo}>{grupo}</option>)}
          </select>
        </FilterItem>
        <FilterItem label="Proveedor">
          <select value={filtroProveedor} onChange={event => setFiltroProveedor(event.target.value)} style={filterInputStyle}>
            <option value="">Todos</option>
            {proveedores.map(proveedor => <option key={proveedor} value={proveedor}>{proveedor}</option>)}
          </select>
        </FilterItem>
        <FilterItem label="Ordenar">
          <select value={orden} onChange={event => setOrden(event.target.value)} style={filterInputStyle}>
            <option value="codigo">Por código</option>
            <option value="recientes">Recientes primero</option>
          </select>
        </FilterItem>
        <FilterItem label="Columnas opcionales">
          <label style={{ ...filterInputStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={mostrarValorizacion} onChange={event => setMostrarValorizacion(event.target.checked)} /> Valorización
          </label>
        </FilterItem>
        <FilterItem label="Exportar">
          <button type="button" onClick={() => exportarProductosExcel(filtrados)} style={{ ...filterInputStyle, cursor: 'pointer' }}>Excel</button>
        </FilterItem>
      </FilterCard>

      <TableCard
        scrollY
        loading={loading}
        empty={filtrados.length === 0}
        emptyText="Sin resultados"
        page={page}
        hasNext={hasNext}
        onPrevPage={() => setPage(current => current - 1)}
        onNextPage={() => setPage(current => current + 1)}
        hidePagination={filtrados.length <= PAGE_SIZE}
      >
        <table>
          <thead>
            <tr>
              <th>Código</th><th>Nombre</th><th>Grupo</th><th>Proveedor</th><th>Costo</th><th>PVP1</th><th>Stock</th>
              {mostrarValorizacion && <><th>Valor a costo</th><th>Valor a precio de venta</th></>}
              <th>Estado</th>{isAdmin && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {pagina.map(producto => {
              const stock = numberValue(producto.stock);
              return (
                <tr key={producto.id}>
                  <td><code style={{ background: '#f0f4ff', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{producto.codigo || '—'}</code></td>
                  <td><strong>{producto.nombre}</strong>{producto.modelo && <><br /><small style={{ color: 'var(--text-secondary)' }}>{producto.modelo}{producto.color ? ` · ${producto.color}` : ''}</small></>}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{producto.grupo || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{producto.proveedor_nombre || '—'}</td>
                  <td>{currencyFormatter.format(numberValue(producto.costo))}</td>
                  <td>{currencyFormatter.format(numberValue(producto.pvp1))}</td>
                  <td><span style={{ fontWeight: 700, color: stock > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>{stock}</span></td>
                  {mostrarValorizacion && <><td>{currencyFormatter.format(stock * numberValue(producto.costo))}</td><td>{currencyFormatter.format(stock * numberValue(producto.pvp1))}</td></>}
                  <td><span className={`chip ${producto.activo ? 'chip-active' : 'chip-inactive'}`}>{producto.activo ? 'Activo' : 'Inactivo'}</span></td>
                  {isAdmin && <td><button className="btn-icon" onClick={() => abrirEditar(producto)} title="Editar">✎</button></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>

      <ProductoFormModal abierto={modal} editando={editando} productoInicial={productoSel} onCerrar={cerrar} onGuardado={cargar} />
    </div>
  );
}
