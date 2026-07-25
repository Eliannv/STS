import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useSucursal } from '../../context/SucursalContext';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => (valor ? new Date(valor).toLocaleString() : '—');

export default function Transferencias() {
  const { isAdmin } = useAuth();
  const { sucursales, sucursalOperativaId, nombreSucursalOperativa, nombreSucursal } = useSucursal();

  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [aviso, setAviso] = useState('');

  // Formulario de nueva transferencia
  const [destino, setDestino] = useState('');
  const [motivo, setMotivo] = useState('');
  const [observacion, setObservacion] = useState('');
  const [buscar, setBuscar] = useState('');
  const [encontrados, setEncontrados] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await api.get('/transferencias?limit=100');
    if (res.ok) setLista(res.data.resultado || []);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Los productos llegan ya filtrados por la sucursal en curso: el stock mostrado
  // es el disponible en el origen, que es lo único que se puede transferir.
  useEffect(() => {
    if (!modal || buscar.trim().length < 2) { setEncontrados([]); return; }
    const t = setTimeout(async () => {
      const res = await api.get(`/productos?buscar=${encodeURIComponent(buscar)}&limit=10`);
      if (res.ok) setEncontrados(res.data.resultado || []);
    }, 300);
    return () => clearTimeout(t);
  }, [buscar, modal]);

  function abrirNueva() {
    setDestino(''); setMotivo(''); setObservacion('');
    setBuscar(''); setEncontrados([]); setItems([]); setError('');
    setModal(true);
  }

  function agregar(producto) {
    if (items.some(i => i.productoId === producto.id)) return;
    if (Number(producto.stock) <= 0) { setError(`"${producto.nombre}" no tiene stock en ${nombreSucursalOperativa}`); return; }
    setItems(prev => [...prev, {
      productoId: producto.id,
      nombre: producto.nombre,
      codigo: producto.codigo,
      disponible: Number(producto.stock),
      cantidad: 1,
    }]);
    setBuscar(''); setEncontrados([]); setError('');
  }

  function cambiarCantidad(productoId, cantidad) {
    setItems(prev => prev.map(i => i.productoId === productoId
      ? { ...i, cantidad: Math.max(1, Math.min(Number(cantidad) || 1, i.disponible)) }
      : i));
  }

  function quitar(productoId) {
    setItems(prev => prev.filter(i => i.productoId !== productoId));
  }

  async function enviar(e) {
    e.preventDefault();
    if (!destino) { setError('Seleccione la sucursal de destino'); return; }
    if (items.length === 0) { setError('Agregue al menos un producto'); return; }
    setEnviando(true); setError('');
    try {
      const res = await api.post('/transferencias', {
        sucursalDestinoId: Number(destino),
        motivo,
        observacion,
        idempotencyKey: `TRANSFER:${sucursalOperativaId}:${destino}:${Date.now()}`,
        items: items.map(i => ({ productoId: i.productoId, cantidad: i.cantidad })),
      });
      if (res.ok) {
        setModal(false);
        setAviso(`Transferencia ${res.data.resultado?.id_personalizado || ''} registrada correctamente.`);
        cargar();
      } else {
        setError(res.data?.resultado || 'No se pudo registrar la transferencia');
      }
    } catch { setError('Error de conexión'); }
    finally { setEnviando(false); }
  }

  async function verDetalle(id) {
    const res = await api.get(`/transferencias/${id}`);
    if (res.ok) setDetalle(res.data.resultado);
  }

  async function anular(t) {
    const motivoAnulacion = prompt(`Motivo de anulación de ${t.id_personalizado}:`);
    if (!motivoAnulacion) return;
    const res = await api.post(`/transferencias/${t.id}/anular`, { motivo: motivoAnulacion });
    setAviso(res.ok
      ? `Transferencia ${t.id_personalizado} anulada. La mercadería regresó al origen.`
      : (res.data?.resultado || 'No se pudo anular'));
    if (res.ok) { setDetalle(null); cargar(); }
  }

  const destinos = sucursales.filter(s => Number(s.id) !== Number(sucursalOperativaId));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transferencias</h1>
          <p className="page-subtitle">Traslado de mercadería entre sucursales · Origen: <strong>{nombreSucursalOperativa}</strong></p>
        </div>
        <button className="btn btn-primary" onClick={abrirNueva}>+ Nueva transferencia</button>
      </div>

      {aviso && <div className="alert alert-error" style={{ marginBottom: 12 }}>{aviso}</div>}

      <div className="card">
        <div className="card-header"><span className="card-title">{lista.length} transferencias</span></div>
        <div className="table-container">
          {loading ? <div className="spinner-wrapper"><div className="spinner"/></div> : (
            <table>
              <thead><tr><th>Documento</th><th>Fecha</th><th>Origen</th><th>Destino</th><th>Ítems</th><th>Costo</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {lista.length === 0
                  ? <tr><td colSpan={8} className="empty-state">Sin transferencias registradas</td></tr>
                  : lista.map(t => (
                    <tr key={t.id} style={{ opacity: t.estado === 'ANULADA' ? 0.55 : 1 }}>
                      <td><code style={{ background: '#f0f4ff', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{t.id_personalizado}</code></td>
                      <td>{fecha(t.fecha)}</td>
                      <td>{t.sucursal_origen_nombre || nombreSucursal(t.sucursal_origen_id)}</td>
                      <td>{t.sucursal_destino_nombre || nombreSucursal(t.sucursal_destino_id)}</td>
                      <td>{t.total_items}</td>
                      <td>{dinero(t.costo_total)}</td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, color: t.estado === 'CONFIRMADA' ? '#15803d' : '#b91c1c' }}>
                          {t.estado}
                        </span>
                      </td>
                      <td><button className="btn btn-ghost" onClick={() => verDetalle(t.id)}>Ver</button></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <span className="modal-title">Nueva transferencia</span>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={enviar}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Origen</label>
                    <input className="form-control" value={nombreSucursalOperativa} disabled />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destino *</label>
                    <select className="form-control" value={destino} onChange={e => setDestino(e.target.value)} required>
                      <option value="">Seleccione...</option>
                      {destinos.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Motivo</label>
                    <input className="form-control" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Reposición de stock" maxLength={150} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Observación</label>
                    <input className="form-control" value={observacion} onChange={e => setObservacion(e.target.value)} />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Buscar producto</label>
                    <input className="form-control" value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Nombre, código o modelo (mín. 2 caracteres)" />
                    {encontrados.length > 0 && (
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, marginTop: 4, maxHeight: 180, overflowY: 'auto' }}>
                        {encontrados.map(p => (
                          <button key={p.id} type="button" onClick={() => agregar(p)}
                            style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '8px 10px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                            <span>{p.nombre} <small style={{ color: '#64748b' }}>{p.codigo}</small></span>
                            <strong style={{ color: Number(p.stock) > 0 ? '#15803d' : '#b91c1c' }}>stock: {p.stock}</strong>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {items.length > 0 && (
                  <table style={{ marginTop: 12 }}>
                    <thead><tr><th>Producto</th><th>Disponible</th><th>Cantidad</th><th></th></tr></thead>
                    <tbody>
                      {items.map(i => (
                        <tr key={i.productoId}>
                          <td>{i.nombre} <small style={{ color: '#64748b' }}>{i.codigo}</small></td>
                          <td>{i.disponible}</td>
                          <td>
                            <input type="number" className="form-control" style={{ width: 90 }}
                              min={1} max={i.disponible} value={i.cantidad}
                              onChange={e => cambiarCantidad(i.productoId, e.target.value)} />
                          </td>
                          <td><button type="button" className="btn-icon danger" onClick={() => quitar(i.productoId)}>✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={enviando}>{enviando ? 'Transfiriendo...' : 'Confirmar transferencia'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detalle && (
        <div className="modal-overlay" onClick={() => setDetalle(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <span className="modal-title">Transferencia {detalle.id_personalizado}</span>
              <button className="btn-icon" onClick={() => setDetalle(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div><small style={{ color: '#64748b' }}>Origen</small><div><strong>{detalle.sucursal_origen_nombre || nombreSucursal(detalle.sucursal_origen_id)}</strong></div></div>
                <div><small style={{ color: '#64748b' }}>Destino</small><div><strong>{detalle.sucursal_destino_nombre || nombreSucursal(detalle.sucursal_destino_id)}</strong></div></div>
                <div><small style={{ color: '#64748b' }}>Fecha</small><div>{fecha(detalle.fecha)}</div></div>
                <div><small style={{ color: '#64748b' }}>Registró</small><div>{detalle.usuario_nombre || '—'}</div></div>
                <div><small style={{ color: '#64748b' }}>Motivo</small><div>{detalle.motivo || '—'}</div></div>
                <div><small style={{ color: '#64748b' }}>Estado</small><div><strong>{detalle.estado}</strong></div></div>
              </div>
              {detalle.motivo_anulacion && (
                <div className="alert alert-error" style={{ marginTop: 12 }}>
                  Anulada por {detalle.anulada_por_nombre || '—'}: {detalle.motivo_anulacion}
                </div>
              )}
              <table style={{ marginTop: 12 }}>
                <thead><tr><th>Producto</th><th>Cantidad</th><th>Costo unit.</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {(detalle.detalles || []).map(d => (
                    <tr key={d.id}>
                      <td>{d.producto_nombre} <small style={{ color: '#64748b' }}>{d.producto_codigo}</small></td>
                      <td>{d.cantidad}</td>
                      <td>{dinero(d.costo_unitario)}</td>
                      <td>{dinero(d.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              {isAdmin && detalle.estado === 'CONFIRMADA' && (
                <button className="btn btn-ghost" style={{ color: '#b91c1c' }} onClick={() => anular(detalle)}>Anular transferencia</button>
              )}
              <button className="btn btn-primary" onClick={() => setDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
