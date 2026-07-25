import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useSucursal } from '../../context/SucursalContext';
import FormModal from '../../components/common/FormModal';
import ProductoAutocomplete from '../../components/common/ProductoAutocomplete';
import TableCard from '../../components/common/TableCard';

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

  function abrirNueva() {
    setDestino(''); setMotivo(''); setObservacion('');
    setItems([]); setError('');
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
    setError('');
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

      {modal && (() => {
        const destinoNombre = destinos.find(s => Number(s.id) === Number(destino))?.nombre || '—';
        const totalUnidades = items.reduce((acc, i) => acc + Number(i.cantidad || 0), 0);
        const rightPanel = (
          <>
            <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Información</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Origen:</span>
                  <span style={{ fontWeight: 600 }}>{nombreSucursalOperativa}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Destino:</span>
                  <span style={{ fontWeight: 600 }}>{destinoNombre}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Ítems:</span>
                  <span style={{ fontWeight: 600 }}>{items.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Unidades:</span>
                  <span style={{ fontWeight: 600 }}>{totalUnidades}</span>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Datos Requeridos</span>
              </div>
              {['Sucursal de destino distinta al origen', 'Al menos un producto en la lista', 'Cantidad ≤ stock disponible en origen', 'Motivo u observación opcional'].map(txt => (
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
          abierto={modal}
          titulo="Nueva transferencia"
          subtitulo={`Origen: ${nombreSucursalOperativa}`}
          onCerrar={() => setModal(false)}
          onSubmit={enviar}
          saving={enviando}
          saveLabel="Confirmar transferencia"
          saveContent={enviando ? 'Transfiriendo...' : 'Confirmar transferencia'}
          error={error}
          rightPanel={rightPanel}
          scrollable={true}
        >
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
              <ProductoAutocomplete
                onSelect={agregar}
                placeholder="Nombre, código o modelo..."
              />
            </div>
          </div>

          {items.length > 0 && (
            <TableCard
              scrollY
              style={{ maxHeight: 300, border: '1px solid var(--border-color)', borderRadius: 8 }}
              header={<div style={{ fontWeight: 600, padding: '8px 12px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>Productos a transferir</div>}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 1 }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>Producto</th>
                    <th style={{ textAlign: 'center', padding: '8px 12px', borderBottom: '1px solid var(--border-color)', width: 100 }}>Disponible</th>
                    <th style={{ textAlign: 'center', padding: '8px 12px', borderBottom: '1px solid var(--border-color)', width: 120 }}>Cantidad</th>
                    <th style={{ textAlign: 'center', padding: '8px 12px', borderBottom: '1px solid var(--border-color)', width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(i => (
                    <tr key={i.productoId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '8px 12px' }}>{i.nombre} <small style={{ color: '#64748b' }}>{i.codigo}</small></td>
                      <td style={{ textAlign: 'center', padding: '8px 12px' }}>{i.disponible}</td>
                      <td style={{ textAlign: 'center', padding: '8px 12px' }}>
                        <input type="number" className="form-control" style={{ width: 90 }}
                          min={1} max={i.disponible} value={i.cantidad}
                          onChange={e => cambiarCantidad(i.productoId, e.target.value)} />
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px 12px' }}>
                        <button type="button" className="btn-icon danger" onClick={() => quitar(i.productoId)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableCard>
          )}
        </FormModal>
        );
      })()}

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
