import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';

const HOY = new Date().toISOString().split('T')[0];

const FORM_VACIO = {
  proveedorId:   '',
  proveedorNombre: '',
  numeroFactura: '',
  fecha:         HOY,
  tipoCompra:    'CONTADO',
  descuento:     '0',
  flete:         '0',
  iva:           '0',
  observacion:   '',
};

export default function CrearIngreso() {
  const navigate = useNavigate();

  const [form, setForm]           = useState(FORM_VACIO);
  const [proveedores, setProveedores] = useState([]);
  const [buscarProv, setBuscarProv]   = useState('');
  const [provOpen, setProvOpen]       = useState(false);
  const [error, setError]         = useState('');
  const [saving, setSaving]       = useState(false);
  const provRef = useRef(null);

  // Cargar proveedores
  useEffect(() => {
    api.get('/proveedor/lista').then(r => {
      if (r.ok) setProveedores(r.data.resultado || []);
    });
  }, []);

  // Cerrar dropdown al clic fuera
  useEffect(() => {
    function handler(e) {
      if (provRef.current && !provRef.current.contains(e.target)) setProvOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const proveedoresFiltrados = buscarProv.trim()
    ? proveedores.filter(p =>
        p.nombre.toLowerCase().includes(buscarProv.toLowerCase()) ||
        (p.ruc || '').includes(buscarProv)
      )
    : proveedores.slice(0, 10);

  function seleccionarProveedor(p) {
    setForm(prev => ({ ...prev, proveedorId: p.id, proveedorNombre: p.nombre }));
    setBuscarProv(p.nombre);
    setProvOpen(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.numeroFactura.trim()) { setError('El número de factura es obligatorio'); return; }
    if (!form.fecha)                { setError('La fecha es obligatoria'); return; }
    setSaving(true); setError('');
    try {
      const res = await api.post('/ingreso/crear', {
        proveedorId:     form.proveedorId   || null,
        proveedorNombre: form.proveedorNombre.trim() || null,
        numeroFactura:   form.numeroFactura.trim(),
        fecha:           form.fecha,
        tipoCompra:      form.tipoCompra,
        descuento:       parseFloat(form.descuento) || 0,
        flete:           parseFloat(form.flete)     || 0,
        iva:             parseFloat(form.iva)       || 0,
        observacion:     form.observacion.trim() || null,
      });
      if (res.ok) {
        const id = res.data.resultado?.id || res.data.id;
        navigate(`/ingresos/${id}/productos`);
      } else {
        setError(res.data.mensaje || 'Error al crear el ingreso');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
        <button className="btn-icon" style={{ padding: 0 }} onClick={() => navigate('/ingresos')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span style={{ cursor: 'pointer', color: 'var(--primary-color)' }} onClick={() => navigate('/ingresos')}>
          Ingresos
        </span>
        <span>›</span>
        <span>Nuevo ingreso</span>
      </div>

      {/* Pasos indicadores */}
      <div style={{ display: 'flex', gap: 0, alignItems: 'center', marginBottom: 4 }}>
        <StepIndicator num={1} label="Datos del ingreso" active />
        <div style={{ flex: 1, height: 2, background: 'var(--border-color)', margin: '0 8px' }} />
        <StepIndicator num={2} label="Agregar productos" active={false} />
      </div>

      {/* Card principal */}
      <div className="card" style={{ overflow: 'hidden' }}>

        {/* Header con gradiente */}
        <div style={{
          background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
          padding: '22px 28px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--radius-md)',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div>
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Nuevo Ingreso</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>
              Paso 1 de 2 — Completa los datos del comprobante
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {error && <div className="alert alert-error">{error}</div>}

            {/* Sección 1: Proveedor */}
            <section>
              <SectionHeader num={1} label="Proveedor" />
              <div style={{ marginTop: 12 }} ref={provRef} className="form-group">
                <label className="form-label">Proveedor (opcional)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-control"
                    placeholder="Buscar proveedor por nombre o RUC..."
                    value={buscarProv}
                    onChange={e => { setBuscarProv(e.target.value); setProvOpen(true); setForm(prev => ({ ...prev, proveedorId: '', proveedorNombre: e.target.value })); }}
                    onFocus={() => setProvOpen(true)}
                    autoComplete="off"
                  />
                  {provOpen && proveedoresFiltrados.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                      background: '#fff', border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
                      maxHeight: 200, overflowY: 'auto', marginTop: 2,
                    }}>
                      {proveedoresFiltrados.map(p => (
                        <div
                          key={p.id}
                          onMouseDown={() => seleccionarProveedor(p)}
                          style={{
                            padding: '9px 14px', cursor: 'pointer',
                            borderBottom: '1px solid var(--border-light)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ fontWeight: 500 }}>{p.nombre}</span>
                          {p.ruc && <small style={{ color: 'var(--text-muted)' }}>{p.ruc}</small>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {form.proveedorId && (
                  <small style={{ color: 'var(--success-color)', marginTop: 4, display: 'block' }}>
                    ✓ Proveedor seleccionado: {form.proveedorNombre}
                  </small>
                )}
              </div>
            </section>

            {/* Sección 2: Datos del comprobante */}
            <section>
              <SectionHeader num={2} label="Datos del comprobante" />
              <div className="form-grid" style={{ marginTop: 12 }}>
                <div className="form-group">
                  <label className="form-label">N° de Factura <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                  <input className="form-control" name="numeroFactura" value={form.numeroFactura}
                    onChange={handleChange} placeholder="001-001-000001" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                  <input type="date" className="form-control" name="fecha" value={form.fecha}
                    onChange={handleChange} required />
                </div>
              </div>
            </section>

            {/* Sección 3: Tipo de compra */}
            <section>
              <SectionHeader num={3} label="Tipo de compra" />
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                {['CONTADO', 'CREDITO'].map(tipo => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, tipoCompra: tipo }))}
                    style={{
                      flex: 1, padding: '12px 16px', border: '2px solid',
                      borderColor: form.tipoCompra === tipo ? 'var(--primary-color)' : 'var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      background: form.tipoCompra === tipo ? '#e8f4fd' : 'transparent',
                      color: form.tipoCompra === tipo ? 'var(--primary-color)' : 'var(--text-secondary)',
                      fontWeight: 600, fontSize: 14, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {tipo === 'CONTADO'
                      ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, verticalAlign: 'middle' }}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>Contado</>
                      : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, verticalAlign: 'middle' }}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>Crédito</>
                    }
                  </button>
                ))}
              </div>
            </section>

            {/* Sección 4: Ajustes financieros */}
            <section>
              <SectionHeader num={4} label="Ajustes (opcionales)" />
              <div className="form-grid" style={{ marginTop: 12 }}>
                <div className="form-group">
                  <label className="form-label">Descuento ($)</label>
                  <input type="number" className="form-control" name="descuento"
                    value={form.descuento} onChange={handleChange} step="0.01" min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Flete ($)</label>
                  <input type="number" className="form-control" name="flete"
                    value={form.flete} onChange={handleChange} step="0.01" min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">IVA ($)</label>
                  <input type="number" className="form-control" name="iva"
                    value={form.iva} onChange={handleChange} step="0.01" min="0" />
                </div>
                <div className="form-group full">
                  <label className="form-label">Observación</label>
                  <textarea className="form-control" name="observacion" value={form.observacion}
                    onChange={handleChange} rows={2} placeholder="Notas internas sobre este ingreso..." />
                </div>
              </div>
            </section>
          </div>

          {/* Footer acciones */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 28px', borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
          }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/ingresos')} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 180 }}>
              {saving
                ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Creando…</>
                : <>Continuar con productos <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 4 }}><polyline points="9 18 15 12 9 6"/></svg></>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionHeader({ num, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        background: 'var(--primary-color)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, flexShrink: 0,
      }}>
        {num}
      </div>
      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{label}</span>
    </div>
  );
}

function StepIndicator({ num, label, active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: active ? 'var(--primary-color)' : 'var(--border-color)',
        color: active ? '#fff' : 'var(--text-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700,
      }}>
        {num}
      </div>
      <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  );
}
