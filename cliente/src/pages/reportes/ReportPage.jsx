import { BarChart3, FileSpreadsheet, FileText } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { generarReporte } from '../../api/reportesApi';
import FilterCard, { FilterItem, filterInputStyle } from '../../components/common/FilterCard';
import StatCard from '../../components/common/StatCard';
import TableCard from '../../components/common/TableCard';
import reportsConfig from '../../config/reportes/reports.config';

const INITIAL_PAGINATION = { page: 1, pageSize: 20 };

function labelFromKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, character => character.toUpperCase());
}

function formatCell(value, column) {
  if (value === null || value === undefined || value === '') return '—';
  if (column.type === 'currency') {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
  }
  if (column.type === 'number') return new Intl.NumberFormat('es-EC').format(Number(value) || 0);
  if (column.type === 'date' || column.type === 'datetime') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('es-EC');
  }
  return String(value);
}

function FilterControl({ filter, value, onChange }) {
  const commonProps = {
    value: value ?? '',
    onChange: event => onChange(event.target.value),
    style: filterInputStyle,
  };

  if (filter.type === 'select') {
    return (
      <select {...commonProps}>
        {(filter.options || []).map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  }

  return (
    <input
      {...commonProps}
      type={filter.type === 'number' ? 'number' : filter.type === 'date' ? 'date' : 'text'}
      placeholder={filter.type === 'entity' ? `ID de ${filter.label.toLowerCase()}` : undefined}
    />
  );
}

function ReportTable({ columns, rows }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead style={{ background: '#f8f9fa' }}>
        <tr>
          {columns.map(column => (
            <th
              key={column.key}
              style={{
                padding: '10px 14px',
                textAlign: column.align || 'left',
                fontWeight: 700,
                color: '#6c757d',
                borderBottom: '2px solid #dee2e6',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: 0.4,
                whiteSpace: 'nowrap',
              }}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={row.id ?? row.numeroFactura ?? rowIndex} style={{ borderBottom: '1px solid #f0f2f5' }}>
            {columns.map(column => (
              <td key={column.key} style={{ padding: '10px 14px', textAlign: column.align || 'left' }}>
                {formatCell(row[column.key], column)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ReportPage() {
  const { categoria, reporte } = useParams();
  const definition = reportsConfig[categoria]?.[reporte];
  const [filters, setFilters] = useState(() => ({ ...(definition?.defaultFilters || {}) }));
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filterDefinitions = useMemo(() => definition?.filters || [], [definition]);

  useEffect(() => {
    setFilters({ ...(definition?.defaultFilters || {}) });
    setPagination(INITIAL_PAGINATION);
    setReportData(null);
  }, [definition]);

  useEffect(() => {
    if (!definition) return undefined;
    let activo = true;

    async function cargar() {
      setLoading(true);
      setError('');
      try {
        const respuesta = await generarReporte({ endpoint: definition.endpoint, filtros: filters, paginacion: pagination });
        if (!activo) return;
        setReportData(respuesta.report);
      } catch (requestError) {
        if (activo) setError(requestError.message || 'No se pudo generar el reporte.');
      } finally {
        if (activo) setLoading(false);
      }
    }

    cargar();
    return () => { activo = false; };
  }, [definition, filters, pagination]);

  if (!definition) return <Navigate to="/reportes" replace />;

  function actualizarFiltro(key, value) {
    setFilters(previous => ({ ...previous, [key]: value }));
    setPagination(previous => ({ ...previous, page: 1 }));
  }

  function limpiarFiltros() {
    setFilters({ ...(definition.defaultFilters || {}) });
    setPagination(INITIAL_PAGINATION);
  }

  const columns = reportData?.columns || [];
  const rows = reportData?.rows || [];
  const pageInfo = reportData?.pagination || { ...pagination, totalRows: 0, totalPages: 0 };
  const summary = reportData?.summary || {};
  const summaryMetadata = definition.summary || [];

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">{definition.title}</h1>
          <p className="page-subtitle">{definition.description}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {definition.exportable?.pdf && <button type="button" className="btn btn-secondary btn-sm" disabled title="Exportación PDF próximamente"><FileText size={14} /> PDF</button>}
          {definition.exportable?.excel && <button type="button" className="btn btn-secondary btn-sm" disabled title="Exportación Excel próximamente"><FileSpreadsheet size={14} /> Excel</button>}
        </div>
      </div>

      {error && (
        <div style={{ background: '#fdecea', color: '#b42318', border: '1px solid #f5c2c0', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <FilterCard
        titulo="Filtros"
        onLimpiar={limpiarFiltros}
        resultado={reportData ? `${pageInfo.totalRows} registros encontrados` : undefined}
      >
        {filterDefinitions.map(filter => (
          <FilterItem key={filter.key} label={filter.label}>
            <FilterControl filter={filter} value={filters[filter.key]} onChange={value => actualizarFiltro(filter.key, value)} />
          </FilterItem>
        ))}
      </FilterCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {Object.entries(summary).map(([key, value]) => {
          const metadata = summaryMetadata.find(item => item.key === key);
          return (
            <StatCard
              key={key}
              icon={<BarChart3 size={20} />}
              label={metadata?.label || labelFromKey(key)}
              value={formatCell(value, { type: metadata?.type || 'text' })}
              color={metadata?.color || '#3498db'}
            />
          );
        })}
      </div>

      <TableCard
        loading={loading}
        empty={!loading && rows.length === 0}
        emptyText="No se encontraron registros para los filtros seleccionados."
        loadingText="Generando reporte..."
        page={Math.max((pageInfo.page || 1) - 1, 0)}
        hasNext={(pageInfo.page || 1) < (pageInfo.totalPages || 0)}
        onPrevPage={() => setPagination(previous => ({ ...previous, page: Math.max(previous.page - 1, 1) }))}
        onNextPage={() => setPagination(previous => ({ ...previous, page: previous.page + 1 }))}
        header={<strong>{definition.shortTitle}</strong>}
      >
        <ReportTable columns={columns} rows={rows} />
      </TableCard>
    </div>
  );
}
