import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import ProductoFormModal from '../../components/productos/ProductoFormModal';

export default function Productos() {
  const { isAdmin } = useAuth();
  const navigate    = useNavigate();
  const [lista, setLista]       = useState([]);
  const [buscar, setBuscar]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editando, setEditando] = useState(null);
  const [productoSel, setProductoSel] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const url = buscar
      ? `/producto/lista?buscar=${encodeURIComponent(buscar)}`
      : '/producto/lista';
    const res = await api.get(url);
    if (res.ok) setLista(res.data.resultado || []);
    setLoading(false);
  }, [buscar]);

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
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => navigate('/ingresos/nuevo')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
              <line x1="12" y1="22" x2="12" y2="12"/><line x1="3.3" y1="7" x2="12" y2="12"/><line x1="20.7" y1="7" x2="12" y2="12"/>
            </svg>
            Nuevo ingreso
          </button>
        )}
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
          <span className="card-title">{lista.length} productos</span>
          <div className="search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input placeholder="Buscar por código o nombre..." value={buscar} onChange={e => setBuscar(e.target.value)} />
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
                {lista.length === 0
                  ? <tr><td colSpan={8} className="empty-state">Sin resultados</td></tr>
                  : lista.map(p => (
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
