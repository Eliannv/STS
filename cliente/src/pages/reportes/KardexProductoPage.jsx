import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
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
import Breadcrumb from '../../components/common/Breadcrumb';
import FilterCard, { FilterItem, filterInputStyle } from '../../components/common/FilterCard';
import StatCard from '../../components/common/StatCard';
import TableCard from '../../components/common/TableCard';
import ProductoAutocomplete from '../../components/productos/ProductoAutocomplete';
import reportsConfig from '../../config/reportes/reports.config';
import { exportarKardexExcel } from '../../utils/exportarExcel';
import { exportarKardexPdf } from '../../utils/exportarPdf';
import './KardexProductoPage.css';

const definition = reportsConfig.inventario['kardex-producto'];
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
  const type = String(movement.tipo || movement.tipoMovimiento || '').toUpperCase();
  const difference = Number(movement.stock_nuevo ?? movement.stockActual ?? 0) - Number(movement.stock_anterior ?? movement.stockAnterior ?? 0);
  if (type.includes('INGRESO') || type.includes('COMPRA') || difference > 0) return 'entry';
  if (type.includes('VENTA') || type.includes('SALIDA') || type.includes('ELIMINACION') || difference < 0) return 'exit';
  return 'adjustment';
}

function normalizeMovement(movement, product) {
  const createdAt = movement.created_at || movement.fecha;
  const date = createdAt ? new Date(createdAt) : null;
  const previousStock = Number(movement.stock_anterior ?? movement.stockAnterior ?? 0);
  const currentStock = Number(movement.stock_nuevo ?? movement.stockActual ?? previousStock);
  const difference = currentStock - previousStock;
  const kind = movementKind(movement);
  const quantity = Math.abs(Number(movement.cantidad ?? difference ?? 0));
  const unitCost = Number(movement.costo_unitario ?? movement.costoUnitario ?? product?.costo ?? 0);
  const reference = movement.referencia ?? movement.referencia_id;
  const referenceType = movement.referencia_tipo || movement.documento || 'Movimiento';

  return {
    id: movement.id || `${createdAt || 'movimiento'}-${reference || quantity}`,
    rawDate: createdAt,
    fecha: date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('es-EC') : '—',
    hora: date && !Number.isNaN(date.getTime()) ? date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : '—',
    documento: reference ? `${referenceType} #${reference}` : referenceType,
    tipoMovimiento: movement.tipo || 'AJUSTE',
    detalle: scalarValue(movement.detalle || movement.producto_nombre || product),
    entrada: kind === 'entry' ? quantity : 0,
    salida: kind === 'exit' ? quantity : 0,
    stockAnterior: previousStock,
    stockActual: currentStock,
    costoUnitario: unitCost,
    saldo: currentStock * unitCost,
    usuario: scalarValue(movement.usuario_nombre || movement.usuario || movement.usuario_email),
    usuarioId: movement.usuario_id || movement.usuarioId || '',
    sucursalId: movement.sucursal_id || movement.sucursalId || '',
    observacion: scalarValue(movement.observacion),
    kind,
  };
}

function entityLabel(item) {
  return item.nombre || item.nombres || item.username || item.email || item.codigo || `#${item.id}`;
}

function ProductCard({ product, movements }) {
  const lastEntry = movements.findLast?.(movement => movement.kind === 'entry') || [...movements].reverse().find(movement => movement.kind === 'entry');
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
          <div>
            <h2>{scalarValue(product)}</h2>
            <p>Ficha del producto seleccionado</p>
          </div>
        </div>
        <span className={product.activo === false ? 'badge badge-danger' : 'badge badge-success'}>
          {values.estado}
        </span>
      </div>
      <div className="kardex-product-grid">
        {definition.productFields.map(field => (
          <div className="kardex-product-field" key={field.key}>
            <span>{field.label}</span>
            <strong title={scalarValue(values[field.key])}>{formatValue(values[field.key], field.type)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function MovementBadge({ movement }) {
  const Icon = movement.kind === 'entry' ? ArrowDownToLine : movement.kind === 'exit' ? ArrowUpFromLine : SlidersHorizontal;
  return (
    <span className={`movement-badge ${movement.kind}`}>
      <Icon size={13} /> {movement.tipoMovimiento}
    </span>
  );
}

function KardexTable({ rows }) {
  return (
    <table className="kardex-table">
      <thead>
        <tr>
          {definition.columns.map(column => <th key={column.key} style={{ textAlign: column.align || 'left' }}>{column.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.id}>
            {definition.columns.map(column => (
              <td key={column.key} style={{ textAlign: column.align || 'left' }}>
                {column.key === 'tipoMovimiento' ? <MovementBadge movement={row} /> : formatValue(row[column.key], column.type)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Timeline({ rows }) {
  const first = rows[0]?.rawDate;
  const last = rows.at(-1)?.rawDate;
  const entries = rows.filter(row => row.kind === 'entry').length;
  const exits = rows.filter(row => row.kind === 'exit').length;
  const adjustments = rows.filter(row => row.kind === 'adjustment').length;
  const items = [
    { label: 'Primer movimiento', value: formatDate(first, { dateStyle: 'short' }), icon: History },
    { label: 'Ingresos', value: `${entries} movimientos`, icon: ArrowDownToLine },
    { label: 'Ventas / salidas', value: `${exits} movimientos`, icon: ArrowUpFromLine },
    { label: 'Ajustes', value: `${adjustments} movimientos`, icon: SlidersHorizontal },
    { label: 'Último movimiento', value: formatDate(last, { dateStyle: 'short' }), icon: CalendarClock },
  ];

  return (
    <section className="kardex-timeline">
      <h3>Línea de tiempo del inventario</h3>
      <div className="kardex-timeline__track">
        {items.map(item => (
          <div className="kardex-timeline__item" key={item.label}>
            <span className="kardex-timeline__dot"><item.icon size={14} /></span>
            <strong>{item.label}</strong>
            <small>{item.value}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ onChangeProduct }) {
  return (
    <div className="kardex-empty">
      <span className="kardex-empty__icon"><PackageOpen size={27} /></span>
      <strong>Este producto aún no registra movimientos de inventario.</strong>
      <p>Selecciona otro producto o ajusta los filtros para consultar su historial.</p>
      <button type="button" className="btn btn-primary btn-sm" onClick={onChangeProduct}>Cambiar producto</button>
    </div>
  );
}

export default function KardexProductoPage() {
  const autocompleteRef = useRef(null);
  const [product, setProduct] = useState(null);
  const [filters, setFilters] = useState(() => ({ ...definition.defaultFilters }));
  const [report, setReport] = useState(null);
  const [rawMovements, setRawMovements] = useState([]);
  const [entities, setEntities] = useState({ sucursales: [], usuarios: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/sucursal/lista?limit=100'),
      api.get('/usuario/lista?limit=100'),
    ]).then(([branches, users]) => {
      if (!active) return;
      setEntities({
        sucursales: branches.ok ? (branches.data?.resultado || []) : [],
        usuarios: users.ok ? (users.data?.resultado || []) : [],
      });
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!product?.codigo) {
      setReport(null);
      setRawMovements([]);
      return undefined;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const reportFilters = { ...filters, codigo: product.codigo };
        const [reportResponse, movementsResponse] = await Promise.all([
          generarReporte({ endpoint: definition.endpoint, filtros: reportFilters, paginacion: { page: 1, pageSize: 100 } }),
          api.get(`/movimientos?productoId=${encodeURIComponent(product.id)}&limit=100`),
        ]);
        if (!active) return;
        setReport(reportResponse.report);
        setRawMovements(movementsResponse.ok ? (movementsResponse.data?.resultado || []) : reportResponse.report.rows || []);
      } catch (requestError) {
        if (active) setError(requestError.message || 'No se pudo consultar el Kardex.');
      } finally {
        if (active) setLoading(false);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [product, filters]);

  const resolvedProduct = useMemo(() => ({
    ...(product || {}),
    ...(report?.summary?.producto && typeof report.summary.producto === 'object' ? report.summary.producto : {}),
  }), [product, report]);

  const movements = useMemo(() => rawMovements
    .map(item => normalizeMovement(item, resolvedProduct))
    .filter(item => {
      if (filters.tipoMovimiento && item.kind !== filters.tipoMovimiento) return false;
      if (filters.sucursalId && String(item.sucursalId) !== String(filters.sucursalId)) return false;
      if (filters.usuarioId && String(item.usuarioId) !== String(filters.usuarioId)) return false;
      if (filters.fechaDesde && item.rawDate && new Date(item.rawDate) < new Date(`${filters.fechaDesde}T00:00:00`)) return false;
      if (filters.fechaHasta && item.rawDate && new Date(item.rawDate) > new Date(`${filters.fechaHasta}T23:59:59.999`)) return false;
      return true;
    })
    .sort((a, b) => new Date(a.rawDate || 0) - new Date(b.rawDate || 0)), [rawMovements, resolvedProduct, filters]);

  const indicators = useMemo(() => {
    const entries = movements.filter(item => item.kind === 'entry');
    const exits = movements.filter(item => item.kind === 'exit');
    const entryUnits = entries.reduce((sum, item) => sum + item.entrada, 0);
    const exitUnits = exits.reduce((sum, item) => sum + item.salida, 0);
    const weightedCost = entries.reduce((sum, item) => sum + item.costoUnitario * item.entrada, 0);
    const averageCost = entryUnits ? weightedCost / entryUnits : Number(resolvedProduct.costo || 0);
    const stock = Number(resolvedProduct.stock ?? movements.at(-1)?.stockActual ?? 0);
    return {
      producto: scalarValue(resolvedProduct),
      movimientos: movements.length,
      stockActual: stock,
      entradas: entryUnits,
      salidas: exitUnits,
      costoPromedio: averageCost,
      valorInventario: stock * averageCost,
      ultimoMovimiento: movements.at(-1)?.rawDate || null,
    };
  }, [movements, resolvedProduct]);

  function updateFilter(key, value) {
    setFilters(previous => ({ ...previous, [key]: value }));
  }

  function selectProduct(selected) {
    setProduct(selected);
    setFilters(previous => ({ ...previous, codigo: selected.codigo || '' }));
  }

  function clearProduct() {
    setProduct(null);
    setFilters(previous => ({ ...previous, codigo: '' }));
  }

  function clearFilters() {
    setFilters({ ...definition.defaultFilters, codigo: product?.codigo || '' });
  }

  function changeProduct() {
    clearProduct();
    requestAnimationFrame(() => autocompleteRef.current?.focus());
  }

  const exportPayload = {
    product: resolvedProduct,
    productFields: definition.productFields,
    indicators,
    indicatorDefinitions: definition.summary,
    filters,
    filterDefinitions: definition.filters,
    columns: definition.columns,
    rows: movements,
    generatedAt: report?.generatedAt || new Date().toISOString(),
  };

  return (
    <div className="page kardex-page">
      

      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">{definition.title}</h1>
          <p className="page-subtitle">{definition.description}</p>
        </div>
        <div className="kardex-header-actions">
          <button type="button" className="btn btn-ghost btn-sm" disabled={!product || loading} onClick={() => setFilters(previous => ({ ...previous }))}>
            <RefreshCw size={14} /> Actualizar
          </button>
          <button type="button" className="btn btn-secondary btn-sm" disabled={!product} onClick={() => exportarKardexPdf(exportPayload)}>
            <FileText size={14} /> PDF
          </button>
          <button type="button" className="btn btn-secondary btn-sm" disabled={!product} onClick={() => exportarKardexExcel(exportPayload)}>
            <FileSpreadsheet size={14} /> Excel
          </button>
        </div>
      </div>

      {error && <div className="kardex-error">{error}</div>}

      <FilterCard titulo="Filtros" onLimpiar={clearFilters} resultado={product ? `${movements.length} movimientos encontrados` : 'Selecciona un producto para consultar'}>
        {definition.filters.map(filter => (
          <FilterItem key={filter.key} label={filter.label} span={filter.type === 'product-search' ? 2 : 1}>
            {filter.type === 'product-search' ? (
              <ProductoAutocomplete ref={autocompleteRef} producto={product} onSelect={selectProduct} onClear={clearProduct} />
            ) : filter.type === 'select' ? (
              <select value={filters[filter.key] ?? ''} onChange={event => updateFilter(filter.key, event.target.value)} style={filterInputStyle}>
                {(filter.options || []).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            ) : filter.type === 'entity' ? (
              <select value={filters[filter.key] ?? ''} onChange={event => updateFilter(filter.key, event.target.value)} style={filterInputStyle}>
                <option value="">Todos</option>
                {(entities[filter.source] || []).map(item => <option key={item.id} value={item.id}>{entityLabel(item)}</option>)}
              </select>
            ) : (
              <input
                type={filter.type === 'date' ? 'date' : 'text'}
                value={filters[filter.key] ?? ''}
                onChange={event => updateFilter(filter.key, event.target.value)}
                style={filterInputStyle}
              />
            )}
          </FilterItem>
        ))}
      </FilterCard>

      {product && <ProductCard product={resolvedProduct} movements={movements} />}

      {product && (
        <div className="kardex-stats">
          {definition.summary.map((item, index) => {
            const icons = [Package, BarChart3, Boxes, ArrowDownToLine, ArrowUpFromLine, Scale, CircleDollarSign, CalendarClock];
            const Icon = icons[index] || BarChart3;
            return (
              <StatCard
                key={item.key}
                icon={<Icon size={20} />}
                label={item.label}
                value={formatValue(indicators[item.key], item.type)}
                color={item.color}
              />
            );
          })}
        </div>
      )}

      {product && movements.length > 0 && <Timeline rows={movements} />}

      {product && (
        <TableCard loading={loading} empty={false} hidePagination header={<strong>Movimientos del Kardex</strong>}>
          {!loading && movements.length === 0 ? <EmptyState onChangeProduct={changeProduct} /> : <KardexTable rows={movements} />}
        </TableCard>
      )}

      {!product && (
        <div className="kardex-empty kardex-product-card">
          <span className="kardex-empty__icon"><PackageOpen size={27} /></span>
          <strong>Busca un producto para consultar su Kardex.</strong>
          <p>Puedes encontrarlo por nombre, código, modelo, color o grupo.</p>
        </div>
      )}
    </div>
  );
}
