import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/api';
import Swal from 'sweetalert2';
import ProductoFormModal from '../../components/productos/ProductoFormModal';

const FMT = v => `$${parseFloat(v || 0).toFixed(2)}`;
const FMT_FECHA = s => s ? new Date(s + 'T00:00:00').toLocaleDateString('es-EC') : '—';

const DETALLE_VACIO = {
  productoId:      '',
  tipo:            'EXISTENTE',
  codigo:          '',
  nombre:          '',
  modelo:          '',
  color:           '',
  grupo:           '',
  pvp1:            '',
  observacion:     '',
  stockIngresado:  '',
  costoUnitario:   '',
  subtotal:        '',
};

export default function AgregarProductosIngreso() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [ingreso, setIngreso]         = useState(null);
  const [detalles, setDetalles]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [modo, setModo]               = useState('EXISTENTE'); // EXISTENTE | NUEVO
  const [detalle, setDetalle]         = useState({ ...DETALLE_VACIO, tipo: 'EXISTENTE' });

  // Búsqueda de producto existente
  const [buscarProd, setBuscarProd]   = useState('');
  const [resultados, setResultados]   = useState([]);
  const [buscando, setBuscando]       = useState(false);

  // Modal para crear producto nuevo (via ProductoFormModal en modo "nuevo")
  const [modalNuevo, setModalNuevo]   = useState(false);

  const [error, setError]             = useState('');
  const [saving, setSaving]           = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  // Cargar ingreso + detalles
  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await api.get(`/ingreso/buscar/${id}`);
    if (res.ok) {
      setIngreso(res.data.resultado);
      setDetalles(res.data.resultado.detalles || []);
    } else {
      navigate('/ingresos');
    }
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => { cargar(); }, [cargar]);

  // Búsqueda de productos con debounce
  useEffect(() => {
    if (modo !== 'EXISTENTE') return;
    if (!buscarProd.trim()) { setResultados([]); return; }
    const t = setTimeout(async () => {
      setBuscando(true);
      const res = await api.get(`/producto/lista?buscar=${encodeURIComponent(buscarProd)}`);
      if (res.ok) setResultados(res.data.resultado || []);
      setBuscando(false);
    }, 300);
    return () => clearTimeout(t);
  }, [buscarProd, modo]);

  // Recalcular subtotal
  function handleDetalleChange(e) {
    const { name, value } = e.target;
    const nuevo = { ...detalle, [name]: value };
    if (name === 'stockIngresado' || name === 'costoUnitario') {
      const stock = parseFloat(name === 'stockIngresado' ? value : nuevo.stockIngresado) || 0;
      const costo = parseFloat(name === 'costoUnitario'  ? value : nuevo.costoUnitario)  || 0;
      nuevo.subtotal = (stock * costo).toFixed(2);
    }
    setDetalle(nuevo);
  }

  function seleccionarProducto(p) {
    setDetalle(prev => ({
      ...prev,
      tipo:       'EXISTENTE',
      productoId: p.id,
      codigo:     p.codigo  || '',
      nombre:     p.nombre,
      grupo:      p.grupo   || '',
      costoUnitario: p.costo || '',
      subtotal:   (parseFloat(prev.stockIngresado || 0) * parseFloat(p.costo || 0)).toFixed(2),
    }));
    setBuscarProd(p.nombre);
    setResultados([]);
  }

  async function agregarDetalle(e) {
    e.preventDefault();
    if (!detalle.stockIngresado || parseFloat(detalle.stockIngresado) <= 0) {
      setError('La cantidad debe ser mayor a 0'); return;
    }
    if (detalle.tipo === 'EXISTENTE' && !detalle.productoId) {
      setError('Selecciona un producto existente'); return;
    }
    if (detalle.tipo === 'NUEVO' && !detalle.nombre.trim()) {
      setError('El nombre del producto es obligatorio'); return;
    }
    setSaving(true); setError('');
    try {
      const body = {
        ingresoId:     parseInt(id),
        tipo:          detalle.tipo,
        productoId:    detalle.tipo === 'EXISTENTE' ? parseInt(detalle.productoId) : undefined,
        codigo:        detalle.codigo     || undefined,
        nombre:        detalle.nombre       || undefined,
        modelo:        detalle.modelo        || undefined,
        color:         detalle.color         || undefined,
        grupo:         detalle.grupo         || undefined,
        pvp1:          parseFloat(detalle.pvp1) || undefined,
        observacion:   detalle.observacion   || undefined,
        stockIngresado: parseInt(detalle.stockIngresado),
        costoUnitario: parseFloat(detalle.costoUnitario) || 0,
        subtotal:      parseFloat(detalle.subtotal)      || 0,
      };
      const res = await api.post('/ingreso/detalle/agregar', body);
      if (res.ok) {
        setDetalle({ ...DETALLE_VACIO, tipo: modo });
        setBuscarProd('');
        cargar();
      } else {
        setError(res.data.mensaje || 'Error al agregar detalle');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  async function eliminarDetalle(detalleId) {
    if (!confirm('¿Quitar este producto del ingreso?')) return;
    const res = await api.delete('/ingreso/detalle/eliminar', { id: detalleId });
    if (res.ok) cargar();
  }

  async function finalizar() {
    if (detalles.length === 0) { setError('Agrega al menos un producto antes de finalizar'); return; }
    if (!confirm('¿Finalizar el ingreso? Esto actualizará el stock de los productos.')) return;
    setFinalizando(true); setError('');
    try {
      const res = await api.put('/ingreso/finalizar', { id: parseInt(id) });
      if (res.ok) {
        navigate('/ingresos');
      } else {
        setError(res.data.mensaje || 'Error al finalizar');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setFinalizando(false);
    }
  }

  async function cancelar() {
    //Confirmación con swal
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'No podrás revertir esta acción',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {

    const res = await api.delete('/ingreso/eliminar', { id: parseInt(id) });

    if (res.ok || res.status === 200) {

        navigate('/ingresos');

        await Swal.fire({
        title: 'Eliminado',
        text: 'El ingreso fue eliminado correctamente',
        icon: 'success',
        timer: 3000,
        toast: true,
            position: 'top-end',
        showConfirmButton: false
        });

    } else {

        Swal.fire({
        title: 'Error',
        text: 'No se pudo eliminar el ingreso',
        icon: 'error',
        timer: 3000,
        toast: true,
            position: 'top-end',
        showConfirmButton: false
        });

    }

    } catch (error) {

    Swal.fire({
        title: 'Error',
        text: 'Ocurrió un problema al eliminar el ingreso',
        icon: 'error',
        timer: 3000,
        toast: true,
            position: 'top-end',
        showConfirmButton: false
    });

    console.error(error);

    }
  }

  if (loading) {
    return <div className="page"><div className="spinner-wrapper"><div className="spinner"/></div></div>;
  }

  const subtotalLineas = detalles.reduce((s, d) => s + parseFloat(d.subtotal || 0), 0);

  return (
    <div className="page">

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
        <button className="btn-icon" style={{ padding: 0 }} onClick={() => navigate('/ingresos')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span style={{ cursor: 'pointer', color: 'var(--primary-color)' }} onClick={() => navigate('/ingresos')}>Ingresos</span>
        <span>›</span>
        <span>Agregar productos</span>
      </div>

      {/* Pasos */}
      <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
        <StepIndicator num={1} label="Datos del ingreso" active={false} done />
        <div style={{ flex: 1, height: 2, background: 'var(--primary-color)', margin: '0 8px' }} />
        <StepIndicator num={2} label="Agregar productos" active />
      </div>

      {/* Card: resumen del ingreso */}
      {ingreso && (
        <div style={{
          background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
          borderRadius: 'var(--radius-lg)', padding: '16px 22px',
          display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center',
        }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Ingreso</p>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
              {ingreso.id_personalizado || `#${ingreso.id}`}
            </p>
          </div>
          <InfoChip label="Factura"   value={ingreso.numero_factura} />
          <InfoChip label="Fecha"     value={FMT_FECHA(ingreso.fecha)} />
          <InfoChip label="Proveedor" value={ingreso.proveedor_nombre || 'Sin proveedor'} />
          <InfoChip label="Tipo"      value={ingreso.tipo_compra} />
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Subtotal líneas</p>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{FMT(subtotalLineas)}</p>
          </div>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Panel izquierdo: Formulario agregar */}
        <div className="card" style={{ overflow: 'hidden' }}>

          {/* Tabs EXISTENTE / NUEVO */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
            {[
              { key: 'EXISTENTE', label: 'Producto existente', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg> },
              { key: 'NUEVO',     label: 'Producto nuevo',     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> },
            ].map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => { setModo(t.key); setDetalle({ ...DETALLE_VACIO, tipo: t.key }); setBuscarProd(''); setResultados([]); setError(''); }}
                style={{
                  flex: 1, padding: '12px 16px', border: 'none',
                  borderBottom: modo === t.key ? '2px solid var(--primary-color)' : '2px solid transparent',
                  background: modo === t.key ? '#f0f8ff' : 'transparent',
                  color: modo === t.key ? 'var(--primary-color)' : 'var(--text-secondary)',
                  fontWeight: modo === t.key ? 600 : 400, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={agregarDetalle}>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

              {modo === 'EXISTENTE' ? (
                <>
                  <div className="form-group" style={{ position: 'relative' }}>
                    <label className="form-label">Buscar producto</label>
                    <div className="search-bar">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                      </svg>
                      <input
                        placeholder="Nombre, código, grupo..."
                        value={buscarProd}
                        onChange={e => { setBuscarProd(e.target.value); if (!e.target.value) setDetalle(prev => ({ ...prev, productoId: '', nombre: '' })); }}
                        autoComplete="off"
                      />
                      {buscando && <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
                    </div>
                    {resultados.length > 0 && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                        background: '#fff', border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
                        maxHeight: 180, overflowY: 'auto',
                      }}>
                        {resultados.map(p => (
                          <div
                            key={p.id}
                            onMouseDown={() => seleccionarProducto(p)}
                            style={{ padding: '8px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ fontWeight: 500, fontSize: 13 }}>{p.nombre}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {p.codigo && <span style={{ marginRight: 8 }}>Cód: {p.codigo}</span>}
                              {p.grupo  && <span style={{ marginRight: 8 }}>Grupo: {p.grupo}</span>}
                              <span>Stock: {p.stock}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {detalle.productoId && (
                    <div style={{
                      background: '#e8f5e9', border: '1px solid #c3e6cb',
                      borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 13,
                    }}>
                      ✓ <strong>{detalle.nombre}</strong>
                      {detalle.codigo && ` — Cód: ${detalle.codigo}`}
                    </div>
                  )}
                </>
              ) : (
                /* Modo NUEVO */
                <>
                  {/* 1. Nombre */}
                  <div className="form-group">
                    <label className="form-label">1. Nombre del Producto <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                    <input className="form-control" name="nombre" value={detalle.nombre}
                      onChange={handleDetalleChange} placeholder="Ej: ARMAZON DE METAL ECO" />
                    {ingreso?.proveedor_nombre && (
                      <small style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, display: 'block' }}>
                        El proveedor será: <strong>{ingreso.proveedor_nombre}</strong>
                      </small>
                    )}
                  </div>
                  {/* 2. Modelo + 3. Color */}
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">2. Modelo</label>
                      <input className="form-control" name="modelo" value={detalle.modelo}
                        onChange={handleDetalleChange} placeholder="Ej: ECO-500" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">3. Color</label>
                      <input className="form-control" name="color" value={detalle.color}
                        onChange={handleDetalleChange} placeholder="Ej: AZUL" />
                    </div>
                  </div>
                  {/* 4. Grupo */}
                  <div className="form-group">
                    <label className="form-label">4. Grupo</label>
                    <input className="form-control" name="grupo" value={detalle.grupo}
                      onChange={handleDetalleChange} placeholder="Ej: ARMAZONES" list="gruposList-ingreso" />
                    <datalist id="gruposList-ingreso">
                      {['ARMAZONES','LENTES DE CONTACTO','LIQUIDO DE LENTES DE CONTACTO',
                        'LIQUIDO DESEMPAÑANTE','GAFAS','LUNAS','SERVICIOS','VARIOS'].map(g => (
                        <option key={g} value={g} />
                      ))}
                    </datalist>
                    <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2, display: 'block' }}>Escribe o selecciona el grupo</small>
                  </div>
                  {/* 5. Código */}
                  <div className="form-group">
                    <label className="form-label">5. Código</label>
                    <input className="form-control" name="codigo" value={detalle.codigo}
                      onChange={handleDetalleChange} placeholder="Ej: COD-001" />
                  </div>
                </>
              )}

              {/* Cantidad y costo (común a ambos modos) */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">{modo === 'NUEVO' ? '6.' : ''} Cantidad <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                  <input type="number" className="form-control" name="stockIngresado"
                    value={detalle.stockIngresado} onChange={handleDetalleChange}
                    placeholder="0" min="1" step="1" />
                  {modo === 'NUEVO' && <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2, display: 'block' }}>Stock inicial = Cantidad ingresada</small>}
                </div>
                <div className="form-group">
                  <label className="form-label">{modo === 'NUEVO' ? '7.' : ''} Costo unitario</label>
                  <input type="number" className="form-control" name="costoUnitario"
                    value={detalle.costoUnitario} onChange={handleDetalleChange}
                    placeholder="0.00" step="0.01" min="0" />
                  {modo === 'NUEVO' && <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2, display: 'block' }}>Costo de compra</small>}
                </div>
                {modo === 'NUEVO' && (
                  <div className="form-group">
                    <label className="form-label">8. PVP (Precio de Venta)</label>
                    <input type="number" className="form-control" name="pvp1"
                      value={detalle.pvp1} onChange={handleDetalleChange}
                      placeholder="0.00" step="0.01" min="0" />
                    <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2, display: 'block' }}>Precio al cliente</small>
                  </div>
                )}
              </div>
              {/* Observación (solo modo NUEVO) */}
              {modo === 'NUEVO' && (
                <div className="form-group">
                  <label className="form-label">9. Observación</label>
                  <textarea className="form-control" name="observacion" value={detalle.observacion}
                    onChange={handleDetalleChange} placeholder="Notas adicionales (opcional)"
                    rows={3} style={{ resize: 'vertical' }}
                  />
                </div>
              )}

              {detalle.subtotal > 0 && (
                <div style={{
                  textAlign: 'right', fontSize: 13,
                  color: 'var(--text-secondary)', fontWeight: 500,
                }}>
                  Subtotal: <strong style={{ color: 'var(--text-primary)', fontSize: 15 }}>{FMT(detalle.subtotal)}</strong>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
              >
                {saving
                  ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Agregando…</>
                  : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Agregar al ingreso</>
                }
              </button>
            </div>
          </form>
        </div>

        {/* Panel derecho: Tabla de detalles */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <span className="card-title">Productos en este ingreso ({detalles.length})</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 340 }}>
            {detalles.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 20px' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                </svg>
                <p>Sin productos aún</p>
                <small>Agrega productos desde el panel izquierdo</small>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--table-header-bg)' }}>
                    <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Producto</th>
                    <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Cant.</th>
                    <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Costo</th>
                    <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Subtotal</th>
                    <th style={{ padding: '8px 4px', width: 32 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {detalles.map(d => (
                    <tr key={d.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{d.nombre}</div>
                        {d.codigo && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.codigo}</div>}
                        <span style={{
                          fontSize: 10, padding: '1px 6px', borderRadius: 99, fontWeight: 600,
                          background: d.tipo === 'NUEVO' ? '#e3f2fd' : '#f3e5f5',
                          color: d.tipo === 'NUEVO' ? '#0d47a1' : '#4a148c',
                        }}>
                          {d.tipo}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{d.stock_ingresado}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{FMT(d.costo_unitario)}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>{FMT(d.subtotal)}</td>
                      <td style={{ padding: '8px 4px' }}>
                        <button className="btn-icon danger" onClick={() => eliminarDetalle(d.id)} title="Quitar">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Totales y acciones */}
          <div style={{ borderTop: '1px solid var(--border-color)', padding: '14px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: 'var(--text-secondary)' }}>
              <span>Subtotal líneas</span>
              <strong>{FMT(subtotalLineas)}</strong>
            </div>
            {ingreso && parseFloat(ingreso.descuento || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, color: 'var(--danger-color)' }}>
                <span>— Descuento</span><span>{FMT(ingreso.descuento)}</span>
              </div>
            )}
            {ingreso && parseFloat(ingreso.flete || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>
                <span>+ Flete</span><span>{FMT(ingreso.flete)}</span>
              </div>
            )}
            {ingreso && parseFloat(ingreso.iva || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>
                <span>+ IVA</span><span>{FMT(ingreso.iva)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, marginTop: 8, fontWeight: 700, borderTop: '1px solid var(--border-light)', paddingTop: 8 }}>
              <span>Total estimado</span>
              <span style={{ color: 'var(--success-color)' }}>
                {FMT(
                  subtotalLineas
                  + parseFloat(ingreso?.flete || 0)
                  + parseFloat(ingreso?.iva   || 0)
                  - parseFloat(ingreso?.descuento || 0)
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones finales */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 20px', background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={cancelar}
          style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          </svg>
          Cancelar y eliminar
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={finalizar}
          disabled={finalizando || detalles.length === 0}
          style={{ minWidth: 200, justifyContent: 'center' }}
        >
          {finalizando
            ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Finalizando…</>
            : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> Finalizar ingreso</>
          }
        </button>
      </div>

      {/* Modal para crear producto nuevo si se necesita */}
      <ProductoFormModal
        abierto={modalNuevo}
        editando={null}
        productoInicial={null}
        onCerrar={() => setModalNuevo(false)}
        onGuardado={() => { setModalNuevo(false); }}
      />
    </div>
  );
}

function InfoChip({ label, value }) {
  return (
    <div>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>{label}</p>
      <p style={{ color: '#fff', fontSize: 13, fontWeight: 500, marginTop: 2 }}>{value}</p>
    </div>
  );
}

function StepIndicator({ num, label, active, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: done ? 'var(--success-color)' : active ? 'var(--primary-color)' : 'var(--border-color)',
        color: (done || active) ? '#fff' : 'var(--text-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700,
      }}>
        {done
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          : num
        }
      </div>
      <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  );
}
