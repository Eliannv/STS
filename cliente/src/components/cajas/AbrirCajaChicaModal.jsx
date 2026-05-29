import { useState, useEffect } from 'react';
import { api } from '../../api/api';

const HOY = new Date().toISOString().split('T')[0];

/**
 * Modal reutilizable para abrir una nueva caja chica.
 *
 * Props:
 *   abierto     {boolean}
 *   onCerrar    {() => void}
 *   onAbierta   {(caja) => void}  — se llama tras abrir con éxito
 */
export default function AbrirCajaChicaModal({ abierto, onCerrar, onAbierta }) {
  const [form, setForm]     = useState({ fecha: HOY, montoInicial: '', observacion: '' });
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (abierto) {
      setForm({ fecha: HOY, montoInicial: '', observacion: '' });
      setError('');
    }
  }, [abierto]);

  if (!abierto) return null;

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.fecha)              return setError('La fecha es requerida');
    if (form.montoInicial === '') return setError('El monto inicial es requerido');
    if (parseFloat(form.montoInicial) < 0) return setError('El monto debe ser ≥ 0');

    setSaving(true); setError('');
    try {
      const res = await api.post('/caja-chica/abrir', {
        fecha:         form.fecha,
        montoInicial:  parseFloat(form.montoInicial),
        observacion:   form.observacion || null,
      });
      if (res.ok) {
        onAbierta(res.data.resultado);
        onCerrar();
      } else {
        setError(res.data?.resultado || 'Error al abrir la caja');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" onClick={e => e.stopPropagation()}
        style={{ maxWidth: 480, width: '95vw' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#d4edda', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#155724" strokeWidth="2">
                <circle cx="12" cy="16" r="1"/><rect width="18" height="12" x="3" y="10" rx="2"/>
                <path d="M7 10V7a5 5 0 0 1 9.33-2.5"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Abrir Nueva Caja Chica</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Caja operativa diaria</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onCerrar} style={{ padding: '4px 8px' }}>✕</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Fecha */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Fecha de Apertura *</label>
            <input
              type="date" name="fecha" value={form.fecha}
              max={HOY}
              onChange={handleChange}
              style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14 }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No se permiten fechas futuras</span>
          </div>

          {/* Monto inicial */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Monto Inicial *</label>
            <input
              type="number" name="montoInicial" value={form.montoInicial}
              placeholder="0.00" step="0.01" min="0"
              onChange={handleChange}
              style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14 }}
            />
          </div>

          {/* Observación */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Observación <span style={{ color: 'var(--text-muted)' }}>(opcional)</span></label>
            <textarea
              name="observacion" value={form.observacion}
              placeholder="Detalles sobre la apertura..."
              rows={3}
              onChange={handleChange}
              style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, resize: 'vertical' }}
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onCerrar} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Abriendo...' : '✓ Abrir Caja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
