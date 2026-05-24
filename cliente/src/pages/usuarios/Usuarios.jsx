import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const VACIO = { nombre: '', apellido: '', email: '', password: '', cedula: '', rol: 'OPERADOR', activo: true, sucursalId: '' };

export default function Usuarios() {
  const { isAdmin } = useAuth();
  const [lista, setLista] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [sucursales, setSucursales] = useState([]);

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await api.get('/usuario/lista');
    if (res.ok) setLista(res.data.resultado || []);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => {
    api.get('/sucursal/lista').then(res => { if (res.ok) setSucursales(res.data.resultado || []); });
  }, []);

  const filtrados = lista.filter(u =>
    `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase().includes(buscar.toLowerCase())
  );

  function abrirNuevo() { setForm(VACIO); setEditando(null); setError(''); setModal(true); }
  function abrirEditar(u) {
    setForm({ nombre: u.nombre, apellido: u.apellido, email: u.email, password: '', cedula: u.cedula || '', rol: u.rol, activo: u.activo, sucursalId: u.sucursal_id || '' });
    setEditando(u.id);
    setError('');
    setModal(true);
  }
  function cerrar() { setModal(false); }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function guardar(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      let res;
      if (editando) {
        res = await api.put('/usuario/editar', { id: editando, ...form });
      } else {
        res = await api.post('/usuario/crear', form);
      }
      if (res.ok) { cerrar(); cargar(); }
      else setError(res.data.mensaje || 'Error al guardar');
    } catch { setError('Error de conexión'); }
    finally { setSaving(false); }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este usuario?')) return;
    const res = await api.delete('/usuario/eliminar', { id });
    if (res.ok) cargar();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="page-subtitle">Gestión de usuarios del sistema</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo usuario</button>}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">{filtrados.length} usuarios</span>
          <div className="search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input placeholder="Buscar por nombre o email..." value={buscar} onChange={e => setBuscar(e.target.value)} />
          </div>
        </div>
        <div className="table-container">
          {loading ? <div className="spinner-wrapper"><div className="spinner"/></div> : (
            <table>
              <thead>
                <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th>{isAdmin && <th>Acciones</th>}</tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr><td colSpan={5} className="empty-state">Sin resultados</td></tr>
                ) : filtrados.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.nombre} {u.apellido}</strong></td>
                    <td>{u.email}</td>
                    <td><span className={`chip ${u.rol === 'ADMINISTRADOR' ? 'chip-active' : ''}`}>{u.rol}</span></td>
                    <td><span className={`chip ${u.activo ? 'chip-active' : 'chip-inactive'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span></td>
                    {isAdmin && (
                      <td style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon" onClick={() => abrirEditar(u)} title="Editar">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="btn-icon danger" onClick={() => eliminar(u.id)} title="Eliminar">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={cerrar}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editando ? 'Editar usuario' : 'Nuevo usuario'}</span>
              <button className="btn-icon" onClick={cerrar}>✕</button>
            </div>
            <form onSubmit={guardar}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input className="form-control" name="nombre" value={form.nombre} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Apellido *</label>
                    <input className="form-control" name="apellido" value={form.apellido} onChange={handleChange} required />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Email *</label>
                    <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required />
                  </div>
                  {!editando && (
                    <div className="form-group full">
                      <label className="form-label">Contraseña *</label>
                      <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} required={!editando} />
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Cédula</label>
                    <input className="form-control" name="cedula" value={form.cedula} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rol</label>
                    <select className="form-control" name="rol" value={form.rol} onChange={handleChange}>
                      <option value="OPERADOR">OPERADOR</option>
                      <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sucursal</label>
                    <select className="form-control" name="sucursalId" value={form.sucursalId} onChange={handleChange}>
                      <option value="">Sin sucursal</option>
                      {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
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
