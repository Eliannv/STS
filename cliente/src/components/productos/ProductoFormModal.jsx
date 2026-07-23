import { useState, useEffect, useRef } from 'react';
import { api } from '../../api/api';
import Swal from 'sweetalert2';
import Barcode from 'react-barcode';
import FormModal from '../common/FormModal';

const VACIO = {
  codigo: '', codigoBarras: '', nombre: '', modelo: '', color: '', grupo: '',
  tipoControlStock: 'NORMAL', costo: '', pvp1: '', iva: '0',
  precioConIva: '', proveedorId: '', observacion: '', activo: true,
};

export default function ProductoFormModal({ abierto, editando, productoInicial, onCerrar, onGuardado }) {
  const [form, setForm]     = useState(VACIO);
  const [proveedores, setProveedores] = useState([]);
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);
  const barcodeRef = useRef(null);

  useEffect(() => {
    api.get('/proveedor/lista').then(r => {
      if (r.ok) setProveedores(r.data.resultado || []);
    });
  }, []);

  useEffect(() => {
    if (!abierto) return;
    let activo = true;
    setError('');

    if (editando && productoInicial) {
      const p = productoInicial;
      setForm({
        codigo:           p.codigo           ?? '',
        codigoBarras:     p.codigo_barras    ?? p.codigoBarras ?? '',
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
      api.get('/producto/siguiente-codigo-barras').then(respuesta => {
        if (!activo) return;
        if (respuesta.ok) {
          const codigoBarras = respuesta.data.resultado?.codigo_barras || respuesta.data.resultado || '';
          setForm(actual => ({ ...actual, codigoBarras }));
        } else {
          setError('No se pudo generar el código de barras. Puedes ingresarlo manualmente.');
        }
      });
    }
    return () => { activo = false; };
  }, [abierto, editando, productoInicial]);

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

  function imprimirEtiqueta() {
    const codigoBarras = form.codigoBarras || form.codigo || '';
    if (!codigoBarras) { Swal.fire('Sin código', 'El producto no tiene código de barras', 'warning'); return; }

    let svgHtml = '';
    const el = barcodeRef.current;
    if (el) {
      const svg = el.querySelector('svg');
      if (svg) svgHtml = svg.outerHTML;
    }
    if (!svgHtml) {
      svgHtml = `<div style="font-family:monospace;font-size:18px;padding:8px;border:1px dashed #999;display:inline-block">${codigoBarras}</div>`;
    }

    const pw = window.open('', '_blank');
    pw.document.write(`<!DOCTYPE html>
<html><head><style>
  @page { margin: 0; size: 80mm 50mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; text-align: center; padding: 6mm; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .label { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; }
  .nombre { font-size: 11px; font-weight: 600; max-width: 70mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .precio { font-size: 22px; font-weight: 700; margin-top: 2px; }
  .codigo-texto { font-size: 10px; color: #555; letter-spacing: 0.5px; }
  svg { max-width: 68mm; }
</style></head><body>
  <div class="label">
    <div class="nombre">${String(form.nombre || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))}</div>
    ${svgHtml}
    <div class="codigo-texto">${codigoBarras}</div>
    <div class="precio">$${parseFloat(form.pvp1 || 0).toFixed(2)}</div>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print();window.close()},300)}<\/script>
</body></html>`);
    pw.document.close();
  }

  async function guardar(e) {
    e.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    if (!form.modelo.trim()) { setError('El modelo es obligatorio'); return; }
    if (!form.grupo.trim())  { setError('El grupo es obligatorio'); return; }

    const costo = parseFloat(form.costo) || 0;
    const pvp1  = parseFloat(form.pvp1)  || 0;

    if (costo <= 0) {
      const result = await Swal.fire({
        title: 'Costo en cero',
        text: 'El costo es 0 o negativo. ¿Deseas continuar?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f97316',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, continuar',
        cancelButtonText: 'Cancelar',
      });
      if (!result.isConfirmed) return;
    }

    if (pvp1 > 0 && pvp1 < costo) {
      await Swal.fire({
        title: 'PVP menor al costo',
        text: `El precio de venta ($${pvp1.toFixed(2)}) es menor al costo ($${costo.toFixed(2)}). Puedes continuar.`,
        icon: 'warning',
        confirmButtonColor: '#3498db',
        confirmButtonText: 'Entendido',
        timer: 4000,
      });
    }

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
        setError(res.data.resultado || res.data.mensaje || 'Error al guardar');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  if (!abierto) return null;

  const costo = parseFloat(form.costo) || 0;
  const pvp1 = parseFloat(form.pvp1) || 0;
  const margen = costo > 0 ? ((pvp1 - costo) / costo * 100).toFixed(1) : '—';

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
            <span style={{ fontWeight: 600 }}>Producto</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Estado:</span>
            <span style={{ fontWeight: 600, color: form.activo ? 'var(--success-color)' : 'var(--danger-color)' }}>
              {form.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          {form.grupo && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Grupo:</span>
              <span style={{ fontWeight: 600 }}>{form.grupo}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Stock:</span>
            <span style={{ fontWeight: 600 }}>{form.tipoControlStock === 'ILIMITADO' ? 'Ilimitado' : 'Normal'}</span>
          </div>
        </div>
      </div>

      {form.codigoBarras && (
        <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10, padding: 16, overflow: 'hidden' }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Código de barras</div>
          <div ref={barcodeRef} style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
            <Barcode value={form.codigoBarras} format="CODE128" width={1.35} height={52} fontSize={13} margin={0} />
          </div>
          <button type="button" onClick={imprimirEtiqueta} style={{ marginTop: 10, padding: '5px 14px', fontSize: 12, borderRadius: 6, border: '1px solid #ccc', background: '#f8f9fa', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, width: '100%', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Imprimir etiqueta
          </button>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f39c12" strokeWidth="2"><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Precios</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Costo:</span>
            <span style={{ fontWeight: 600 }}>${costo.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>PVP (sin IVA):</span>
            <span style={{ fontWeight: 600 }}>${pvp1.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Margen:</span>
            <span style={{ fontWeight: 700, color: margen !== '—' && parseFloat(margen) < 0 ? '#dc3545' : 'var(--success-color)' }}>
              {margen !== '—' ? `${margen}%` : '—'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Datos Requeridos</span>
        </div>
        {[
          'Nombre del producto',
          'Modelo y grupo',
          'Costo y precio de venta',
          'Seleccionar IVA correcto',
        ].map(txt => (
          <div key={txt} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 9, fontSize: 12, color: 'var(--text-secondary)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" strokeWidth="2.5" style={{ marginTop: 1, flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
            {txt}
          </div>
        ))}
      </div>
    </>
  );

  const saveContent = saving
    ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Guardando…</>
    : (editando ? 'Guardar cambios' : 'Crear producto');

  return (
    <FormModal
      abierto={abierto}
      titulo={editando ? 'Editar producto' : 'Nuevo producto'}
      subtitulo={editando && productoInicial ? `ID: ${productoInicial.id_interno || productoInicial.id}` : 'Registra un nuevo producto en el sistema'}
      onCerrar={onCerrar}
      onSubmit={guardar}
      saving={saving}
      saveContent={saveContent}
      error={error}
      maxWidth={1050}
      rightPanel={rightPanel}
      minSaveWidth={150}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Identificación</span>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Código del producto</label>
            <input className="form-control" name="codigo" value={form.codigo}
              onChange={handleChange} placeholder="COD-001" />
          </div>
          <div className="form-group">
            <label className="form-label">Código de barras</label>
            <input className="form-control" name="codigoBarras" value={form.codigoBarras}
              onChange={handleChange} placeholder="PRO000000001" maxLength={100} />
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

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Precios y Control</span>
        </div>
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

      <div className="form-group">
        <label className="form-label">Observación</label>
        <textarea className="form-control" name="observacion" value={form.observacion}
          onChange={handleChange} rows={2} placeholder="Notas internas..." />
      </div>

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
    </FormModal>
  );
}
