import { useState, useEffect } from 'react';
import { api } from '../../api/api';
import FormModal from '../common/FormModal';

const HOY_HORA = () => new Date().toISOString().slice(0, 16);

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
            <span style={{ fontWeight: 600 }}>Movimiento Bancario</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Saldo actual:</span>
            <span style={{ fontWeight: 600 }}>${parseFloat(saldoActual).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Operación:</span>
            <span style={{ fontWeight: 600, color: esEgreso ? 'var(--danger-color)' : 'var(--success-color)' }}>
              {esEgreso ? 'Egreso' : 'Ingreso'}
            </span>
          </div>
          {montoVal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Saldo resultante:</span>
              <span style={{ fontWeight: 700, color: esEgreso && montoVal > saldoActual ? '#dc3545' : '#155724' }}>
                ${saldoTras.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Categorías</span>
        </div>
        {[
          ['↑ Ingresos', 'Ventas, cobros, cierres'],
          ['↓ Egresos', 'Pagos, gastos operativos'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: 6, marginBottom: 7, fontSize: 12 }}>
            <span style={{ fontWeight: 700, color: 'var(--primary-color)', minWidth: 70 }}>{k}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <FormModal
      abierto={abierto}
      titulo="Registrar Movimiento"
      subtitulo={`Saldo actual: $${parseFloat(saldoActual).toFixed(2)}`}
      onCerrar={onCerrar}
      onSubmit={handleSubmit}
      saving={saving}
      saveLabel={esEgreso ? 'Registrar Egreso' : 'Registrar Ingreso'}
      error={error}
      maxWidth={900}
      rightPanel={rightPanel}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Descripción *</label>
          <input
            type="text" name="descripcion" value={form.descripcion}
            placeholder="Detalle del movimiento..."
            onChange={handleChange}
            style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14 }}
          />
        </div>

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Referencia <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
          <input
            type="text" name="referencia" value={form.referencia}
            placeholder="Nro. factura, comprobante, etc."
            onChange={handleChange}
            style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14 }}
          />
        </div>
      </div>
    </FormModal>
  );
}
