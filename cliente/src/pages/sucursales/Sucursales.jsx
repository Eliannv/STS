import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const VACIO = { codigo: '', nombre: '', direccion: '', telefono: '', email: '' };

export default function Sucursales() {
  const { isAdmin } = useAuth();
  const [lista, setLista] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await api.get('/sucursal/lista');
    if (res.ok) setLista(res.data.resultado || []);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = lista.filter(s =>
    `${s.codigo} ${s.nombre}`.toLowerCase().includes(buscar.toLowerCase())
  );

  function abrirNuevo() { setForm(VACIO); setEditando(null); setError(''); setModal(true); }
  function abrirEditar(s) {
    setForm({ codigo: s.codigo, nombre: s.nombre, direccion: s.direccion || '', telefono: s.telefono || '', email: s.email || '' });
    setEditando(s.id); setError(''); setModal(true);
  }
  function cerrar() { setModal(false); }
  function handleChange(e) { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); }

  async function guardar(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = editando
        ? await api.put('/sucursal/editar', { id: editando, ...form })
        : await api.post('/sucursal/crear', form);
      if (res.ok) { cerrar(); cargar(); }
      else setError(res.data.mensaje || 'Error al guardar');
    } catch { setError('Error de conexión'); }
    finally { setSaving(false); }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta sucursal?')) return;
    const res = await api.delete('/sucursal/eliminar', { id });
    if (res.ok) cargar();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sucursales</h1>
          <p className="page-subtitle">Gestión de sucursales</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={abrirNuevo}>+ Nueva sucursal</button>}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">{filtrados.length} sucursales</span>
          <div className="search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input placeholder="Buscar por código o nombre..." value={buscar} onChange={e => setBuscar(e.target.value)} />
          </div>
        </div>
        <div className="table-container">
          {loading ? <div className="spinner-wrapper"><div className="spinner"/></div> : (
            <table>
              <thead><tr><th>Código</th><th>Nombre</th><th>Teléfono</th><th>Email</th>{isAdmin && <th>Acciones</th>}</tr></thead>
              <tbody>
                {filtrados.length === 0
                  ? <tr><td colSpan={5} className="empty-state">Sin resultados</td></tr>
                  : filtrados.map(s => (
                    <tr key={s.id}>
                      <td><code style={{ background: '#f0f4ff', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{s.codigo}</code></td>
                      <td><strong>{s.nombre}</strong></td>
                      <td>{s.telefono || '—'}</td>
                      <td>{s.email || '—'}</td>
                      {isAdmin && (
                        <td style={{ display: 'flex', gap: 4 }}>
                          <button className="btn-icon" onClick={() => abrirEditar(s)} title="Editar">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button className="btn-icon danger" onClick={() => eliminar(s.id)} title="Eliminar">
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
              <span className="modal-title">{editando ? 'Editar sucursal' : 'Nueva sucursal'}</span>
              <button className="btn-icon" onClick={cerrar}>✕</button>
            </div>
            <form onSubmit={guardar}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Código *</label>
                    <input className="form-control" name="codigo" value={form.codigo} onChange={handleChange} required placeholder="S001" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input className="form-control" name="nombre" value={form.nombre} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input className="form-control" name="telefono" value={form.telefono} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Dirección</label>
                    <input className="form-control" name="direccion" value={form.direccion} onChange={handleChange} />
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
