import { useState, useEffect } from 'react';
import { api } from '../../api/api';
import FormModal from '../common/FormModal';

const HOY = new Date().toISOString().split('T')[0];

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
            <span style={{ fontWeight: 600 }}>Caja Banco</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Estado:</span>
            <span style={{ fontWeight: 600, color: 'var(--success-color)' }}>Activa</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Saldo inicial:</span>
            <span style={{ fontWeight: 600 }}>${parseFloat(form.saldoInicial || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Datos Requeridos</span>
        </div>
        {['Fecha de apertura válida', 'Saldo inicial (monto ≥ 0)', 'Observación opcional'].map(txt => (
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
      titulo="Abrir Nueva Caja Banco"
      subtitulo="Registro de movimientos financieros"
      onCerrar={onCerrar}
      onSubmit={handleSubmit}
      saving={saving}
      saveLabel="Abrir Caja"
      error={error}
      maxWidth={900}
      rightPanel={rightPanel}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
      </div>
    </FormModal>
  );
}
