import { useState, useEffect } from 'react';
import { api } from '../../api/api';

const PROVINCIAS_EC = ['Azuay','Bolívar','Cañar','Carchi','Chimborazo','Cotopaxi','El Oro','Esmeraldas','Galápagos','Guayas','Imbabura','Loja','Los Ríos','Manabí','Morona Santiago','Napo','Orellana','Pastaza','Pichincha','Santa Elena','Santo Domingo de los Tsáchilas','Sucumbíos','Tungurahua','Zamora Chinchipe'];

const VACIO = {
  nombres: '', apellidos: '', cedula: '', telefono: '',
  email: '', fechaNacimiento: '', pais: 'Ecuador',
  provincia: '', ciudad: '', direccion: '',
};

/**
 * Modal reutilizable para crear o editar un cliente.
 *
 * Props:
 *   abierto        {boolean}       — controla visibilidad
 *   editando       {number|null}   — id del cliente (null = nuevo)
 *   clienteInicial {object|null}   — datos del cliente para edición
 *   onCerrar       {() => void}
 *   onGuardado     {() => void}    — se llama tras guardar con éxito
 */
export default function ClienteFormModal({ abierto, editando, clienteInicial, onCerrar, onGuardado }) {
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    if (editando && clienteInicial) {
      setForm({
        nombres:        clienteInicial.nombres        || '',
        apellidos:      clienteInicial.apellidos      || '',
        cedula:         clienteInicial.cedula         || '',
        telefono:       clienteInicial.telefono       || '',
        email:          clienteInicial.email          || '',
        fechaNacimiento: clienteInicial.fecha_nacimiento
          ? clienteInicial.fecha_nacimiento.slice(0, 10) : '',
        pais:       clienteInicial.pais      || 'Ecuador',
        provincia:  clienteInicial.provincia || '',
        ciudad:     clienteInicial.ciudad    || '',
        direccion:  clienteInicial.direccion || '',
      });
    } else {
      setForm(VACIO);
    }
    setError('');
  }, [abierto, editando, clienteInicial]);

  if (!abierto) return null;

  function handleChange(e) { setForm(p => ({ ...p, [e.target.name]: e.target.value })); }

  async function guardar(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = editando
        ? await api.put('/cliente/editar', { id: editando, ...form })
        : await api.post('/cliente/crear', form);
      if (res.ok) { onGuardado(); onCerrar(); }
      else setError(res.data?.mensaje || 'Error al guardar');
    } catch { setError('Error de conexión'); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 900, width: '95vw' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{editando ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
              {editando ? 'Modifica los datos del cliente' : 'Registra un nuevo cliente en el sistema'}
            </p>
          </div>
          <button className="btn-icon" onClick={onCerrar} style={{ marginTop: 2 }}>✕</button>
        </div>

        <form onSubmit={guardar}>
          <div style={{ display: 'flex', gap: 0 }}>
            {/* Panel izquierdo */}
            <div style={{ flex: 1, padding: '24px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 24 }}>
              {error && <div className="alert alert-error">{error}</div>}

              {/* Información Personal */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Información Personal</span>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Nombres</label>
                    <input className="form-control" name="nombres" value={form.nombres} onChange={handleChange} required placeholder="Ej. Juan Carlos" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Apellidos</label>
                    <input className="form-control" name="apellidos" value={form.apellidos} onChange={handleChange} required placeholder="Ej. Pérez García" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cédula</label>
                    <input className="form-control" name="cedula" value={form.cedula} onChange={handleChange} placeholder="Ej. 1234567890" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input className="form-control" name="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej. 0987654321" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Correo Electrónico</label>
                    <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} placeholder="ejemplo@correo.com o N/A" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha de Nacimiento</label>
                    <input className="form-control" type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange} />
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Ubicación</span>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">País</label>
                    <input className="form-control" name="pais" value={form.pais} onChange={handleChange} placeholder="Ecuador" style={{ background: '#f8f9fa', color: 'var(--text-secondary)' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Provincia</label>
                    <select className="form-control" name="provincia" value={form.provincia} onChange={handleChange}>
                      <option value="">Seleccione una provincia</option>
                      {PROVINCIAS_EC.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ciudad</label>
                    <input className="form-control" name="ciudad" value={form.ciudad} onChange={handleChange} placeholder="Ej. Quito" />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: 14 }}>
                  <label className="form-label">Dirección</label>
                  <textarea className="form-control" name="direccion" value={form.direccion} onChange={handleChange} rows={3} placeholder="Ej. Av. Principal y Calle Secundaria" style={{ resize: 'vertical' }} />
                </div>
              </div>
            </div>

            {/* Panel derecho */}
            <div style={{ width: 220, flexShrink: 0, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--bg-secondary)' }}>
              <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>Información</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tipo:</span>
                    <span style={{ fontWeight: 600 }}>Cliente</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Estado:</span>
                    <span style={{ fontWeight: 600, color: 'var(--success-color)' }}>Activo</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Región:</span>
                    <span style={{ fontWeight: 600 }}>Ecuador</span>
                  </div>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>Datos Requeridos</span>
                </div>
                {['Cédula única y válida', 'Ubicación completa', 'Datos de contacto actualizados', 'En caso de no tener correo escribir N/A'].map(txt => (
                  <div key={txt} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" strokeWidth="2.5" style={{ marginTop: 1, flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                    {txt}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-ghost" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 130 }}>
              {saving ? 'Guardando...' : (editando ? 'Guardar Cambios' : 'Guardar Cliente')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
