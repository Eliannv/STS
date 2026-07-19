import { useState, useEffect } from 'react';
import { api } from '../../api/api';
import FormModal from '../common/FormModal';

const VACIO = { nombre: '', apellido: '', email: '', password: '', cedula: '', rol: 'OPERADOR', activo: true, sucursalId: '' };

export default function UsuarioFormModal({ abierto, editando, usuarioInicial, onCerrar, onGuardado }) {
  const [form, setForm] = useState(VACIO);
  const [sucursales, setSucursales] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/sucursal/lista').then(res => {
      if (res.ok) setSucursales(res.data.resultado || []);
    });
  }, []);

  useEffect(() => {
    if (!abierto) return;
    if (editando && usuarioInicial) {
      setForm({
        nombre: usuarioInicial.nombre || '',
        apellido: usuarioInicial.apellido || '',
        email: usuarioInicial.email || '',
        password: '',
        cedula: usuarioInicial.cedula || '',
        rol: usuarioInicial.rol || 'OPERADOR',
        activo: usuarioInicial.activo ?? true,
        sucursalId: usuarioInicial.sucursal_id || '',
      });
    } else {
      setForm(VACIO);
    }
    setError('');
  }, [abierto, editando, usuarioInicial]);

  if (!abierto) return null;

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function guardar(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = editando
        ? await api.put('/usuario/editar', { id: editando, ...form })
        : await api.post('/usuario/crear', form);
      if (res.ok) { onGuardado(); onCerrar(); }
      else setError(res.data?.resultado || res.data?.mensaje || 'Error al guardar');
    } catch { setError('Error de conexión'); }
    finally { setSaving(false); }
  }

  const rightPanel = (
    <>
      <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Información</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Tipo:</span>
            <span style={{ fontWeight: 600 }}>Usuario</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Rol:</span>
            <span style={{ fontWeight: 600 }}>{form.rol}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Estado:</span>
            <span style={{ fontWeight: 600, color: form.activo ? 'var(--success-color)' : 'var(--danger-color)' }}>
              {form.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Datos Requeridos</span>
        </div>
        {[
          'Nombre y apellido',
          'Email válido',
          editando ? 'Contraseña (solo si cambia)' : 'Contraseña segura',
          'Rol y sucursal asignada',
        ].map(txt => (
          <div key={txt} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 9, fontSize: 12, color: 'var(--text-secondary)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" strokeWidth="2.5" style={{ marginTop: 1, flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
            {txt}
          </div>
        ))}
      </div>
    </>
  );

  return (
    <FormModal
      abierto={abierto}
      titulo={editando ? 'Editar usuario' : 'Nuevo usuario'}
      subtitulo={editando ? 'Modifica los datos del usuario' : 'Registra un nuevo usuario en el sistema'}
      onCerrar={onCerrar}
      onSubmit={guardar}
      saving={saving}
      saveLabel={editando ? 'Guardar Cambios' : 'Guardar Usuario'}
      error={error}
      rightPanel={rightPanel}
    >
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Nombre *</label>
          <input className="form-control" name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Ej. Juan" />
        </div>
        <div className="form-group">
          <label className="form-label">Apellido *</label>
          <input className="form-control" name="apellido" value={form.apellido} onChange={handleChange} required placeholder="Ej. Pérez" />
        </div>
        <div className="form-group full">
          <label className="form-label">Email *</label>
          <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required placeholder="ejemplo@correo.com" />
        </div>
        {!editando && (
          <div className="form-group full">
            <label className="form-label">Contraseña *</label>
            <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} required placeholder="••••••••" />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Cédula</label>
          <input className="form-control" name="cedula" value={form.cedula} onChange={handleChange} placeholder="Ej. 1234567890" />
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
    </FormModal>
  );
}
