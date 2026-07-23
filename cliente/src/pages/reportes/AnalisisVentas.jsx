import { createElement, useEffect, useMemo, useState } from 'react';
import { BarChart3, CircleDollarSign, Landmark, ReceiptText, Users } from 'lucide-react';
import { api } from '../../api/api';
import { generarReporte } from '../../api/reportesApi';
import FilterCard, { FilterItem, filterInputStyle } from '../../components/common/FilterCard';
import StatCard from '../../components/common/StatCard';
import TableCard from '../../components/common/TableCard';
import reportsConfig from '../../config/reportes/reports.config';

const PAGE_SIZE = 20;
const definition = reportsConfig.ventas['analisis-ventas'];
const currencyFormatter = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });
const numberFormatter = new Intl.NumberFormat('es-EC');

const numberValue = value => Number(value || 0);
const entityName = entity => entity.nombre_completo
  || [entity.nombres || entity.nombre, entity.apellidos || entity.apellido].filter(Boolean).join(' ')
  || entity.razon_social
  || entity.codigo
  || `#${entity.id}`;

function formatValue(value, type = 'text') {
  if (value === null || value === undefined || value === '') return '—';
  if (type === 'currency') return currencyFormatter.format(numberValue(value));
  if (type === 'number') return numberFormatter.format(numberValue(value));
  if (type === 'datetime') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('es-EC');
  }
  if (type === 'percentage') return `${numberValue(value).toFixed(2)}%`;
  return String(value).replaceAll('_', ' ');
}

function agrupar(rows, key, labelKey) {
  const groups = new Map();
  rows.forEach(row => {
    const id = row[key] || 'sin-asignar';
    const current = groups.get(id) || {
      id,
      nombre: row[labelKey] || 'Sin asignar',
      transacciones: 0,
      ventas: 0,
      cobros: 0,
      totalVentas: 0,
      totalCobrado: 0,
      saldoPendiente: 0,
      costo: 0,
      utilidad: 0,
    };
    current.transacciones += 1;
    if (row.tipoTransaccion === 'VENTA') {
      current.ventas += 1;
      current.totalVentas += numberValue(row.total);
      current.saldoPendiente += numberValue(row.saldoPendiente);
      current.costo += numberValue(row.costo);
      current.utilidad += numberValue(row.utilidad);
    } else {
      current.cobros += 1;
      current.totalCobrado += numberValue(row.monto);
    }
    groups.set(id, current);
  });
  return [...groups.values()].sort((a, b) => b.totalVentas - a.totalVentas);
}

const detailColumns = [
  { key: 'tipoTransaccionLabel', label: 'Movimiento' },
  { key: 'numeroFactura', label: 'Factura' },
  { key: 'fecha', label: 'Fecha', type: 'datetime' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'usuario', label: 'Usuario' },
  { key: 'sucursal', label: 'Sucursal' },
  { key: 'metodoPago', label: 'Método de pago' },
  { key: 'estado', label: 'Estado' },
  { key: 'total', label: 'Monto', type: 'currency' },
  { key: 'saldoPendiente', label: 'Saldo pendiente', type: 'currency' },
];

const groupedColumns = [
  { key: 'nombre', label: 'Agrupación' },
  { key: 'transacciones', label: 'Transacciones', type: 'number' },
  { key: 'ventas', label: 'Ventas', type: 'number' },
  { key: 'cobros', label: 'Cobros', type: 'number' },
  { key: 'totalVentas', label: 'Total vendido', type: 'currency' },
  { key: 'totalCobrado', label: 'Total cobrado', type: 'currency' },
  { key: 'saldoPendiente', label: 'Saldo pendiente', type: 'currency' },
];

const utilityColumns = [
  { key: 'numeroFactura', label: 'Factura' },
  { key: 'fecha', label: 'Fecha', type: 'datetime' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'usuario', label: 'Usuario' },
  { key: 'sucursal', label: 'Sucursal' },
  { key: 'total', label: 'Venta', type: 'currency' },
  { key: 'costo', label: 'Costo', type: 'currency' },
  { key: 'utilidad', label: 'Utilidad', type: 'currency' },
  { key: 'margen', label: 'Margen', type: 'percentage' },
];

export default function AnalisisVentas() {
  const [filters, setFilters] = useState(definition.defaultFilters);
  const [report, setReport] = useState(null);
  const [catalogs, setCatalogs] = useState({ clientes: [], usuarios: [], sucursales: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/clientes?limit=100&offset=0'),
      api.get('/usuarios?limit=100&offset=0'),
      api.get('/sucursales?limit=100&offset=0'),
    ]).then(([clientes, usuarios, sucursales]) => {
      if (!active) return;
      setCatalogs({
        clientes: clientes.ok ? (clientes.data.resultado || []) : [],
        usuarios: usuarios.ok ? (usuarios.data.resultado || []) : [],
        sucursales: sucursales.ok ? (sucursales.data.resultado || []) : [],
      });
    });
    return () => { active = false; };
  }, []);

  const queryFilters = useMemo(() => {
    return {
      fechaDesde: filters.fechaDesde,
      fechaHasta: filters.fechaHasta,
      clienteId: filters.clienteId,
      usuarioId: filters.usuarioId,
      sucursalId: filters.sucursalId,
      estado: filters.estado,
      metodoPago: filters.metodoPago,
      buscarFactura: filters.buscarFactura,
      buscarCliente: filters.buscarCliente,
      tipoTransaccion: filters.tipoTransaccion,
    };
  }, [
    filters.fechaDesde,
    filters.fechaHasta,
    filters.clienteId,
    filters.usuarioId,
    filters.sucursalId,
    filters.estado,
    filters.metodoPago,
    filters.buscarFactura,
    filters.buscarCliente,
    filters.tipoTransaccion,
  ]);

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await generarReporte({
          endpoint: definition.endpoint,
          filtros: queryFilters,
          paginacion: { page: 1, pageSize: 5000 },
        });
        if (active) setReport(response.report);
      } catch (requestError) {
        if (active) setError(requestError.message || 'No se pudo cargar el análisis de ventas.');
      } finally {
        if (active) setLoading(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [queryFilters]);

  useEffect(() => {
    const timeout = setTimeout(() => setPage(0), 0);
    return () => clearTimeout(timeout);
  }, [filters.vista, queryFilters]);

  const view = useMemo(() => {
    const sourceRows = report?.rows || [];
    if (filters.vista === 'CLIENTE') return { rows: agrupar(sourceRows, 'clienteId', 'cliente'), columns: groupedColumns };
    if (filters.vista === 'USUARIO') return { rows: agrupar(sourceRows, 'usuarioId', 'usuario'), columns: groupedColumns };
    if (filters.vista === 'SUCURSAL') return { rows: agrupar(sourceRows, 'sucursalId', 'sucursal'), columns: groupedColumns };
    if (filters.vista === 'UTILIDAD') {
      return {
        rows: sourceRows
          .filter(row => row.tipoTransaccion === 'VENTA')
          .map(row => ({ ...row, margen: numberValue(row.total) ? numberValue(row.utilidad) / numberValue(row.total) * 100 : 0 })),
        columns: utilityColumns,
      };
    }
    return { rows: sourceRows, columns: detailColumns };
  }, [report, filters.vista]);

  const summary = useMemo(() => {
    const rows = report?.rows || [];
    const sales = rows.filter(row => row.tipoTransaccion === 'VENTA');
    const payments = rows.filter(row => row.tipoTransaccion === 'COBRO');
    const totalSales = sales.reduce((sum, row) => sum + numberValue(row.total), 0);
    const cost = sales.reduce((sum, row) => sum + numberValue(row.costo), 0);
    const utility = sales.reduce((sum, row) => sum + numberValue(row.utilidad), 0);
    if (filters.vista === 'UTILIDAD') return [
      { label: 'Ventas', value: sales.length, color: '#3498db', icon: ReceiptText },
      { label: 'Total vendido', value: currencyFormatter.format(totalSales), color: '#27ae60', icon: CircleDollarSign },
      { label: 'Costo', value: currencyFormatter.format(cost), color: '#e67e22', icon: BarChart3 },
      { label: 'Utilidad', value: currencyFormatter.format(utility), color: '#8e44ad', icon: CircleDollarSign },
    ];
    if (['CLIENTE', 'USUARIO', 'SUCURSAL'].includes(filters.vista)) {
      const label = filters.vista === 'CLIENTE' ? 'Clientes' : filters.vista === 'USUARIO' ? 'Usuarios' : 'Sucursales';
      return [
        { label, value: view.rows.length, color: '#3498db', icon: filters.vista === 'SUCURSAL' ? Landmark : Users },
        { label: 'Ventas', value: sales.length, color: '#27ae60', icon: ReceiptText },
        { label: 'Total vendido', value: currencyFormatter.format(totalSales), color: '#8e44ad', icon: CircleDollarSign },
        { label: 'Saldo pendiente', value: currencyFormatter.format(sales.reduce((sum, row) => sum + numberValue(row.saldoPendiente), 0)), color: '#e74c3c', icon: CircleDollarSign },
      ];
    }
    return [
      { label: 'Transacciones', value: rows.length, color: '#3498db', icon: BarChart3 },
      { label: 'Ventas', value: sales.length, color: '#27ae60', icon: ReceiptText },
      { label: 'Cobros', value: payments.length, color: '#8e44ad', icon: CircleDollarSign },
      { label: 'Monto procesado', value: currencyFormatter.format(totalSales + payments.reduce((sum, row) => sum + numberValue(row.monto), 0)), color: '#e67e22', icon: CircleDollarSign },
    ];
  }, [report, filters.vista, view.rows.length]);

  const pageRows = view.rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasNext = (page + 1) * PAGE_SIZE < view.rows.length;
  const paymentOptions = filters.tipoTransaccion === 'COBROS'
    ? ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']
    : ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CREDITO'];

  function updateFilter(key, value) {
    setFilters(current => {
      const next = { ...current, [key]: value };
      if (key === 'tipoTransaccion' && value === 'COBROS' && current.metodoPago === 'CREDITO') next.metodoPago = '';
      return next;
    });
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{definition.title}</h1>
          <p className="page-subtitle">{definition.description}</p>
        </div>
      </div>

      {error && <div style={{ background: '#fdecea', color: '#b42318', border: '1px solid #f5c2c0', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>{error}</div>}

      <FilterCard
        titulo="Filtros de análisis"
        resultado={`${view.rows.length} resultado${view.rows.length === 1 ? '' : 's'}`}
        onLimpiar={() => setFilters(definition.defaultFilters)}
      >
        <FilterItem label="Fecha desde"><input type="date" value={filters.fechaDesde} onChange={event => updateFilter('fechaDesde', event.target.value)} style={filterInputStyle} /></FilterItem>
        <FilterItem label="Fecha hasta"><input type="date" value={filters.fechaHasta} onChange={event => updateFilter('fechaHasta', event.target.value)} style={filterInputStyle} /></FilterItem>
        <FilterItem label="Cliente">
          <select value={filters.clienteId} onChange={event => updateFilter('clienteId', event.target.value)} style={filterInputStyle}>
            <option value="">Todos</option>
            {catalogs.clientes.map(item => <option key={item.id} value={item.id}>{entityName(item)}</option>)}
          </select>
        </FilterItem>
        <FilterItem label="Usuario">
          <select value={filters.usuarioId} onChange={event => updateFilter('usuarioId', event.target.value)} style={filterInputStyle}>
            <option value="">Todos</option>
            {catalogs.usuarios.map(item => <option key={item.id} value={item.id}>{entityName(item)}</option>)}
          </select>
        </FilterItem>
        <FilterItem label="Sucursal">
          <select value={filters.sucursalId} onChange={event => updateFilter('sucursalId', event.target.value)} style={filterInputStyle}>
            <option value="">Todas</option>
            {catalogs.sucursales.map(item => <option key={item.id} value={item.id}>{entityName(item)}</option>)}
          </select>
        </FilterItem>
        <FilterItem label="Estado">
          <select value={filters.estado} onChange={event => updateFilter('estado', event.target.value)} style={filterInputStyle}>
            <option value="">Todos</option><option value="PAGADA">Pagada</option><option value="PENDIENTE">Pendiente</option><option value="ANULADA">Anulada</option>
          </select>
        </FilterItem>
        <FilterItem label="Buscar factura"><input value={filters.buscarFactura} onChange={event => updateFilter('buscarFactura', event.target.value)} style={filterInputStyle} placeholder="Número de factura" /></FilterItem>
        <FilterItem label="Buscar cliente"><input value={filters.buscarCliente} onChange={event => updateFilter('buscarCliente', event.target.value)} style={filterInputStyle} placeholder="Nombre del cliente" /></FilterItem>
        <FilterItem label="Tipo de movimiento">
          <select value={filters.tipoTransaccion} onChange={event => updateFilter('tipoTransaccion', event.target.value)} style={filterInputStyle}>
            {definition.transactionTypes.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </FilterItem>
        <FilterItem label={filters.tipoTransaccion === 'COBROS' ? 'Método del cobro' : 'Método de pago'}>
          <select value={filters.metodoPago} onChange={event => updateFilter('metodoPago', event.target.value)} style={filterInputStyle}>
            <option value="">Todos</option>
            {paymentOptions.map(option => <option key={option} value={option}>{option.charAt(0) + option.slice(1).toLowerCase()}</option>)}
          </select>
        </FilterItem>
        <FilterItem label="Vista">
          <select value={filters.vista} onChange={event => updateFilter('vista', event.target.value)} style={filterInputStyle}>
            {definition.views.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </FilterItem>
      </FilterCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {summary.map(stat => <StatCard key={stat.label} {...stat} icon={createElement(stat.icon, { size: 20 })} />)}
      </div>

      <TableCard
        loading={loading}
        empty={!loading && view.rows.length === 0}
        emptyText="No existen transacciones para los filtros seleccionados."
        page={page}
        hasNext={hasNext}
        onPrevPage={() => setPage(current => Math.max(current - 1, 0))}
        onNextPage={() => setPage(current => current + 1)}
        hidePagination={view.rows.length <= PAGE_SIZE}
        header={<strong>{definition.views.find(option => option.value === filters.vista)?.label}</strong>}
      >
        <table>
          <thead><tr>{view.columns.map(column => <th key={column.key}>{column.label}</th>)}</tr></thead>
          <tbody>
            {pageRows.map(row => (
              <tr key={row.id}>
                {view.columns.map(column => <td key={column.key}>{formatValue(row[column.key], column.type)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}
