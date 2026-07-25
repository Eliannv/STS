// cliente/src/pages/Egresos/EgresoDetalleModal.jsx
import { PackageSearch } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  agregarDetalleEgreso,
  extraerDatosEgreso,
  obtenerIngreso,
  obtenerProducto,
} from '../../api/egresosApi';
import FormModal from '../../components/common/FormModal';
import ProductoAutocomplete from '../../components/productos/ProductoAutocomplete';
import { extraerMensajeError, notificarError, notificarExito } from '../../utils/confirmaciones';
import { FMT, NUMERO } from '../../utils/formato';

export default function EgresoDetalleModal({
  abierto,
  egreso,
  onCerrar,
  onAgregado,
}) {
  const [producto, setProducto] = useState(null);
  const [productosOrigen, setProductosOrigen] = useState([]);
  const [buscarOrigen, setBuscarOrigen] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [observacion, setObservacion] = useState('');
  const [loadingOrigen, setLoadingOrigen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const esDevolucion = egreso?.tipo_egreso === 'DEVOLUCION_PROVEEDOR';
  const detallesExistentes = egreso?.detalles || [];

  function limpiarFormulario() {
    setProducto(null);
    setBuscarOrigen('');
    setCantidad('');
    setObservacion('');
    setError('');
  }

  function cerrar() {
    limpiarFormulario();
    onCerrar();
  }

  useEffect(() => {
    if (!abierto || !esDevolucion || !egreso?.ingreso_origen_id) return undefined;
    let activo = true;
    const temporizador = setTimeout(async () => {
      setLoadingOrigen(true);
      const respuesta = await obtenerIngreso(egreso.ingreso_origen_id);
      if (!activo) return;
      if (!respuesta.ok) {
        setProductosOrigen([]);
        setLoadingOrigen(false);
        return;
      }
      const ingreso = extraerDatosEgreso(respuesta);
      const detalles = ingreso?.detalles || [];
      const productos = await Promise.all(detalles.map(async (detalle) => {
        const productoRespuesta = detalle.producto_id
          ? await obtenerProducto(detalle.producto_id)
          : null;
        const productoActual = productoRespuesta?.data?.resultado
          ?? productoRespuesta?.data?.data
          ?? {};
        const yaDevuelta = NUMERO(
          detalle.cantidad_devuelta
          ?? detalle.cantidadDevuelta
          ?? 0,
        );
        const original = NUMERO(detalle.stock_ingresado);
        return {
          ...productoActual,
          id: detalle.producto_id,
          nombre: detalle.nombre || productoActual.nombre,
          codigo: detalle.codigo || productoActual.codigo,
          grupo: detalle.grupo || productoActual.grupo,
          costo: NUMERO(detalle.costo_unitario),
          detalle_ingreso_id: detalle.id,
          cantidad_original: original,
          cantidad_devuelta: yaDevuelta,
          cantidad_disponible: Math.max(0, original - yaDevuelta),
        };
      }));
      if (activo) {
        setProductosOrigen(productos);
        setLoadingOrigen(false);
      }
    }, 0);
    return () => {
      activo = false;
      clearTimeout(temporizador);
    };
  }, [abierto, egreso, esDevolucion]);

  const productosFiltrados = useMemo(() => {
    const termino = buscarOrigen.trim().toLocaleLowerCase('es');
    if (!termino) return productosOrigen;
    return productosOrigen.filter((item) => (
      [item.codigo, item.nombre, item.modelo, item.color, item.grupo]
        .some((valor) => String(valor || '').toLocaleLowerCase('es').includes(termino))
    ));
  }, [buscarOrigen, productosOrigen]);

  const stockActual = NUMERO(producto?.stock);
  const maximo = esDevolucion
    ? Math.min(stockActual, NUMERO(producto?.cantidad_disponible))
    : stockActual;
  const cantidadNumero = NUMERO(cantidad);
  const excedeStock = producto && cantidadNumero > stockActual;
  const duplicado = producto && detallesExistentes.some(
    (detalle) => Number(detalle.producto_id) === Number(producto.id),
  );

  async function guardar(event) {
    event.preventDefault();
    if (!producto?.id) {
      setError('Seleccione un producto.');
      return;
    }
    if (!(cantidadNumero > 0)) {
      setError('La cantidad debe ser mayor que cero.');
      return;
    }
    if (duplicado) {
      setError('El producto ya fue agregado al egreso.');
      return;
    }
    if (cantidadNumero > stockActual) {
      setError('La cantidad supera el stock actual.');
      return;
    }
    if (esDevolucion && cantidadNumero > NUMERO(producto.cantidad_disponible)) {
      setError('La cantidad supera lo disponible para devolver.');
      return;
    }

    setSaving(true);
    const respuesta = await agregarDetalleEgreso(egreso.id, {
      producto_id: producto.id,
      detalle_ingreso_id: esDevolucion ? producto.detalle_ingreso_id : null,
      cantidad: cantidadNumero,
      observacion: observacion.trim() || null,
    });
    setSaving(false);

    if (!respuesta.ok) {
      const mensaje = extraerMensajeError(respuesta, 'No se pudo agregar el producto.');
      setError(mensaje);
      await notificarError(mensaje);
      return;
    }
    await notificarExito('Producto agregado al egreso.');
    limpiarFormulario();
    onAgregado?.();
    onCerrar();
  }

  return (
    <FormModal
      abierto={abierto}
      titulo="Agregar Producto"
      subtitulo={esDevolucion
        ? 'Seleccione un producto comprado en el ingreso de origen.'
        : 'Busque un producto con control de existencias.'}
      onCerrar={cerrar}
      onSubmit={guardar}
      saving={saving}
      saveLabel="Agregar"
      error={error}
      maxWidth={820}
      scrollable
    >
      {esDevolucion ? (
        <div className="form-group">
          <label className="form-label">Producto del ingreso origen *</label>
          <input
            className="form-control"
            value={buscarOrigen}
            onChange={(event) => setBuscarOrigen(event.target.value)}
            placeholder="Buscar por código, nombre, modelo, color o grupo..."
          />
          <div className="egreso-modal-products" style={{ marginTop: 8 }}>
            {loadingOrigen ? (
              <div className="spinner-wrapper"><div className="spinner" /></div>
            ) : productosFiltrados.length === 0 ? (
              <div className="empty-state">
                <PackageSearch size={28} />
                No hay productos disponibles en el ingreso.
              </div>
            ) : (
              <table className="finance-table">
                <thead>
                  <tr>
                    <th>Producto</th><th>Comprado</th><th>Devuelto</th><th>Disponible</th><th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((item) => (
                    <tr
                      key={item.detalle_ingreso_id}
                      onClick={() => {
                        setProducto(item);
                        setError('');
                      }}
                      style={{
                        cursor: 'pointer',
                        background: Number(producto?.detalle_ingreso_id) === Number(item.detalle_ingreso_id)
                          ? '#eef6fc'
                          : undefined,
                      }}
                    >
                      <td>
                        <strong>{item.nombre || '—'}</strong>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{item.codigo || 'Sin código'}</div>
                      </td>
                      <td>{item.cantidad_original}</td>
                      <td>{item.cantidad_devuelta}</td>
                      <td>{item.cantidad_disponible}</td>
                      <td>{item.stock ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="form-group">
          <label className="form-label">Producto *</label>
          <ProductoAutocomplete
            producto={producto}
            onSelect={(seleccion) => {
              setProducto(seleccion);
              setError('');
            }}
            onClear={() => setProducto(null)}
          />
        </div>
      )}

      {producto && (
        <div className="finance-modal-summary">
          <div><span>Código</span><strong>{producto.codigo || '—'}</strong></div>
          <div><span>Grupo</span><strong>{producto.grupo || '—'}</strong></div>
          <div><span>Stock actual</span><strong>{producto.stock ?? 0}</strong></div>
          <div><span>Costo unitario</span><strong>{FMT(producto.costo)}</strong></div>
        </div>
      )}

      {duplicado && (
        <div className="finance-alert finance-alert--warning" style={{ marginTop: 14 }}>
          Este producto ya forma parte del egreso.
        </div>
      )}

      <div className="form-grid" style={{ marginTop: 18 }}>
        <div className="form-group">
          <label className="form-label">Cantidad *</label>
          <input
            className="form-control"
            type="number"
            min="1"
            max={maximo || undefined}
            step="1"
            value={cantidad}
            onChange={(event) => {
              setCantidad(event.target.value);
              setError('');
            }}
            style={{ color: excedeStock || cantidadNumero >= stockActual ? '#e74c3c' : undefined }}
            required
          />
          {producto && (
            <small className={cantidadNumero >= stockActual ? 'egreso-stock-warning' : ''}>
              Máximo disponible: {maximo}
            </small>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Subtotal estimado</label>
          <input
            className="form-control"
            value={FMT(cantidadNumero * NUMERO(producto?.costo))}
            disabled
          />
        </div>
        <div className="form-group full">
          <label className="form-label">Observación de la línea</label>
          <textarea
            className="form-control"
            rows={2}
            value={observacion}
            onChange={(event) => setObservacion(event.target.value)}
          />
        </div>
      </div>
    </FormModal>
  );
}
