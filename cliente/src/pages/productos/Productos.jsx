import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const VACIO = { codigo: '', nombre: '', descripcion: '', precio: '', stock: '', stockMinimo: '', proveedorId: '', activo: true };

export default function Productos() {
  const { isAdmin } = useAuth();
  const [lista, setLista] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [proveedores, setProveedores] = useState([]);

  const cargar = useCallback(async () => {
    setLoading(true);
    const url = buscar ? `/producto/lista?buscar=${encodeURIComponent(buscar)}` : '/producto/lista';
    const res = await api.get(url);
    if (res.ok) setLista(res.data.resultado || []);
    setLoading(false);
  }, [buscar]);

  useEffect(() => { const t = setTimeout(cargar, 300); return () => clearTimeout(t); }, [cargar]);
  useEffect(() => {
    api.get('/proveedor/lista').then(r => { if (r.ok) setProveedores(r.data.resultado || []); });
  }, []);

  function abrirNuevo() { setForm(VACIO); setEditando(null); setError(''); setModal(true); }
  function abrirEditar(p) {
    setForm({ codigo: p.codigo, nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, stock: p.stock, stockMinimo: p.stock_minimo || '', proveedorId: p.proveedor_id || '', activo: p.activo });
    setEditando(p.id); setError(''); setModal(true);
  }
  function cerrar() { setModal(false); }
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function guardar(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = editando
        ? await api.put('/producto/editar', { id: editando, ...form })
        : await api.post('/producto/crear', form);
      if (res.ok) { cerrar(); cargar(); }
      else setError(res.data.mensaje || 'Error al guardar');
    } catch { setError('Error de conexión'); }
    finally { setSaving(false); }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    const res = await api.delete('/producto/eliminar', { id });
    if (res.ok) cargar();
  }

  function stockColor(p) {
    if (p.stock <= 0) return '#e74c3c';
    if (p.stock_minimo && p.stock <= p.stock_minimo) return '#f39c12';
    return '#27ae60';
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Productos</h1>
          <p className="page-subtitle">Catálogo de productos</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo producto</button>}
      </div>

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
              <thead><tr><th>Código</th><th>Nombre</th><th>Precio</th><th>Stock</th><th>Estado</th>{isAdmin && <th>Acciones</th>}</tr></thead>
              <tbody>
                {lista.length === 0
                  ? <tr><td colSpan={6} className="empty-state">Sin resultados</td></tr>
                  : lista.map(p => (
                    <tr key={p.id}>
                      <td><code style={{ background: '#f0f4ff', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{p.codigo}</code></td>
                      <td><strong>{p.nombre}</strong><br/><small style={{ color: 'var(--text-secondary)' }}>{p.descripcion}</small></td>
                      <td>${parseFloat(p.precio).toFixed(2)}</td>
                      <td><span style={{ fontWeight: 700, color: stockColor(p) }}>{p.stock}</span></td>
                      <td><span className={`chip ${p.activo ? 'chip-active' : 'chip-inactive'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span></td>
                      {isAdmin && (
                        <td style={{ display: 'flex', gap: 4 }}>
                          <button className="btn-icon" onClick={() => abrirEditar(p)} title="Editar">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button className="btn-icon danger" onClick={() => eliminar(p.id)} title="Eliminar">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
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

      {modal && (
        <div className="modal-overlay" onClick={cerrar}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editando ? 'Editar producto' : 'Nuevo producto'}</span>
              <button className="btn-icon" onClick={cerrar}>✕</button>
            </div>
            <form onSubmit={guardar}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Código *</label>
                    <input className="form-control" name="codigo" value={form.codigo} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input className="form-control" name="nombre" value={form.nombre} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Precio *</label>
                    <input className="form-control" type="number" step="0.01" name="precio" value={form.precio} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock</label>
                    <input className="form-control" type="number" name="stock" value={form.stock} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock mínimo</label>
                    <input className="form-control" type="number" name="stockMinimo" value={form.stockMinimo} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Proveedor</label>
                    <select className="form-control" name="proveedorId" value={form.proveedorId} onChange={handleChange}>
                      <option value="">Sin proveedor</option>
                      {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Descripción</label>
                    <textarea className="form-control" name="descripcion" value={form.descripcion} onChange={handleChange} rows={2} />
                  </div>
                  <div className="form-group" style={{ justifyContent: 'center' }}>
                    <label className="form-label">Activo</label>
                    <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} style={{ width: 18, height: 18 }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={cerrar}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
