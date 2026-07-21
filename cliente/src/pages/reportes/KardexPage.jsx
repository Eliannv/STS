import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  CalendarClock,
  CircleDollarSign,
  FileSpreadsheet,
  FileText,
  History,
  Package,
  PackageOpen,
  RefreshCw,
  Scale,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '../../api/api';
import { generarReporte } from '../../api/reportesApi';
import FilterCard, { FilterItem, filterInputStyle } from '../../components/common/FilterCard';
import StatCard from '../../components/common/StatCard';
import TableCard from '../../components/common/TableCard';
import ProductoAutocomplete from '../../components/productos/ProductoAutocomplete';
import reportsConfig from '../../config/reportes/reports.config';
import { exportarKardexExcel } from '../../utils/exportarExcel';
import { exportarKardexPdf } from '../../utils/exportarPdf';
import './KardexPage.css';

const definition = reportsConfig.inventario.kardex;
const PAGE_SIZE = 50;
const currencyFormatter = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });
const numberFormatter = new Intl.NumberFormat('es-EC');

function scalarValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value !== 'object') return String(value);
  return value.nombre || value.descripcion || value.label || value.codigo || value.modelo || '—';
}

function formatDate(value, options = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return scalarValue(value);
  return date.toLocaleString('es-EC', options);
}

function formatValue(value, type) {
  if (value === null || value === undefined || value === '') return '—';
  if (type === 'currency') return currencyFormatter.format(Number(value) || 0);
  if (type === 'number') return numberFormatter.format(Number(value) || 0);
  if (type === 'date') return formatDate(value, { dateStyle: 'medium' });
  if (type === 'datetime') return formatDate(value, { dateStyle: 'medium', timeStyle: 'short' });
  return scalarValue(value);
}

function movementKind(movement) {
  if (movement.naturaleza === 'ENTRADA') return 'entry';
  if (movement.naturaleza === 'SALIDA') return 'exit';
  if (movement.naturaleza === 'NEUTRO') return 'adjustment';
  const difference = Number(movement.stock_nuevo ?? 0) - Number(movement.stock_anterior ?? 0);
  return difference > 0 ? 'entry' : difference < 0 ? 'exit' : 'adjustment';
}

function normalizeMovement(movement) {
  const createdAt = movement.fecha_operacion || movement.created_at || movement.fecha;
  const date = createdAt ? new Date(createdAt) : null;
  const previousStock = Number(movement.stock_anterior ?? movement.stockAnterior ?? 0);
  const currentStock = Number(movement.stock_nuevo ?? movement.stockActual ?? previousStock);
  const kind = movementKind(movement);
  const quantity = Math.abs(Number(movement.cantidad || currentStock - previousStock));
  const unitCost = Number(movement.costo_promedio_nuevo ?? movement.costo_unitario ?? movement.costoUnitario ?? 0);
  const referenceType = movement.referencia_tipo || 'Movimiento';
  const referenceCode = movement.referencia_codigo || movement.referencia_id;

  return {
    id: movement.id,
    rawDate: createdAt,
    fecha: date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('es-EC') : '—',
    hora: date && !Number.isNaN(date.getTime()) ? date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : '—',
    productoCodigo: movement.producto_codigo || '—',
    productoNombre: movement.producto_nombre || '—',
    grupo: movement.grupo_producto || '—',
    documento: referenceCode ? `${referenceType} ${referenceCode}` : referenceType,
    tipoMovimiento: movement.tipo_movimiento || movement.tipo || 'AJUSTE',
    detalle: scalarValue(movement.motivo || movement.producto_nombre),
    entrada: kind === 'entry' ? quantity : 0,
    salida: kind === 'exit' ? quantity : 0,
    stockAnterior: previousStock,
    stockActual: currentStock,
    costoUnitario: unitCost,
    saldo: Number(movement.saldo ?? currentStock * unitCost),
    usuario: scalarValue(movement.usuario_nombre),
    sucursal: scalarValue(movement.sucursal_nombre || (movement.sucursal_id ? `Sucursal #${movement.sucursal_id}` : null)),
    observacion: scalarValue(movement.observacion),
    kind,
  };
}

function entityLabel(item) {
  return item.nombre || item.nombres || item.username || item.email || item.codigo || `#${item.id}`;
}

function ProductCard({ product, movements }) {
  const lastEntry = [...movements].reverse().find(movement => movement.kind === 'entry');
  const values = {
    ...product,
    proveedor: product.proveedor || product.proveedor_nombre || (product.proveedor_id ? `Proveedor #${product.proveedor_id}` : '—'),
    ultimoIngreso: lastEntry?.rawDate || product.updated_at,
    estado: product.activo === false ? 'Inactivo' : 'Activo',
  };
  return (
    <section className="kardex-product-card">
      <div className="kardex-product-card__header">
        <div className="kardex-product-card__identity">
          <span className="kardex-product-card__icon"><Package size={22} /></span>
          <div><h2>{scalarValue(product)}</h2><p>Ficha del producto seleccionado</p></div>
        </div>
        <span className={product.activo === false ? 'badge badge-danger' : 'badge badge-success'}>{values.estado}</span>
      </div>
      <div className="kardex-product-grid">
        {definition.productFields.map(field => <div className="kardex-product-field" key={field.key}><span>{field.label}</span><strong>{formatValue(values[field.key], field.type)}</strong></div>)}
      </div>
    </section>
  );
}

function MovementBadge({ movement }) {
  const Icon = movement.kind === 'entry' ? ArrowDownToLine : movement.kind === 'exit' ? ArrowUpFromLine : SlidersHorizontal;
  return <span className={`movement-badge ${movement.kind}`}><Icon size={13} /> {movement.tipoMovimiento}</span>;
}

function KardexTable({ rows }) {
  return (
    <table className="kardex-table">
      <thead><tr>{definition.columns.map(column => <th key={column.key} style={{ textAlign: column.align || 'left' }}>{column.label}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.id}>{definition.columns.map(column => <td key={column.key} style={{ textAlign: column.align || 'left' }}>{column.key === 'tipoMovimiento' ? <MovementBadge movement={row} /> : formatValue(row[column.key], column.type)}</td>)}</tr>)}</tbody>
    </table>
  );
}

function Timeline({ rows }) {
  const entries = rows.filter(row => row.kind === 'entry').length;
  const exits = rows.filter(row => row.kind === 'exit').length;
  const adjustments = rows.filter(row => row.kind === 'adjustment').length;
  const items = [
    { label: 'Primer movimiento', value: formatDate(rows[0]?.rawDate, { dateStyle: 'short' }), icon: History },
    { label: 'Ingresos', value: `${entries} movimientos`, icon: ArrowDownToLine },
    { label: 'Ventas / salidas', value: `${exits} movimientos`, icon: ArrowUpFromLine },
    { label: 'Ajustes', value: `${adjustments} movimientos`, icon: SlidersHorizontal },
    { label: 'Último movimiento', value: formatDate(rows.at(-1)?.rawDate, { dateStyle: 'short' }), icon: CalendarClock },
  ];
  return <section className="kardex-timeline"><h3>Línea de tiempo del inventario</h3><div className="kardex-timeline__track">{items.map(item => <div className="kardex-timeline__item" key={item.label}><span className="kardex-timeline__dot"><item.icon size={14} /></span><strong>{item.label}</strong><small>{item.value}</small></div>)}</div></section>;
}

function EmptyState({ product, onChangeProduct }) {
  return (
    <div className="kardex-empty">
      <span className="kardex-empty__icon"><PackageOpen size={27} /></span>
      <strong>{product ? 'Este producto aún no registra movimientos de inventario.' : 'No existen movimientos para los filtros seleccionados.'}</strong>
      <p>{product ? 'Selecciona otro producto o ajusta los filtros para consultar su historial.' : 'Modifica los filtros para ampliar la consulta del Kardex.'}</p>
      {product && <button type="button" className="btn btn-primary btn-sm" onClick={onChangeProduct}>Cambiar producto</button>}
    </div>
  );
}

export default function KardexPage() {
  const autocompleteRef = useRef(null);
  const [product, setProduct] = useState(null);
  const [filters, setFilters] = useState(() => ({ ...definition.defaultFilters }));
  const [report, setReport] = useState(null);
  const [entities, setEntities] = useState({ sucursales: [], usuarios: [], proveedores: [], grupos: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/sucursal/lista?limit=100'),
      api.get('/usuario/lista?limit=100'),
      api.get('/proveedor/lista?limit=5000'),
      api.get('/producto/lista?limit=5000'),
    ]).then(([branches, users, providers, products]) => {
      if (!active) return;
      const productRows = products.ok ? (products.data?.resultado || []) : [];
      setEntities({
        sucursales: branches.ok ? (branches.data?.resultado || []) : [],
        usuarios: users.ok ? (users.data?.resultado || []) : [],
        proveedores: providers.ok ? (providers.data?.resultado || []) : [],
        grupos: [...new Set(productRows.map(item => item.grupo).filter(Boolean))].sort().map(nombre => ({ id: nombre, nombre })),
      });
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await generarReporte({ endpoint: definition.endpoint, filtros: filters });
        if (active) setReport(response.report);
      } catch (requestError) {
        if (active) {
          setReport(null);
          setError(requestError.message || 'No se pudo consultar el Kardex.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 180);
    return () => { active = false; clearTimeout(timer); };
  }, [filters]);

  useEffect(() => { setPage(0); }, [filters]);

  const resolvedProduct = useMemo(() => ({ ...(report?.summary?.producto || {}), ...(product || {}) }), [product, report]);
  const movements = useMemo(() => (report?.rows || []).map(normalizeMovement), [report]);
  const visibleMovements = useMemo(() => movements.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [movements, page]);
  const hasNext = (page + 1) * PAGE_SIZE < movements.length;
  const indicators = useMemo(() => ({
    stockActual: Number(resolvedProduct.stock ?? report?.summary?.stock_actual ?? 0),
    entradas: Number(report?.summary?.entradas || 0),
    salidas: Number(report?.summary?.salidas || 0),
    costoPromedio: Number(resolvedProduct.costo ?? report?.summary?.costo_promedio ?? 0),
    valorInventario: Number(resolvedProduct.stock ?? 0) * Number(resolvedProduct.costo ?? report?.summary?.costo_promedio ?? 0),
    ultimoMovimiento: report?.summary?.ultimo_movimiento || movements.at(-1)?.rawDate || null,
  }), [report, resolvedProduct, movements]);

  function updateFilter(key, value) { setFilters(previous => ({ ...previous, [key]: value })); }
  function selectProduct(selected) { setProduct(selected); updateFilter('codigo', selected.codigo || ''); }
  function clearProduct() { setProduct(null); updateFilter('codigo', ''); }
  function clearFilters() { setProduct(null); setFilters({ ...definition.defaultFilters }); }
  function changeProduct() { clearProduct(); requestAnimationFrame(() => autocompleteRef.current?.focus()); }

  const exportPayload = {
    product: product ? resolvedProduct : null,
    productFields: definition.productFields,
    indicators,
    indicatorDefinitions: product ? definition.summary : [],
    filters,
    filterDefinitions: definition.filters,
    columns: definition.columns,
    rows: movements,
    generatedAt: report?.generatedAt || new Date().toISOString(),
  };

  const statIcons = [Boxes, ArrowDownToLine, ArrowUpFromLine, Scale, CircleDollarSign, CalendarClock];

  return (
    <div className="page kardex-page">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div><h1 className="page-title">{definition.title}</h1><p className="page-subtitle">{definition.description}</p></div>
        <div className="kardex-header-actions">
          <button type="button" className="btn btn-ghost btn-sm" disabled={loading} onClick={() => setFilters(previous => ({ ...previous }))}><RefreshCw size={14} /> Actualizar</button>
          <button type="button" className="btn btn-secondary btn-sm" disabled={!movements.length} onClick={() => exportarKardexPdf(exportPayload)}><FileText size={14} /> PDF</button>
          <button type="button" className="btn btn-secondary btn-sm" disabled={!movements.length} onClick={() => exportarKardexExcel(exportPayload)}><FileSpreadsheet size={14} /> Excel</button>
        </div>
      </div>

      {error && <div className="kardex-error">{error}</div>}

      <FilterCard titulo="Filtros" onLimpiar={clearFilters} resultado={`${movements.length} movimiento${movements.length === 1 ? '' : 's'} encontrado${movements.length === 1 ? '' : 's'}`}>
        {definition.filters.map(filter => <FilterItem key={filter.key} label={filter.label} span={filter.type === 'product-search' ? 2 : 1}>
          {filter.type === 'product-search' ? <ProductoAutocomplete ref={autocompleteRef} producto={product} onSelect={selectProduct} onClear={clearProduct} />
            : filter.type === 'select' ? <select value={filters[filter.key] ?? ''} onChange={event => updateFilter(filter.key, event.target.value)} style={filterInputStyle}>{(filter.options || []).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
              : filter.type === 'entity' ? <select value={filters[filter.key] ?? ''} onChange={event => updateFilter(filter.key, event.target.value)} style={filterInputStyle}><option value="">Todos</option>{(entities[filter.source] || []).map(item => <option key={item.id} value={item.id}>{entityLabel(item)}</option>)}</select>
                : <input type={filter.type === 'date' ? 'date' : 'text'} value={filters[filter.key] ?? ''} onChange={event => updateFilter(filter.key, event.target.value)} style={filterInputStyle} />}
        </FilterItem>)}
      </FilterCard>

      {product && <ProductCard product={resolvedProduct} movements={movements} />}
      {product && <div className="kardex-stats">{definition.summary.map((item, index) => { const Icon = statIcons[index] || Boxes; return <StatCard key={item.key} icon={<Icon size={20} />} label={item.label} value={formatValue(indicators[item.key], item.type)} color={item.color} />; })}</div>}
      {movements.length > 0 && <Timeline rows={movements} />}

      <TableCard loading={loading} empty={false} header={<strong>Movimientos del Kardex</strong>} page={page} hasNext={hasNext} onPrevPage={() => setPage(current => current - 1)} onNextPage={() => setPage(current => current + 1)} hidePagination={movements.length <= PAGE_SIZE}>
        {!loading && movements.length === 0 ? <EmptyState product={product} onChangeProduct={changeProduct} /> : <KardexTable rows={visibleMovements} />}
      </TableCard>
    </div>
  );
}
