import InventarioStockSalidaPuerto from '../../aplicacion/puertos/salida/InventarioStockSalidaPuerto.js';

const productosFisicos = (items = []) => items
  .filter((item) => !item.esServicio && !item.es_servicio && (item.productoId ?? item.producto_id ?? item.id))
  .map((item, indice) => ({
    productoId: item.productoId ?? item.producto_id ?? item.id,
    cantidad: Number(item.cantidad) || 1,
    precioVenta: Number(item.precioUnitario ?? item.precio_unitario ?? item.precio ?? 0),
    lineaId: item.detalleId ?? item.detalle_id ?? item.id ?? indice,
  }));

export default class InventarioStockHttpAdaptador extends InventarioStockSalidaPuerto {
  constructor(baseUrl) {
    super();
    this.baseUrl = baseUrl?.replace(/\/$/, '');
  }

  aplicarVenta({ factura, items, contexto }) {
    const productos = productosFisicos(items);
    if (productos.length === 0) return Promise.resolve({ estado: 'ok', resultado: [], noAplica: true });
    return this.request('/api/v1/movimientos/aplicar', {
      naturaleza: 'SALIDA',
      tipoMovimiento: 'VENTA',
      origen: 'FACTURACION',
      items: productos,
      referenciaId: factura.id,
      referenciaTipo: 'FACTURA',
      referenciaCodigo: factura.id_personalizado,
      fechaOperacion: factura.fecha,
      operacionId: `FACTURA-${factura.id}-VENTA`,
      idempotencyKey: `FACTURA-${factura.id}-VENTA`,
      usuarioId: contexto.usuarioId,
      usuarioNombre: contexto.usuarioNombre,
      sucursalId: contexto.sucursalId,
      motivo: 'Venta confirmada',
      observacion: factura.observacion,
      traceId: contexto.traceId,
    }, contexto);
  }

  revertirVenta({ factura, contexto }) {
    return this.request('/api/v1/movimientos/revertir-referencia', {
      referenciaId: factura.id,
      referenciaTipo: 'FACTURA',
      referenciaCodigo: factura.id_personalizado,
      tipoOriginal: 'VENTA',
      tipoMovimiento: 'ANULACION_VENTA',
      origen: 'FACTURACION',
      operacionId: `FACTURA-${factura.id}-ANULACION`,
      idempotencyKey: `FACTURA-${factura.id}-ANULACION`,
      usuarioId: contexto.usuarioId,
      usuarioNombre: contexto.usuarioNombre,
      sucursalId: contexto.sucursalId,
      motivo: 'Anulación de factura',
      observacion: contexto.motivo,
      traceId: contexto.traceId,
    }, contexto);
  }

  aplicarDevolucion({ factura, items, contexto }) {
    const productos = productosFisicos(items);
    if (productos.length === 0) return Promise.resolve({ estado: 'ok', resultado: [], noAplica: true });
    return this.request('/api/v1/movimientos/aplicar', {
      naturaleza: 'ENTRADA',
      tipoMovimiento: 'DEVOLUCION_CLIENTE',
      origen: 'FACTURACION',
      items: productos,
      referenciaId: factura.id,
      referenciaTipo: 'DEVOLUCION_CLIENTE',
      referenciaCodigo: factura.id_personalizado,
      operacionId: `FACTURA-${factura.id}-DEVOLUCION`,
      idempotencyKey: contexto.idempotencyKey || `FACTURA-${factura.id}-DEVOLUCION`,
      usuarioId: contexto.usuarioId,
      usuarioNombre: contexto.usuarioNombre,
      sucursalId: contexto.sucursalId,
      motivo: contexto.motivo || 'Devolución de cliente',
      traceId: contexto.traceId,
    }, contexto);
  }

  async ajustarVenta({ factura, anterior, nuevo, contexto }) {
    const itemAnterior = productosFisicos(anterior ? [anterior] : [])[0] || null;
    const itemNuevo = productosFisicos(nuevo ? [nuevo] : [])[0] || null;
    if (!itemAnterior && !itemNuevo) return { estado: 'ok', resultado: [], noAplica: true };

    const comandos = [];
    if (itemAnterior && itemNuevo && String(itemAnterior.productoId) === String(itemNuevo.productoId)) {
      const diferencia = itemNuevo.cantidad - itemAnterior.cantidad;
      if (diferencia === 0) return { estado: 'ok', resultado: [], noAplica: true };
      comandos.push({ naturaleza: diferencia > 0 ? 'SALIDA' : 'ENTRADA', item: { ...itemNuevo, cantidad: Math.abs(diferencia) }, sufijo: 'DIFERENCIA' });
    } else {
      if (itemAnterior) comandos.push({ naturaleza: 'ENTRADA', item: itemAnterior, sufijo: 'RESTITUIR-ANTERIOR' });
      if (itemNuevo) comandos.push({ naturaleza: 'SALIDA', item: itemNuevo, sufijo: 'APLICAR-NUEVO' });
    }

    const aplicados = [];
    const comandosAplicados = [];
    for (const comando of comandos) {
      const resultado = await this.request('/api/v1/movimientos/aplicar', {
        naturaleza: comando.naturaleza,
        tipoMovimiento: 'COMPENSACION',
        origen: 'FACTURACION',
        items: [comando.item],
        referenciaId: factura.id,
        referenciaTipo: 'FACTURA',
        referenciaCodigo: factura.id_personalizado,
        fechaOperacion: new Date(),
        operacionId: `FACTURA-${factura.id}-EDICION-${contexto.traceId}`,
        idempotencyKey: `FACTURA-${factura.id}-EDICION-${contexto.traceId}-${comando.sufijo}`,
        usuarioId: contexto.usuarioId,
        usuarioNombre: contexto.usuarioNombre,
        sucursalId: contexto.sucursalId,
        motivo: 'Edición de cantidades o productos de factura',
        traceId: contexto.traceId,
      }, contexto);
      if (resultado.estado !== 'ok') {
        const rollback = await this.compensarComandos(factura, comandosAplicados, contexto);
        return rollback.estado === 'ok' ? resultado : { estado: 'error', resultado: `${resultado.resultado}. Además falló la compensación: ${rollback.resultado}` };
      }
      aplicados.push(...(resultado.resultado || []));
      comandosAplicados.push(comando);
    }
    return { estado: 'ok', resultado: aplicados };
  }

  async compensarComandos(factura, comandos, contexto) {
    for (const comando of [...comandos].reverse()) {
      const resultado = await this.request('/api/v1/movimientos/aplicar', {
        naturaleza: comando.naturaleza === 'ENTRADA' ? 'SALIDA' : 'ENTRADA',
        tipoMovimiento: 'COMPENSACION',
        origen: 'FACTURACION',
        items: [comando.item],
        referenciaId: factura.id,
        referenciaTipo: 'FACTURA',
        referenciaCodigo: factura.id_personalizado,
        operacionId: `FACTURA-${factura.id}-ROLLBACK-${contexto.traceId}`,
        idempotencyKey: `FACTURA-${factura.id}-ROLLBACK-${contexto.traceId}-${comando.sufijo}`,
        usuarioId: contexto.usuarioId,
        usuarioNombre: contexto.usuarioNombre,
        sucursalId: contexto.sucursalId,
        motivo: 'Compensación por fallo al editar factura',
        traceId: contexto.traceId,
      }, contexto);
      if (resultado.estado !== 'ok') return resultado;
    }
    return { estado: 'ok', resultado: [] };
  }

  async request(path, body, contexto) {
    if (!this.baseUrl) return { estado: 'error', resultado: 'INVENTARIO_SERVICIO_URL no está configurada' };
    const headers = { 'Content-Type': 'application/json', 'X-Trace-Id': contexto.traceId || '' };
    if (contexto.authorization) headers.Authorization = contexto.authorization;
    try {
      const response = await fetch(`${this.baseUrl}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.estado !== 'ok') return { estado: 'error', resultado: data?.resultado || data?.mensaje || `Inventario respondió HTTP ${response.status}` };
      return data;
    } catch (error) {
      return { estado: 'error', resultado: `Inventario no disponible: ${error.message}` };
    }
  }
}
