// cliente/src/pages/Egresos/EgresoDetalle.jsx
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  PackageOpen,
  Plus,
  Printer,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  descartarEgreso,
  eliminarDetalleEgreso,
  extraerDatosEgreso,
  obtenerEgreso,
  obtenerMovimientosEgreso,
  obtenerProducto,
} from '../../api/egresosApi';
import TableCard from '../../components/common/TableCard';
import TipoEgresoIcon from '../../components/common/TipoEgresoIcon';
import { obtenerEtiquetaTipoEgreso } from '../../components/common/tipoEgreso';
import EstadoBadge from '../../components/shared/EstadoBadge';
import '../../components/shared/FinanceModule.css';
import { useAuth } from '../../context/AuthContext';
import {
  confirmarAccionDestructiva,
  extraerMensajeError,
  notificarError,
  notificarExito,
} from '../../utils/confirmaciones';
import { CAMPO, FECHA, FECHAHORA, FMT, NUMERO } from '../../utils/formato';
import { imprimirEgreso } from '../../utils/imprimirEgreso';
import EgresoAnularModal from './EgresoAnularModal';
import EgresoConfirmarModal from './EgresoConfirmarModal';
import EgresoDetalleModal from './EgresoDetalleModal';
import './Egresos.css';

function InfoCampo({ label, value, full = false }) {
  return (
    <div className={full ? 'egreso-info-list__full' : undefined}>
      <div className="finance-info__label">{label}</div>
      <div className="finance-info__value">{value || '—'}</div>
    </div>
  );
}

export default function EgresoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, usuario } = useAuth();
  const [egreso, setEgreso] = useState(null);
  const [productos, setProductos] = useState({});
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMovimientos, setLoadingMovimientos] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [modalConfirmar, setModalConfirmar] = useState(false);
  const [modalAnular, setModalAnular] = useState(false);

  const cargarEgreso = useCallback(async () => {
    setLoading(true);
    const respuesta = await obtenerEgreso(id);
    if (!respuesta.ok) {
      setLoading(false);
      setEgreso(null);
      await notificarError(respuesta, 'No se pudo cargar el egreso.');
      return;
    }
    const data = extraerDatosEgreso(respuesta);
    setEgreso(data);

    const detalles = data?.detalles || [];
    const resultados = await Promise.allSettled(
      detalles
        .filter((detalle) => detalle.producto_id)
        .map(async (detalle) => {
          const productoRespuesta = await obtenerProducto(detalle.producto_id);
          return {
            id: detalle.producto_id,
            data: productoRespuesta.data?.resultado
              ?? productoRespuesta.data?.data
              ?? null,
          };
        }),
    );
    const mapa = {};
    resultados.forEach((resultado) => {
      if (resultado.status === 'fulfilled' && resultado.value.data) {
        mapa[resultado.value.id] = resultado.value.data;
      }
    });
    setProductos(mapa);
    setLoading(false);
  }, [id]);

  const cargarMovimientos = useCallback(async () => {
    setLoadingMovimientos(true);
    const respuesta = await obtenerMovimientosEgreso(id);
    setMovimientos(respuesta.ok ? (extraerDatosEgreso(respuesta) || []) : []);
    setLoadingMovimientos(false);
  }, [id]);

  const cargar = useCallback(async () => {
    await Promise.allSettled([cargarEgreso(), cargarMovimientos()]);
  }, [cargarEgreso, cargarMovimientos]);

  useEffect(() => {
    const temporizador = setTimeout(cargar, 0);
    return () => clearTimeout(temporizador);
  }, [cargar]);

  const detalles = useMemo(() => (egreso?.detalles || []).map((detalle) => {
    const producto = productos[detalle.producto_id] || {};
    return {
      ...detalle,
      codigo: detalle.codigo || producto.codigo || '—',
      stock_actual: producto.stock,
    };
  }), [egreso, productos]);

  const costoTotal = detalles.reduce(
    (total, detalle) => total + NUMERO(detalle.subtotal),
    0,
  );
  const cantidadTotal = detalles.reduce(
    (total, detalle) => total + NUMERO(detalle.cantidad),
    0,
  );

  async function eliminarDetalle(detalleId) {
    const confirmado = await confirmarAccionDestructiva({
      title: 'Quitar producto',
      text: 'El producto será eliminado del borrador.',
      confirmButtonText: 'Sí, quitar',
    });
    if (!confirmado) return;
    setProcesando(true);
    const respuesta = await eliminarDetalleEgreso(id, detalleId);
    setProcesando(false);
    if (!respuesta.ok) {
      await notificarError(respuesta, 'No se pudo eliminar el producto.');
      return;
    }
    await notificarExito('Producto retirado del borrador.');
    cargarEgreso();
  }

  async function descartar() {
    const confirmado = await confirmarAccionDestructiva({
      title: 'Descartar egreso',
      text: 'El borrador quedará cerrado y no podrá confirmarse.',
      confirmButtonText: 'Sí, descartar',
    });
    if (!confirmado) return;
    setProcesando(true);
    const respuesta = await descartarEgreso(id);
    setProcesando(false);
    if (!respuesta.ok) {
      await notificarError(extraerMensajeError(respuesta, 'No se pudo descartar el egreso.'));
      return;
    }
    await notificarExito('El egreso fue descartado.');
    cargarEgreso();
  }

  if (loading) {
    return <div className="page"><div className="spinner-wrapper"><div className="spinner" /></div></div>;
  }
  if (!egreso) {
    return (
      <div className="page">
        <div className="empty-state">Egreso no encontrado.</div>
        <button className="btn btn-ghost" onClick={() => navigate('/egresos')}>Volver</button>
      </div>
    );
  }

  const esBorrador = egreso.estado === 'BORRADOR';
  const estaConfirmado = egreso.estado === 'CONFIRMADO';
  const mostrarResumen = ['CONFIRMADO', 'ANULADO'].includes(egreso.estado);
  const puedeImprimir = !esBorrador;

  function imprimir() {
    const abierta = imprimirEgreso({
      egreso,
      detalles,
      usuarioNombre: usuario?.nombre || usuario?.email || '',
      etiquetaTipo: obtenerEtiquetaTipoEgreso(egreso.tipo_egreso),
    });
    if (!abierta) notificarError('Permita ventanas emergentes para imprimir el documento.');
  }

  return (
    <div className="page finance-page egresos-page">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 className="page-title">
              Egreso {egreso.id_personalizado || `#${egreso.id}`}
            </h1>
            <EstadoBadge estado={egreso.estado} />
            {egreso.estado_financiero !== 'NO_APLICA' && (
              <EstadoBadge estado={egreso.estado_financiero} />
            )}
          </div>
          <p className="page-subtitle">{egreso.descripcion}</p>
        </div>
        <div className="finance-actions no-print">
          {esBorrador && isAdmin && (
            <>
              <button className="btn btn-primary" onClick={() => setModalDetalle(true)}>
                <Plus size={16} /> Agregar Producto
              </button>
              <button
                className="btn btn-ghost"
                disabled={detalles.length === 0 || procesando}
                onClick={() => setModalConfirmar(true)}
              >
                <CheckCircle2 size={16} /> Confirmar Egreso
              </button>
              <button className="btn btn-danger" disabled={procesando} onClick={descartar}>
                <Trash2 size={16} /> Descartar
              </button>
            </>
          )}
          {estaConfirmado && isAdmin && (
            <button className="btn btn-danger" onClick={() => setModalAnular(true)}>
              <Ban size={16} /> Anular
            </button>
          )}
          {puedeImprimir && (
            <button className="btn btn-ghost" onClick={imprimir}>
              <Printer size={16} /> Imprimir
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => navigate('/egresos')}>
            <ArrowLeft size={16} /> Volver
          </button>
        </div>
      </div>

      <div className="egreso-detail-grid">
        <section className="finance-section">
          <div className="finance-section__header">
            <h3>Información del documento</h3>
            <TipoEgresoIcon tipo={egreso.tipo_egreso} size={20} mostrarEtiqueta />
          </div>
          <div className="finance-section__body egreso-info-list">
            <InfoCampo label="Descripción" value={egreso.descripcion} full />
            {egreso.motivo && <InfoCampo label="Motivo" value={egreso.motivo} full />}
            {egreso.observacion && <InfoCampo label="Observación" value={egreso.observacion} full />}
            <InfoCampo label="Proveedor" value={egreso.proveedor_nombre} />
            <InfoCampo
              label="Ingreso origen"
              value={egreso.ingreso_origen_id ? (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate(`/ingresos/${egreso.ingreso_origen_id}`)}
                >
                  {egreso.documento_referencia || `Ingreso #${egreso.ingreso_origen_id}`}
                </button>
              ) : '—'}
            />
            <InfoCampo label="Sucursal" value={egreso.sucursal_nombre || (egreso.sucursal_id ? `Sucursal #${egreso.sucursal_id}` : '—')} />
            <InfoCampo label="Fecha documento" value={FECHA(egreso.fecha)} />
            <InfoCampo label="Creado por" value={egreso.usuario_nombre} />
            <InfoCampo label="Fecha creación" value={FECHAHORA(egreso.created_at)} />
            <InfoCampo label="Confirmado por" value={egreso.confirmado_por_nombre} />
            <InfoCampo label="Fecha confirmación" value={FECHAHORA(egreso.confirmado_en)} />
            <InfoCampo label="Anulado por" value={egreso.anulado_por_nombre} />
            <InfoCampo label="Fecha anulación" value={FECHAHORA(egreso.anulado_en)} />
            {egreso.motivo_anulacion && <InfoCampo label="Motivo de anulación" value={egreso.motivo_anulacion} full />}
          </div>
        </section>

        {mostrarResumen && (
          <aside className="finance-section">
            <div className="finance-section__header"><h3>Resumen financiero</h3></div>
            <div className="finance-section__body egreso-summary-card">
              <div className="egreso-summary-number">
                <span>Items retirados</span>
                <strong>{cantidadTotal}</strong>
              </div>
              <div className="egreso-summary-number">
                <span>Costo total retirado</span>
                <strong>{FMT(egreso.costo_total || costoTotal)}</strong>
              </div>
              <div>
                <div className="finance-info__label">Estado financiero</div>
                <EstadoBadge estado={egreso.estado_financiero} />
              </div>
              {egreso.estado_financiero === 'PENDIENTE' && (
                <div className="finance-alert finance-alert--warning">
                  <AlertTriangle size={18} />
                  <span>Reembolso pendiente de registrar en caja.</span>
                </div>
              )}
              {egreso.estado_financiero === 'APLICADO' && (
                <div className="finance-alert" style={{ borderColor: '#86efac', background: '#f0fdf4', color: '#166534' }}>
                  <CheckCircle2 size={18} />
                  <span>Reembolso registrado en caja.</span>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      <section className="finance-section">
        <div className="finance-section__header">
          <h3>Productos ({detalles.length})</h3>
          {esBorrador && isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => setModalDetalle(true)}>
              <Plus size={15} /> Agregar Producto
            </button>
          )}
        </div>
        {detalles.length === 0 ? (
          <div className="egreso-empty">
            <div className="egreso-empty__icon"><PackageOpen size={30} /></div>
            <strong>Agrega productos para continuar</strong>
            <span>El egreso todavía no contiene líneas de inventario.</span>
            {esBorrador && isAdmin && (
              <button className="btn btn-primary" onClick={() => setModalDetalle(true)}>
                <Plus size={16} /> Agregar Producto
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="finance-table egreso-table">
              <thead>
                <tr>
                  <th>Producto</th><th>Código</th><th>Grupo</th>
                  {esBorrador && <th>Stock Actual</th>}
                  <th>Cantidad</th><th>Costo Unit.</th><th>Subtotal</th>
                  {esBorrador && isAdmin && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {detalles.map((detalle) => {
                  const stock = NUMERO(detalle.stock_actual);
                  return (
                    <tr key={detalle.id}>
                      <td><strong>{detalle.nombre || '—'}</strong></td>
                      <td><code>{detalle.codigo}</code></td>
                      <td>{detalle.grupo || '—'}</td>
                      {esBorrador && (
                        <td className={NUMERO(detalle.cantidad) >= stock ? 'egreso-stock-warning' : ''}>
                          {detalle.stock_actual ?? '—'}
                        </td>
                      )}
                      <td>{detalle.cantidad}</td>
                      <td>{FMT(detalle.costo_unitario)}</td>
                      <td className="finance-amount">{FMT(detalle.subtotal)}</td>
                      {esBorrador && isAdmin && (
                        <td>
                          <button
                            className="btn-icon danger"
                            title="Eliminar línea"
                            disabled={procesando}
                            onClick={() => eliminarDetalle(detalle.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={esBorrador ? 5 : 4}><strong>{detalles.length} productos · {cantidadTotal} unidades</strong></td>
                  <td><strong>Total</strong></td>
                  <td className="finance-amount">{FMT(costoTotal)}</td>
                  {esBorrador && isAdmin && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {mostrarResumen && (
        <TableCard
          header={<strong>Movimientos de Stock Generados</strong>}
          loading={loadingMovimientos}
          loadingText="Cargando movimientos Kardex..."
          empty={!loadingMovimientos && movimientos.length === 0}
          emptyIcon={<PackageOpen size={32} />}
          emptyText="No se encontraron movimientos de stock para este egreso."
        >
          <table className="finance-table egreso-table">
            <thead>
              <tr>
                <th>Fecha</th><th>Tipo Movimiento</th><th>Producto</th><th>Cantidad</th>
                <th>Stock Anterior</th><th>Stock Nuevo</th><th>Costo Unit.</th><th>Idempotency Key</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((movimiento) => {
                const esReverso = movimiento.tipo_movimiento === 'ANULACION_EGRESO'
                  || Boolean(movimiento.movimiento_revertido_id);
                const originalAnulado = egreso.estado === 'ANULADO' && !esReverso;
                return (
                  <tr
                    key={movimiento.id}
                    className={esReverso
                      ? 'egreso-movement-reverse'
                      : originalAnulado
                        ? 'egreso-movement-original'
                        : undefined}
                  >
                    <td>{FECHAHORA(CAMPO(movimiento, 'fechaOperacion', 'fecha_operacion', movimiento.created_at))}</td>
                    <td><EstadoBadge estado={movimiento.tipo_movimiento || movimiento.naturaleza} /></td>
                    <td>{movimiento.producto_nombre || '—'}</td>
                    <td>{movimiento.cantidad}</td>
                    <td>{movimiento.stock_anterior}</td>
                    <td>{movimiento.stock_nuevo}</td>
                    <td>{FMT(movimiento.costo_unitario)}</td>
                    <td>
                      <span className="egreso-idempotency" title={movimiento.idempotency_key}>
                        {movimiento.idempotency_key || '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableCard>
      )}

      <EgresoDetalleModal
        abierto={modalDetalle}
        egreso={{ ...egreso, detalles }}
        onCerrar={() => setModalDetalle(false)}
        onAgregado={cargarEgreso}
      />
      <EgresoConfirmarModal
        abierto={modalConfirmar}
        egreso={{ ...egreso, detalles }}
        onCerrar={() => setModalConfirmar(false)}
        onConfirmado={cargar}
      />
      <EgresoAnularModal
        abierto={modalAnular}
        egreso={{ ...egreso, detalles }}
        onCerrar={() => setModalAnular(false)}
        onAnulado={cargar}
      />
    </div>
  );
}
