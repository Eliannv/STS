import { useState, useEffect } from 'react';
import { api } from '../../api/api';
import FormModal from '../common/FormModal';

const VACIO = {
  clienteId: '',
  odEsfera: '', odCilindro: '', odEje: '', odAvsc: '', odAvcc: '',
  oiEsfera: '', oiCilindro: '', oiEje: '', oiAvsc: '', oiAvcc: '',
  dp: '', add: '', de: '', altura: '', color: '',
  observacion: '',
  armazonH: '', armazonV: '', armazonDbl: '', armazonDm: '', armazonTipo: '',
  doctor: '', fechaChequeo: '', horaChequeo: '',
};

export default function HistorialFormModal({ abierto, editando, historialInicial, cliente, onCerrar, onGuardado, soloLectura = false }) {
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    if (historialInicial) {
      const h = historialInicial;
      setForm({
        clienteId:    h.cliente_id,
        odEsfera:     h.od_esfera    ?? '', odCilindro:  h.od_cilindro  ?? '',
        odEje:        h.od_eje       ?? '', odAvsc:      h.od_avsc      ?? '', odAvcc: h.od_avcc ?? '',
        oiEsfera:     h.oi_esfera    ?? '', oiCilindro:  h.oi_cilindro  ?? '',
        oiEje:        h.oi_eje       ?? '', oiAvsc:      h.oi_avsc      ?? '', oiAvcc: h.oi_avcc ?? '',
        dp:           h.dp           ?? '', add:         h.add          ?? '',
        de:           h.de           ?? '', altura:      h.altura       ?? '',
        color:        h.color        ?? '', observacion: h.observacion  ?? '',
        armazonH:     h.armazon_h    ?? '', armazonV:    h.armazon_v    ?? '', armazonDbl:  h.armazon_dbl  ?? '',
        armazonDm:    h.armazon_dm   ?? '', armazonTipo: h.armazon_tipo ?? '',
        doctor:       h.doctor       ?? '', fechaChequeo: h.fecha_chequeo ?? '', horaChequeo: h.hora_chequeo ?? '',
      });
    } else {
      setForm({ ...VACIO, clienteId: cliente?.id || '' });
    }
    setError('');
  }, [abierto, editando, historialInicial, cliente]);

  if (!abierto) return null;

  const des = soloLectura;

  function handleChange(e) { if (!soloLectura) setForm(p => ({ ...p, [e.target.name]: e.target.value })); }

  async function guardar(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = editando
        ? await api.put('/historial-clinico/editar', { id: editando, ...form })
        : await api.post('/historial-clinico/crear', form);
      if (res.ok) { onGuardado(); onCerrar(); }
      else setError(res.data?.mensaje || 'Error al guardar');
    } catch { setError('Error de conexión'); }
    finally { setSaving(false); }
  }

  function Field({ label, name, placeholder, style: fStyle }) {
    return (
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label" style={{ fontSize: 11, marginBottom: 3 }}>{label}</label>
        <input className="form-control" style={{ fontSize: 13, ...fStyle }} type="text" name={name} value={form[name]} onChange={handleChange} placeholder={placeholder} disabled={des} />
      </div>
    );
  }

  function ODIField({ label, name, placeholder }) {
    return (
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label" style={{ fontSize: 11, marginBottom: 3 }}>{label}</label>
        <input className="form-control" style={{ fontSize: 13 }} type="text" name={name} value={form[name]} onChange={handleChange} placeholder={placeholder} disabled={des} />
      </div>
    );
  }

  const rightPanel = (
    <>
      <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Información</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Tipo:</span>
            <span style={{ fontWeight: 600 }}>Historia Clínica</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Paciente:</span>
            <div style={{ fontWeight: 600, fontSize: 12, marginTop: 2 }}>
              {cliente ? `${cliente.nombres?.split(' ')[0] || ''} ${cliente.apellidos?.split(' ')[0] || ''}` : '—'}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Estado:</span>
            <span style={{ fontWeight: 600, color: 'var(--success-color)' }}>Activo</span>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2"><circle cx="6" cy="15" r="4"/><circle cx="18" cy="15" r="4"/><path d="M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/><path d="M2.5 13 5 7c.7-1.3 1.4-2 3-2"/><path d="M21.5 13 19 7c-.7-1.3-1.5-2-3-2"/></svg>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Referencia</span>
        </div>
        {[
          ['Esf.',  'Potencia esférica'],
          ['Cil.',  'Potencia cilíndrica'],
          ['Eje',   'Orientación 0–180°'],
          ['AVSC',  'Sin corrección'],
          ['AVCC',  'Con corrección'],
          ['ADD',   'Adición para cerca'],
          ['DP',    'Distancia pupilar'],
          ['H/V',   'Dimensiones aro'],
          ['DBL',   'Distancia puente'],
          ['DM',    'Diagonal mayor'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: 6, marginBottom: 7, fontSize: 12 }}>
            <span style={{ fontWeight: 700, color: 'var(--primary-color)', minWidth: 34 }}>{k}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <FormModal
      abierto={abierto}
      titulo="Historia Clínica"
      subtitulo={`${editando ? 'Modifica los datos del historial clínico' : 'Registra el historial clínico del paciente'}${cliente ? ` — ${cliente.nombres} ${cliente.apellidos}` : ''}`}
      onCerrar={onCerrar}
      onSubmit={soloLectura ? e => e.preventDefault() : guardar}
      saving={saving}
      saveLabel={editando ? 'Guardar Cambios' : 'Guardar Todo'}
      error={error}
      maxWidth={1050}
      rightPanel={rightPanel}
      scrollable
      hideSave={soloLectura}
      cancelLabel={soloLectura ? 'Cerrar' : 'Cancelar'}
    >
      {/* Datos Clínicos */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><circle cx="6" cy="15" r="4"/><circle cx="18" cy="15" r="4"/><path d="M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/><path d="M2.5 13 5 7c.7-1.3 1.4-2 3-2"/><path d="M21.5 13 19 7c-.7-1.3-1.5-2-3-2"/></svg>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Datos Clínicos</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* OD */}
          <div style={{ border: '2px solid #dbeafe', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, color: 'var(--primary-color)', marginBottom: 14, fontSize: 13 }}>Ojo Derecho (OD)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px' }}>
                {[
                  { label: 'Esfera',   name: 'odEsfera',   ph: '+0.00' },
                  { label: 'Cilindro', name: 'odCilindro', ph: '-0.00' },
                  { label: 'Eje (°)',  name: 'odEje',      ph: '90' },
                  { label: '',         name: '' },
                  { label: 'AVSC',     name: 'odAvsc',     ph: '20/20' },
                  { label: 'AVCC',     name: 'odAvcc',     ph: '20/40' },
                ].map(f => f.name ? (
                  <ODIField key={f.name} label={f.label} name={f.name} placeholder={f.ph} />
                ) : <div key="empty-od" />)}
            </div>
          </div>

          {/* OI */}
          <div style={{ border: '2px solid #dcfce7', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, color: '#27ae60', marginBottom: 14, fontSize: 13 }}>Ojo Izquierdo (OI)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px' }}>
                {[
                  { label: 'Esfera',   name: 'oiEsfera',   ph: '+0.00' },
                  { label: 'Cilindro', name: 'oiCilindro', ph: '-0.00' },
                  { label: 'Eje (°)',  name: 'oiEje',      ph: '90' },
                  { label: '',         name: '' },
                  { label: 'AVSC',     name: 'oiAvsc',     ph: '20/20' },
                  { label: 'AVCC',     name: 'oiAvcc',     ph: '20/40' },
                ].map(f => f.name ? (
                  <ODIField key={f.name} label={f.label} name={f.name} placeholder={f.ph} />
                ) : <div key="empty-oi" />)}
            </div>
          </div>
        </div>

        {/* ADD / DP / Altura */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 14 }}>
          <Field label="ADD" name="add" placeholder="2.00" />
          <Field label="DP (mm)" name="dp" placeholder="62" />
          <Field label="Altura (mm)" name="altura" placeholder="18.5" />
        </div>
      </div>

      {/* Medidas del Armazón */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M2 12h3"/><path d="M19 12h3"/></svg>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Medidas del Armazón</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="H — Ancho del Aro" name="armazonH" placeholder="52" />
          <Field label="V — Alto del Aro" name="armazonV" placeholder="40" />
          <Field label="DBL — Puente" name="armazonDbl" placeholder="18" />
          <Field label="DM — Diagonal Mayor" name="armazonDm" placeholder="60" />
          <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
            <label className="form-label">Tipo de Armazón</label>
            <select className="form-control" name="armazonTipo" value={form.armazonTipo} onChange={handleChange} disabled={des}>
              <option value="">Seleccionar...</option>
              <option value="Completo">Completo</option>
              <option value="Ranurado">Ranurado</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <Field label="De" name="de" placeholder="Cerca / Lejos / DP" />
          <Field label="Color" name="color" placeholder="Negro / Transparente" />
        </div>
      </div>

      {/* Control del Chequeo */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Control del Chequeo</span>
        </div>
        <div className="form-group" style={{ margin: 0, marginBottom: 12 }}>
          <label className="form-label">Observación</label>
          <textarea className="form-control" name="observacion" value={form.observacion} onChange={handleChange} rows={3} placeholder="Notas adicionales sobre la consulta..." style={{ resize: 'vertical' }} disabled={des} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Doctor que atendió" name="doctor" placeholder="Dr. Juan Pérez" />
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Fecha del chequeo</label>
            <input className="form-control" type="date" name="fechaChequeo" value={form.fechaChequeo} onChange={handleChange} disabled={des} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Hora del chequeo</label>
            <input className="form-control" type="time" name="horaChequeo" value={form.horaChequeo} onChange={handleChange} disabled={des} />
          </div>
        </div>
      </div>
    </FormModal>
  );
}
