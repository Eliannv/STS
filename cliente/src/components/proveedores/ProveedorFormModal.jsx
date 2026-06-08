import { useState, useEffect } from 'react';
import { api } from '../../api/api';

const VACIO = {
  codigo: '', nombre: '', representante: '', ruc: '',
  telefonoPrincipal: '', telefonoSecundario: '', codigoLugar: '',
  direccion: '', fechaIngreso: '', saldo: '0', activo: true,
};

/**
 * Modal reutilizable para crear o editar un proveedor.
 *
 * Props:
 *   abierto           {boolean}
 *   editando          {number|null}   — id del proveedor (null = nuevo)
 *   proveedorInicial  {object|null}   — fila del proveedor para edición
 *   onCerrar          {() => void}
 *   onGuardado        {() => void}    — se llama tras guardar con éxito
 */
export default function ProveedorFormModal({ abierto, editando, proveedorInicial, onCerrar, onGuardado }) {
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    if (editando && proveedorInicial) {
      const p = proveedorInicial;
      setForm({
        codigo:            p.codigo             || '',
        nombre:            p.nombre             || '',
        representante:     p.representante      || '',
        ruc:               p.ruc                || '',
        telefonoPrincipal: p.telefono_principal || '',
        telefonoSecundario:p.telefono_secundario|| '',
        codigoLugar:       p.codigo_lugar       || '',
        direccion:         p.direccion          || '',
        fechaIngreso:      p.fecha_ingreso ? p.fecha_ingreso.slice(0, 10) : '',
        saldo:             p.saldo              ?? '0',
        activo:            p.activo             ?? true,
      });
    } else if (!editando && proveedorInicial?.nombre) {
      // Modo nuevo con nombre pre-cargado (ej. desde importación Excel)
      setForm({ ...VACIO, nombre: proveedorInicial.nombre });
    } else {
      setForm(VACIO);
    }
    setError('');
  }, [abierto, editando, proveedorInicial]);

  if (!abierto) return null;

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function guardar(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, saldo: parseFloat(form.saldo) || 0 };
      const res = editando
        ? await api.put('/proveedor/editar', { id: editando, ...payload })
        : await api.post('/proveedor/crear', payload);
      if (res.ok) { onGuardado(); onCerrar(); }
      else setError(res.data?.mensaje || 'Error al guardar');
    } catch { setError('Error de conexión'); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" onClick={e => e.stopPropagation()}
        style={{ maxWidth: 900, width: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              {editando ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
              {editando ? 'Modifica los datos del proveedor' : 'Registra un nuevo proveedor en el sistema'}
            </p>
          </div>
          <button className="btn-icon" onClick={onCerrar}>✕</button>
        </div>

        <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', gap: 0, flex: 1, minHeight: 0 }}>

            {/* ── Panel izquierdo (scrollable) ── */}
            <div style={{ flex: 1, padding: '24px', borderRight: '1px solid var(--border-color)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
              {error && <div className="alert alert-error">{error}</div>}

              {/* Información del Proveedor */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Información del Proveedor</span>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Código</label>
                    <input className="form-control" name="codigo" value={form.codigo} onChange={handleChange} placeholder="Ej. PROV-001" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">RUC *</label>
                    <input className="form-control" name="ruc" value={form.ruc} onChange={handleChange} required placeholder="Ej. 1234567890001" />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Nombre *</label>
                    <input className="form-control" name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Razón social o nombre comercial" />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Representante</label>
                    <input className="form-control" name="representante" value={form.representante} onChange={handleChange} placeholder="Nombre del representante o contacto" />
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.19 19a19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.92-8.63A2 2 0 0 1 3.07 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z"/></svg>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Contacto</span>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Teléfono Principal</label>
                    <input className="form-control" name="telefonoPrincipal" value={form.telefonoPrincipal} onChange={handleChange} placeholder="Ej. 0987654321" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono Secundario</label>
                    <input className="form-control" name="telefonoSecundario" value={form.telefonoSecundario} onChange={handleChange} placeholder="Ej. 022345678" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Código de Lugar</label>
                    <input className="form-control" name="codigoLugar" value={form.codigoLugar} onChange={handleChange} placeholder="Ej. UIO" />
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Ubicación</span>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Dirección</label>
                  <textarea className="form-control" name="direccion" value={form.direccion} onChange={handleChange} rows={3} placeholder="Dirección completa del proveedor" style={{ resize: 'vertical' }} />
                </div>
              </div>

              {/* Datos Adicionales */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Datos Adicionales</span>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Fecha de Ingreso</label>
                    <input className="form-control" type="date" name="fechaIngreso" value={form.fechaIngreso} onChange={handleChange} />
                  </div>
                  
                  {editando && (
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24 }}>
                      <input type="checkbox" id="activoCheck" name="activo" checked={form.activo} onChange={handleChange} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                      <label htmlFor="activoCheck" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Proveedor activo</label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Panel derecho ── */}
            <div style={{ width: 210, flexShrink: 0, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--bg-secondary)', overflowY: 'auto' }}>
              {/* Tarjeta Información */}
              <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>Información</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tipo:</span>
                    <span style={{ fontWeight: 600 }}>Proveedor</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Estado:</span>
                    <span style={{ fontWeight: 600, color: form.activo ? 'var(--success-color)' : 'var(--danger-color)' }}>
                      {form.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  {form.saldo !== '' && parseFloat(form.saldo) !== 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Saldo:</span>
                      <span style={{ fontWeight: 600 }}>${parseFloat(form.saldo || 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tarjeta Datos Requeridos */}
              <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>Datos Requeridos</span>
                </div>
                {[
                  'Nombre del proveedor',
                  'RUC único y válido',
                  'Datos de contacto',
                  'Saldo inicial (por defecto 0)',
                ].map(txt => (
                  <div key={txt} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 9, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" strokeWidth="2.5" style={{ marginTop: 1, flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                    {txt}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
            <button type="button" className="btn btn-ghost" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 150 }}>
              {saving ? 'Guardando...' : (editando ? 'Guardar Cambios' : 'Guardar Proveedor')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
