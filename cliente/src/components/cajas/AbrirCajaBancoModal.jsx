import { useState, useEffect } from 'react';
import { api } from '../../api/api';

const HOY = new Date().toISOString().split('T')[0];

/**
 * Modal reutilizable para abrir una nueva caja banco.
 *
 * Props:
 *   abierto    {boolean}
 *   onCerrar   {() => void}
 *   onAbierta  {(caja) => void}
 */
export default function AbrirCajaBancoModal({ abierto, onCerrar, onAbierta }) {
  const [form, setForm]     = useState({ fecha: HOY, saldoInicial: '', observacion: '' });
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (abierto) {
      setForm({ fecha: HOY, saldoInicial: '', observacion: '' });
      setError('');
    }
  }, [abierto]);

  if (!abierto) return null;

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.fecha)             return setError('La fecha es requerida');
    if (form.saldoInicial === '') return setError('El saldo inicial es requerido');
    if (parseFloat(form.saldoInicial) < 0) return setError('El saldo debe ser ≥ 0');

    setSaving(true); setError('');
    try {
      const res = await api.post('/caja-banco/abrir', {
        fecha:        form.fecha,
        saldoInicial: parseFloat(form.saldoInicial),
        observacion:  form.observacion || null,
      });
      if (res.ok) {
        onAbierta(res.data.resultado);
        onCerrar();
      } else {
        setError(res.data?.resultado || 'Error al abrir la caja banco');
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
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#cce5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#004085" strokeWidth="2">
                <rect width="20" height="14" x="2" y="5" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Abrir Nueva Caja Banco</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Registro de movimientos financieros</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onCerrar} style={{ padding: '4px 8px' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Fecha de Apertura *</label>
            <input
              type="date" name="fecha" value={form.fecha}
              max={HOY}
              onChange={handleChange}
              style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Saldo Inicial *</label>
            <input
              type="number" name="saldoInicial" value={form.saldoInicial}
              placeholder="0.00" step="0.01" min="0"
              onChange={handleChange}
              style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Observación <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
            <textarea
              name="observacion" value={form.observacion}
              placeholder="Detalles sobre la apertura..."
              rows={3} onChange={handleChange}
              style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, resize: 'vertical' }}
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

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
