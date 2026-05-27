import { useState, useEffect } from 'react';
import { api } from '../../api/api';

const VACIO = {
  codigo: '', nombre: '', modelo: '', color: '', grupo: '',
  tipoControlStock: 'NORMAL', costo: '', pvp1: '', iva: '0',
  precioConIva: '', proveedorId: '', observacion: '', activo: true,
};

export default function ProductoFormModal({ abierto, editando, productoInicial, onCerrar, onGuardado }) {
  const [form, setForm]     = useState(VACIO);
  const [proveedores, setProveedores] = useState([]);
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  // Cargar proveedores una vez
  useEffect(() => {
    api.get('/proveedor/lista').then(r => {
      if (r.ok) setProveedores(r.data.resultado || []);
    });
  }, []);

  // Sincronizar datos del producto cuando se abre el modal para edición
  useEffect(() => {
    if (!abierto) return;
    if (editando && productoInicial) {
      const p = productoInicial;
      setForm({
        codigo:           p.codigo           ?? '',
        nombre:           p.nombre           ?? '',
        modelo:           p.modelo           ?? '',
        color:            p.color            ?? '',
        grupo:            p.grupo            ?? '',
        tipoControlStock: p.tipo_control_stock ?? 'NORMAL',
        costo:            p.costo            ?? '',
        pvp1:             p.pvp1             ?? '',
        iva:              p.iva              ?? '0',
        precioConIva:     p.precio_con_iva   ?? '',
        proveedorId:      p.proveedor_id     ?? '',
        observacion:      p.observacion      ?? '',
        activo:           p.activo           ?? true,
      });
    } else {
      setForm(VACIO);
    }
    setError('');
  }, [abierto, editando, productoInicial]);

  // Recalcular precio con IVA cuando cambian pvp1 o iva
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    const nuevo = { ...form, [name]: type === 'checkbox' ? checked : value };

    if (name === 'pvp1' || name === 'iva') {
      const pvp1 = parseFloat(name === 'pvp1' ? value : nuevo.pvp1) || 0;
      const iva  = parseFloat(name === 'iva'  ? value : nuevo.iva)  || 0;
      nuevo.precioConIva = (pvp1 * (1 + iva / 100)).toFixed(2);
    }

    setForm(nuevo);
  }

  async function guardar(e) {
    e.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (editando) payload.id = editando;

      const res = editando
        ? await api.put('/producto/editar', payload)
        : await api.post('/producto/crear', payload);

      if (res.ok) {
        onGuardado(res.data.resultado);
        onCerrar();
      } else {
        setError(res.data.mensaje || 'Error al guardar');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  if (!abierto) return null;

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header" style={{
          background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
          borderRadius: '12px 12px 0 0',
        }}>
          <div>
            <h2 className="modal-title" style={{ color: '#fff', fontSize: 17 }}>
              {editando ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            {editando && productoInicial && (
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 }}>
                ID: {productoInicial.id_interno || productoInicial.id}
              </p>
            )}
          </div>
          <button
            className="btn-icon"
            style={{ color: '#fff' }}
            onClick={onCerrar}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={guardar}>
          <div className="modal-body" style={{ gap: 18 }}>
            {error && <div className="alert alert-error">{error}</div>}

            {/* Sección: Identificación */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                Identificación
              </p>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Código</label>
                  <input className="form-control" name="codigo" value={form.codigo}
                    onChange={handleChange} placeholder="COD-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Grupo / Categoría</label>
                  <input className="form-control" name="grupo" value={form.grupo}
                    onChange={handleChange} placeholder="Ej: Armazones" />
                </div>
                <div className="form-group full">
                  <label className="form-label">Nombre <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                  <input className="form-control" name="nombre" value={form.nombre}
                    onChange={handleChange} placeholder="Nombre del producto" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Modelo</label>
                  <input className="form-control" name="modelo" value={form.modelo}
                    onChange={handleChange} placeholder="Modelo" />
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <input className="form-control" name="color" value={form.color}
                    onChange={handleChange} placeholder="Color" />
                </div>
              </div>
            </div>

            {/* Sección: Precios y Stock */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                Precios y Control
              </p>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Costo</label>
                  <input className="form-control" type="number" name="costo" value={form.costo}
                    onChange={handleChange} placeholder="0.00" step="0.01" min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">PVP1 (sin IVA)</label>
                  <input className="form-control" type="number" name="pvp1" value={form.pvp1}
                    onChange={handleChange} placeholder="0.00" step="0.01" min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">IVA (%)</label>
                  <select className="form-control" name="iva" value={form.iva} onChange={handleChange}>
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="15">15%</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Precio con IVA</label>
                  <input className="form-control" type="number" name="precioConIva" value={form.precioConIva}
                    onChange={handleChange} placeholder="Auto" step="0.01" min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Control de Stock</label>
                  <select className="form-control" name="tipoControlStock" value={form.tipoControlStock} onChange={handleChange}>
                    <option value="NORMAL">Normal</option>
                    <option value="ILIMITADO">Ilimitado (sin control)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Proveedor</label>
                  <select className="form-control" name="proveedorId" value={form.proveedorId} onChange={handleChange}>
                    <option value="">Sin proveedor</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Observación */}
            <div className="form-group">
              <label className="form-label">Observación</label>
              <textarea className="form-control" name="observacion" value={form.observacion}
                onChange={handleChange} rows={2} placeholder="Notas internas..." />
            </div>

            {/* Activo toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
              <div
                onClick={() => setForm(prev => ({ ...prev, activo: !prev.activo }))}
                style={{
                  width: 40, height: 22, borderRadius: 11,
                  background: form.activo ? 'var(--success-color)' : '#ccc',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: 3, left: form.activo ? 21 : 3,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s',
                }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {form.activo ? 'Producto activo' : 'Producto inactivo'}
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onCerrar} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Guardando…</>
                : editando ? 'Guardar cambios' : 'Crear producto'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
