import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import ProductoFormModal from '../../components/productos/ProductoFormModal';
import { exportarProductosExcel } from '../../utils/exportarExcel';

export default function Productos() {
  const { isAdmin } = useAuth();
  const navigate    = useNavigate();
  const [lista, setLista]       = useState([]);
  const [hasNext, setHasNext]   = useState(false);
  const [page, setPage]         = useState(0);
  const [buscar, setBuscar]     = useState('');
  const [orden, setOrden]       = useState('codigo'); // 'codigo' | 'recientes'
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editando, setEditando] = useState(null);
  const [productoSel, setProductoSel] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (buscar) params.set('buscar', buscar);
    params.set('limit', '21');
    params.set('offset', String(page * 20));
    const res = await api.get(`/producto/lista?${params}`);
    if (res.ok) {
      const data = res.data.resultado || [];
      setHasNext(data.length > 20);
      setLista(data.slice(0, 20));
    }
    setLoading(false);
  }, [buscar, page]);

  useEffect(() => { setPage(0); }, [buscar]);

  const listaOrdenada = useMemo(() => {
    const copia = [...lista];
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
  }, [lista, orden]);

  useEffect(() => { const t = setTimeout(cargar, 300); return () => clearTimeout(t); }, [cargar]);

  function abrirEditar(p) {
    setProductoSel(p);
    setEditando(p.id);
    setModal(true);
  }

  function cerrar() { setModal(false); setEditando(null); setProductoSel(null); }

  function stockColor(p) {
    if (p.stock <= 0) return 'var(--danger-color)';
    return 'var(--success-color)';
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Productos</h1>
          <p className="page-subtitle">Catálogo de productos — ordenado por código</p>
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

      <div className="card">
        <div className="card-header">

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              className="input"
              style={{ padding: '5px 10px', fontSize: 13, height: 34 }}
              value={orden}
              onChange={e => setOrden(e.target.value)}
            >
              <option value="codigo">Por código</option>
              <option value="recientes">Recientes primero</option>
            </select>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => exportarProductosExcel(listaOrdenada)}
              title="Exportar a Excel"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              Excel
            </button>
            <div className="search-bar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input placeholder="Buscar por código o nombre..." value={buscar} onChange={e => setBuscar(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="table-container">
          {loading ? <div className="spinner-wrapper"><div className="spinner"/></div> : (
            <table>
              <thead>
                <tr>
                  <th>Código</th><th>Nombre</th><th>Grupo</th>
                  <th>Costo</th><th>PVP1</th><th>Stock</th>
                  <th>Estado</th>{isAdmin && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {listaOrdenada.length === 0
                  ? <tr><td colSpan={8} className="empty-state">Sin resultados</td></tr>
                  : listaOrdenada.map(p => (
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
                      <td><span style={{ fontWeight: 700, color: stockColor(p) }}>{p.stock ?? 0}</span></td>
                      <td><span className={`chip ${p.activo ? 'chip-active' : 'chip-inactive'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span></td>
                      {isAdmin && (
                        <td>
                          <button className="btn-icon" onClick={() => abrirEditar(p)} title="Editar">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}
        </div>
        {/* Paginación */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '10px 20px', borderTop: '1px solid #e9ecef' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>← Anterior</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={!hasNext}>Siguiente →</button>
          </div>
        </div>
      </div>

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
