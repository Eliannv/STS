import { useState, useEffect } from 'react';
import { api } from '../../api/api';
import FormModal, { FormSection } from '../common/FormModal';

const PROVINCIAS_EC = ['Azuay','Bolívar','Cañar','Carchi','Chimborazo','Cotopaxi','El Oro','Esmeraldas','Galápagos','Guayas','Imbabura','Loja','Los Ríos','Manabí','Morona Santiago','Napo','Orellana','Pastaza','Pichincha','Santa Elena','Santo Domingo de los Tsáchilas','Sucumbíos','Tungurahua','Zamora Chinchipe'];

const VACIO = {
  nombres: '', apellidos: '', cedula: '', telefono: '',
  email: '', fechaNacimiento: '', pais: 'Ecuador',
  provincia: '', ciudad: '', direccion: '',
};

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
    </>
  );

  return (
    <FormModal
      abierto={abierto}
      titulo={editando ? 'Editar Cliente' : 'Nuevo Cliente'}
      subtitulo={editando ? 'Modifica los datos del cliente' : 'Registra un nuevo cliente en el sistema'}
      onCerrar={onCerrar}
      onSubmit={guardar}
      saving={saving}
      saveLabel={editando ? 'Guardar Cambios' : 'Guardar Cliente'}
      error={error}
      rightPanel={rightPanel}
    >
      <FormSection icon={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} title="Información Personal">
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
      </FormSection>

      <FormSection icon={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>} title="Ubicación">
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
      </FormSection>
    </FormModal>
  );
}
