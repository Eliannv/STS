import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import FormModal from '../../components/common/FormModal';

const VACIO = { codigo: '', nombre: '', direccion: '', telefono: '', email: '', activo: true };

export default function Sucursales() {
  const { isAdmin } = useAuth();
  const [lista, setLista] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [verInactivas, setVerInactivas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await api.get(`/sucursales?incluirInactivas=${verInactivas}`);
    if (res.ok) setLista(res.data.resultado || []);
    setLoading(false);
  }, [verInactivas]);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = lista.filter(s =>
    `${s.codigo} ${s.nombre}`.toLowerCase().includes(buscar.toLowerCase())
  );

  function abrirNuevo() { setForm(VACIO); setEditando(null); setError(''); setModal(true); }
  function abrirEditar(s) {
    setForm({
      codigo: s.codigo, nombre: s.nombre, direccion: s.direccion || '',
      telefono: s.telefono || '', email: s.email || '', activo: s.activo,
    });
    setEditando(s); setError(''); setModal(true);
  }
  function cerrar() { setModal(false); }
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function guardar(e) {
    e.preventDefault(); setSaving(true); setError(''); setAviso('');
    try {
      const res = editando
        ? await api.put('/sucursal/editar', { id: editando.id, ...form })
        : await api.post('/sucursal/crear', form);
      if (res.ok) { cerrar(); cargar(); }
      else setError(res.data?.resultado || res.data?.mensaje || 'Error al guardar');
    } catch { setError('Error de conexión'); }
    finally { setSaving(false); }
  }

  // El backend rechaza desactivar la matriz o una sucursal con personal asignado;
  // el motivo se muestra tal cual para que el usuario sepa qué corregir.
  async function desactivar(s) {
    if (!confirm(`¿Desactivar la sucursal "${s.nombre}"?`)) return;
    setError(''); setAviso('');
    const res = await api.delete('/sucursal/eliminar', { id: s.id });
    if (res.ok) { setAviso(`Sucursal "${s.nombre}" desactivada.`); cargar(); }
    else setAviso(res.data?.resultado || 'No se pudo desactivar la sucursal');
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sucursales</h1>
          <p className="page-subtitle">Cada sucursal opera su propio stock, caja chica y facturación</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={abrirNuevo}>+ Nueva sucursal</button>}
      </div>

      {aviso && <div className="alert alert-error" style={{ marginBottom: 12 }}>{aviso}</div>}

      <div className="card">
        <div className="card-header">
          <span className="card-title">{filtrados.length} sucursales</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={verInactivas} onChange={e => setVerInactivas(e.target.checked)} />
              Ver inactivas
            </label>
            <div className="search-bar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input placeholder="Buscar por código o nombre..." value={buscar} onChange={e => setBuscar(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="table-container">
          {loading ? <div className="spinner-wrapper"><div className="spinner"/></div> : (
            <table>
              <thead><tr><th>Código</th><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Estado</th>{isAdmin && <th>Acciones</th>}</tr></thead>
              <tbody>
                {filtrados.length === 0
                  ? <tr><td colSpan={6} className="empty-state">Sin resultados</td></tr>
                  : filtrados.map(s => (
                    <tr key={s.id} style={{ opacity: s.activo ? 1 : 0.55 }}>
                      <td><code style={{ background: '#f0f4ff', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{s.codigo}</code></td>
                      <td>
                        <strong>{s.nombre}</strong>
                        {s.es_matriz && (
                          <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, letterSpacing: '.5px', background: '#eef2ff', color: '#4338ca', padding: '2px 6px', borderRadius: 4 }}>
                            MATRIZ
                          </span>
                        )}
                      </td>
                      <td>{s.telefono || '—'}</td>
                      <td>{s.email || '—'}</td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, color: s.activo ? '#15803d' : '#b91c1c' }}>
                          {s.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td style={{ display: 'flex', gap: 4 }}>
                          <button className="btn-icon" onClick={() => abrirEditar(s)} title="Editar">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          {/* La matriz no se puede desactivar: es el destino de los datos sin sucursal. */}
                          {!s.es_matriz && s.activo && (
                            <button className="btn-icon danger" onClick={() => desactivar(s)} title="Desactivar">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            </button>
                          )}
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

      {modal && (() => {
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
                  <span style={{ fontWeight: 600 }}>Sucursal</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Estado:</span>
                  <span style={{ fontWeight: 600, color: form.activo ? 'var(--success-color)' : '#b91c1c' }}>
                    {form.activo ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>¿Es matriz?:</span>
                  <span style={{ fontWeight: 600 }}>{editando?.es_matriz ? 'Sí' : 'No'}</span>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Datos Requeridos</span>
              </div>
              {['Código único (guardado en mayúsculas)', 'Nombre descriptivo', 'Datos de contacto', 'Dirección opcional'].map(txt => (
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
          abierto={modal}
          titulo={editando ? 'Editar sucursal' : 'Nueva sucursal'}
          subtitulo={editando ? 'Modifique los datos de la sucursal' : 'Cree una nueva sucursal operativa'}
          onCerrar={cerrar}
          onSubmit={guardar}
          saving={saving}
          saveLabel="Guardar"
          error={error}
          rightPanel={rightPanel}
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Código *</label>
              <input className="form-control" name="codigo" value={form.codigo} onChange={handleChange} required placeholder="S001" maxLength={20} />
              <small style={{ fontSize: 11, color: '#64748b' }}>Se guarda en mayúsculas y debe ser único.</small>
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
            {editando && !editando.es_matriz && (
              <div className="form-group full">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
                  Sucursal activa
                </label>
              </div>
            )}
            {editando?.es_matriz && (
              <div className="form-group full">
                <small style={{ fontSize: 12, color: '#64748b' }}>
                  Esta es la sucursal matriz: no puede desactivarse.
                </small>
              </div>
            )}
          </div>
        </FormModal>
        );
      })()}
    </div>
  );
}
