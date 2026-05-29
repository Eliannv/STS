import { useState, useEffect } from 'react';
import { api } from '../../api/api';

const HOY_HORA = () => new Date().toISOString().slice(0, 16);

// Categorías de movimientos de caja banco
const CATEGORIAS = {
  INGRESO: [
    { value: 'VENTA_EFECTIVO',   label: 'Venta efectivo'   },
    { value: 'COBRO_DEUDA',      label: 'Cobro de deuda'   },
    { value: 'CIERRE_CAJA_CHICA', label: 'Cierre caja chica' },
    { value: 'OTROS_INGRESOS',   label: 'Otros ingresos'   },
  ],
  EGRESO: [
    { value: 'PAGO_PROVEEDORES',   label: 'Pago a proveedores' },
    { value: 'GASTOS_OPERATIVOS',  label: 'Gastos operativos'  },
    { value: 'OTROS_EGRESOS',      label: 'Otros egresos'      },
  ],
};

/**
 * Modal reutilizable para registrar un movimiento en una caja banco.
 *
 * Props:
 *   abierto      {boolean}
 *   cajaBancoId  {number}
 *   saldoActual  {number}
 *   onCerrar     {() => void}
 *   onRegistrado {(movimiento) => void}
 */
export default function RegistrarMovimientoBancoModal({ abierto, cajaBancoId, saldoActual = 0, onCerrar, onRegistrado }) {
  const [form, setForm]     = useState({ tipo: 'INGRESO', categoria: '', descripcion: '', monto: '', fecha: HOY_HORA(), referencia: '' });
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (abierto) {
      setForm({ tipo: 'INGRESO', categoria: '', descripcion: '', monto: '', fecha: HOY_HORA(), referencia: '' });
      setError('');
    }
  }, [abierto]);

  if (!abierto) return null;

  function handleChange(e) {
    const { name, value } = e.target;
    // Al cambiar tipo, resetear categoría
    if (name === 'tipo') {
      setForm(p => ({ ...p, tipo: value, categoria: '' }));
    } else {
      setForm(p => ({ ...p, [name]: value }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.categoria)            return setError('La categoría es requerida');
    if (!form.descripcion.trim())   return setError('La descripción es requerida');
    if (!(parseFloat(form.monto) > 0)) return setError('El monto debe ser mayor a 0');
    if (form.tipo === 'EGRESO' && parseFloat(form.monto) > saldoActual)
      return setError(`Saldo insuficiente. Disponible: $${parseFloat(saldoActual).toFixed(2)}`);

    setSaving(true); setError('');
    try {
      const res = await api.post('/caja-banco/movimiento', {
        cajaBancoId,
        tipo:        form.tipo,
        categoria:   form.categoria,
        descripcion: form.descripcion.trim(),
        monto:       parseFloat(form.monto),
        fecha:       form.fecha || null,
        referencia:  form.referencia.trim() || null,
      });
      if (res.ok) {
        onRegistrado(res.data.resultado);
        onCerrar();
      } else {
        setError(res.data?.resultado || 'Error al registrar');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  const esEgreso  = form.tipo === 'EGRESO';
  const montoVal  = parseFloat(form.monto) || 0;
  const saldoTras = esEgreso ? Math.max(0, saldoActual - montoVal) : saldoActual + montoVal;
  const categorias = CATEGORIAS[form.tipo] || [];

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" onClick={e => e.stopPropagation()}
        style={{ maxWidth: 540, width: '95vw' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: esEgreso ? '#f8d7da' : '#d4edda',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={esEgreso ? '#721c24' : '#155724'} strokeWidth="2">
                <rect width="20" height="14" x="2" y="5" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Registrar Movimiento</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                Saldo actual: <strong>${parseFloat(saldoActual).toFixed(2)}</strong>
              </p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onCerrar} style={{ padding: '4px 8px' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Tipo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Tipo *</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['INGRESO', 'EGRESO'].map(t => (
                <button key={t} type="button"
                  onClick={() => setForm(p => ({ ...p, tipo: t, categoria: '' }))}
                  style={{
                    flex: 1, padding: '10px', border: '2px solid',
                    borderColor: form.tipo === t ? (t === 'INGRESO' ? '#28a745' : '#dc3545') : 'var(--border-color)',
                    borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    background: form.tipo === t ? (t === 'INGRESO' ? '#d4edda' : '#f8d7da') : '#fff',
                    color: form.tipo === t ? (t === 'INGRESO' ? '#155724' : '#721c24') : 'var(--text-muted)',
                  }}
                >
                  {t === 'INGRESO' ? '↑ Ingreso' : '↓ Egreso'}
                </button>
              ))}
            </div>
          </div>

          {/* Categoría */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Categoría *</label>
            <select
              name="categoria" value={form.categoria}
              onChange={handleChange}
              style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, background: '#fff' }}
            >
              <option value="">Seleccionar categoría...</option>
              {categorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Descripción */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Descripción *</label>
            <input
              type="text" name="descripcion" value={form.descripcion}
              placeholder="Detalle del movimiento..."
              onChange={handleChange}
              style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14 }}
            />
          </div>

          {/* Monto + Fecha */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Monto *</label>
              <input
                type="number" name="monto" value={form.monto}
                placeholder="0.00" step="0.01" min="0.01"
                onChange={handleChange}
                style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Fecha y hora</label>
              <input
                type="datetime-local" name="fecha" value={form.fecha}
                onChange={handleChange}
                style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 13 }}
              />
            </div>
          </div>

          {/* Referencia */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Referencia <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
            <input
              type="text" name="referencia" value={form.referencia}
              placeholder="Nro. factura, comprobante, etc."
              onChange={handleChange}
              style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14 }}
            />
          </div>

          {/* Vista previa saldo */}
          {montoVal > 0 && (
            <div style={{
              background: '#f8f9fa', borderRadius: 8, padding: '12px 16px',
              display: 'flex', justifyContent: 'space-between', fontSize: 13, border: '1px solid var(--border-color)',
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Saldo tras operación:</span>
              <strong style={{ color: esEgreso && montoVal > saldoActual ? '#dc3545' : '#155724' }}>
                ${saldoTras.toFixed(2)}
              </strong>
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onCerrar} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Registrando...' : '✓ Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
