import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import ProductoFormModal from '../../components/productos/ProductoFormModal';
import FilterCard, { FilterItem, filterInputStyle } from '../../components/common/FilterCard';
import TableCard from '../../components/common/TableCard';
import { exportarProductosExcel } from '../../utils/exportarExcel';

export default function Productos() {
  const { isAdmin } = useAuth();
  const navigate    = useNavigate();
  const [lista, setLista]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [buscarProd, setBuscarProd] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [filtroStock, setFiltroStock] = useState('');
  const [orden, setOrden]       = useState('codigo');
  const [modal, setModal]       = useState(false);
  const [editando, setEditando] = useState(null);
  const [productoSel, setProductoSel] = useState(null);
  const [page,    setPage]    = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const grupos = useMemo(() => [...new Set(lista.map(p => p.grupo).filter(Boolean))].sort(), [lista]);
  const proveedores = useMemo(() => [...new Set(lista.map(p => p.proveedor_nombre).filter(Boolean))].sort(), [lista]);

  const cargar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (buscarProd.trim()) {
      // Con búsqueda: traer todos los coincidentes (sin paginar)
      params.set('buscar', buscarProd.trim());
      params.set('limit', '9999');
      params.set('offset', '0');
    } else {
      // Sin búsqueda: paginar server-side (LIMIT+1 para detectar página siguiente)
      params.set('limit', '21');
      params.set('offset', String(page * 20));
    }
    const res = await api.get(`/producto/lista?${params}`);
    if (res.ok) {
      const data = res.data.resultado || [];
      if (buscarProd.trim()) {
        setHasNext(false);
        setLista(data);              // resultados de búsqueda completos
      } else {
        setHasNext(data.length > 20);
        setLista(data.slice(0, 20)); // solo 20 en memoria — libera el resto
      }
    }
    setLoading(false);
  }, [buscarProd, page]);

  // Resetear página cuando cambia el término de búsqueda
  useEffect(() => { setPage(0); }, [buscarProd]);
  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = useMemo(() => {
    // buscarProd ya se aplica en el servidor — aquí solo filtros locales sobre la página cargada
    let l = lista;
    if (filtroGrupo)     l = l.filter(p => p.grupo === filtroGrupo);
    if (filtroProveedor) l = l.filter(p => p.proveedor_nombre === filtroProveedor);
    if (filtroStock === 'con') l = l.filter(p => (p.stock ?? 0) > 0);
    if (filtroStock === 'sin') l = l.filter(p => (p.stock ?? 0) <= 0);

    const copia = [...l];
    if (orden === 'recientes') {
      copia.sort((a, b) => {
        const da = new Date(a.created_at || 0);
        const db = new Date(b.created_at || 0);
        return db - da;
      });
    } else {
      copia.sort((a, b) => (a.codigo || '').localeCompare(b.codigo || '', 'es', { numeric: true }));
    }
    return copia;
  }, [lista, buscarProd, filtroGrupo, filtroProveedor, filtroStock, orden]);

  // Exportar siempre descarga todos los productos que coincidan con buscarProd
  async function exportar() {
    const params = new URLSearchParams();
    if (buscarProd.trim()) params.set('buscar', buscarProd.trim());
    params.set('limit', '9999');
    const res = await api.get(`/producto/lista?${params}`);
    exportarProductosExcel(res.ok ? (res.data.resultado || []) : filtrados);
  }

  function abrirEditar(p) {
    setProductoSel(p);
    setEditando(p.id);
    setModal(true);
  }

  function cerrar() { setModal(false); setEditando(null); setProductoSel(null); }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Productos</h1>
          <p className="page-subtitle">Catálogo de productos</p>
        </div>
      </div>

      {isAdmin && (
        <div style={{
          background: 'linear-gradient(135deg, #e8f4fd 0%, #d6eaf8 100%)',
          border: '1px solid #aed6f1', borderRadius: 'var(--radius-md)',
          padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 13, color: '#1a5276',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Para agregar nuevos productos al catálogo, crea un nuevo ingreso y agrega los productos desde allí.
        </div>
      )}

      <FilterCard
        titulo="Opciones de filtrado y exportación"
        onLimpiar={() => { setFiltroGrupo(''); setFiltroProveedor(''); setFiltroStock(''); setBuscarProd(''); }}
        resultado={buscarProd.trim() ? `${filtrados.length} resultado${filtrados.length !== 1 ? 's' : ''}` : `Página ${page + 1}${hasNext ? '' : ' (fin)'}`}
      >
        <FilterItem label="Buscar" span={3}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input style={{ ...filterInputStyle, paddingLeft: 30 }}
              placeholder="Nombre, código, grupo..."
              value={buscarProd} onChange={e => setBuscarProd(e.target.value)} />
          </div>
        </FilterItem>
        <FilterItem label="Grupo">
          <select value={filtroGrupo} onChange={e => setFiltroGrupo(e.target.value)} style={filterInputStyle}>
            <option value="">Todos</option>
            {grupos.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </FilterItem>
        <FilterItem label="Proveedor">
          <select value={filtroProveedor} onChange={e => setFiltroProveedor(e.target.value)} style={filterInputStyle}>
            <option value="">Todos</option>
            {proveedores.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </FilterItem>
        <FilterItem label="Stock">
          <select value={filtroStock} onChange={e => setFiltroStock(e.target.value)} style={filterInputStyle}>
            <option value="">Todos</option>
            <option value="con">Con stock</option>
            <option value="sin">Sin stock</option>
          </select>
        </FilterItem>
        <FilterItem label="Ordenar">
          <select value={orden} onChange={e => setOrden(e.target.value)} style={filterInputStyle}>
            <option value="codigo">Por código</option>
            <option value="recientes">Recientes primero</option>
          </select>
        </FilterItem>
        <FilterItem label="Exportar">
          <button onClick={exportar}
            title="Exportar a Excel"
            style={{ ...filterInputStyle, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            Excel
          </button>
        </FilterItem>
      </FilterCard>

      <TableCard
        scrollY
        loading={loading}
        empty={filtrados.length === 0}
        emptyText="Sin resultados"
        emptyColSpan={isAdmin ? 8 : 7}
        page={page}
        hasNext={hasNext}
        onPrevPage={() => setPage(p => p - 1)}
        onNextPage={() => setPage(p => p + 1)}
        hidePagination={!!buscarProd.trim()}
      >
        <table>
          <thead>
            <tr>
              <th>Código</th><th>Nombre</th><th>Grupo</th>
              <th>Costo</th><th>PVP1</th><th>Stock</th>
              <th>Estado</th>{isAdmin && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filtrados.map(p => (
              <tr key={p.id}>
                <td>
                  <code style={{ background: '#f0f4ff', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                    {p.codigo || '—'}
                  </code>
                </td>
                <td>
                  <strong>{p.nombre}</strong>
                  {p.modelo && <><br/><small style={{ color: 'var(--text-secondary)' }}>{p.modelo}{p.color ? ` · ${p.color}` : ''}</small></>}
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{p.grupo || '—'}</td>
                <td>${parseFloat(p.costo || 0).toFixed(2)}</td>
                <td>
                  ${parseFloat(p.pvp1 || 0).toFixed(2)}
                  {p.iva > 0 && <small style={{ color: 'var(--text-muted)', marginLeft: 4 }}>+{p.iva}%</small>}
                </td>
                <td><span style={{ fontWeight: 700, color: (p.stock ?? 0) > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>{p.stock ?? 0}</span></td>
                <td><span className={`chip ${p.activo ? 'chip-active' : 'chip-inactive'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span></td>
                {isAdmin && (
                  <td>
                    <button className="btn-icon" onClick={() => abrirEditar(p)} title="Editar">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <ProductoFormModal
        abierto={modal}
        editando={editando}
        productoInicial={productoSel}
        onCerrar={cerrar}
        onGuardado={() => cargar()}
      />
    </div>
  );
}
