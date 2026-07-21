export default class FacturacionUsesCases {
  constructor(adaptador, inventarioStock) { this.adaptador = adaptador; this.inventarioStock = inventarioStock; }
  listar(recurso, query) { return this.adaptador.listar(recurso, query); }
  obtener(recurso, id) { return this.adaptador.obtener(recurso, id); }
  async crear(recurso, datos) {
    if (recurso === 'detalle-facturas') {
      const factura = await this.adaptador.obtener('facturas', Number(datos.factura_id ?? datos.facturaId));
      const error = this.validarFacturaEditable(factura);
      if (error) return error;
    }
    const creado = await this.adaptador.crear(recurso, datos);
    if (recurso !== 'detalle-facturas' || creado.estado !== 'ok') return creado;
    const factura = await this.adaptador.obtener('facturas', creado.resultado.factura_id);
    if (factura.estado !== 'ok') return factura;
    const stock = await this.inventarioStock.ajustarVenta({ factura: factura.resultado, anterior: null, nuevo: creado.resultado, contexto: datos });
    if (stock.estado === 'ok') {
      await this.sincronizarEstadoInventario(creado.resultado.factura_id);
      return creado;
    }
    await this.adaptador.eliminar('detalle-facturas', creado.resultado.id);
    return stock;
  }

  async actualizar(recurso, id, datos) {
    if (recurso !== 'detalle-facturas') return this.adaptador.actualizar(recurso, id, datos);
    const anterior = await this.adaptador.obtener(recurso, id);
    if (anterior.estado !== 'ok') return anterior;
    const factura = await this.adaptador.obtener('facturas', anterior.resultado.factura_id);
    if (factura.estado !== 'ok') return factura;
    const error = this.validarFacturaEditable(factura);
    if (error) return error;
    const nuevo = { ...anterior.resultado.toJSON(), ...datos, id };
    const stock = await this.inventarioStock.ajustarVenta({ factura: factura.resultado, anterior: anterior.resultado, nuevo, contexto: datos });
    if (stock.estado !== 'ok') return stock;
    const actualizado = await this.adaptador.actualizar(recurso, id, datos);
    if (actualizado.estado === 'ok') {
      await this.sincronizarEstadoInventario(anterior.resultado.factura_id);
      return actualizado;
    }
    await this.inventarioStock.ajustarVenta({ factura: factura.resultado, anterior: nuevo, nuevo: anterior.resultado, contexto: { ...datos, traceId: `${datos.traceId}-ROLLBACK-DB` } });
    return actualizado;
  }

  async eliminar(recurso, id, contexto = {}) {
    if (recurso !== 'detalle-facturas') return this.adaptador.eliminar(recurso, id);
    const anterior = await this.adaptador.obtener(recurso, id);
    if (anterior.estado !== 'ok') return anterior;
    const factura = await this.adaptador.obtener('facturas', anterior.resultado.factura_id);
    if (factura.estado !== 'ok') return factura;
    const error = this.validarFacturaEditable(factura);
    if (error) return error;
    const stock = await this.inventarioStock.ajustarVenta({ factura: factura.resultado, anterior: anterior.resultado, nuevo: null, contexto });
    if (stock.estado !== 'ok') return stock;
    const eliminado = await this.adaptador.eliminar(recurso, id);
    if (eliminado.estado === 'ok') {
      await this.sincronizarEstadoInventario(anterior.resultado.factura_id);
      return eliminado;
    }
    await this.inventarioStock.ajustarVenta({ factura: factura.resultado, anterior: null, nuevo: anterior.resultado, contexto: { ...contexto, traceId: `${contexto.traceId}-ROLLBACK-DB` } });
    return eliminado;
  }

  validarFacturaEditable(consulta) {
    if (consulta.estado !== 'ok') return consulta;
    const factura = consulta.resultado.toJSON?.() ?? consulta.resultado;
    if (factura.estado_pago === 'ANULADA' || factura.deleted_at) return { estado: 'error', resultado: 'No se pueden modificar detalles de una factura anulada' };
    if (!['APLICADO', 'NO_APLICA'].includes(factura.estado_inventario)) {
      return { estado: 'error', resultado: 'La factura tiene una sincronización de inventario pendiente o con error' };
    }
    return null;
  }

  async sincronizarEstadoInventario(facturaId) {
    const detalles = await this.adaptador.listar('detalle-facturas', { facturaId, limit: 100 });
    if (detalles.estado !== 'ok') return detalles;
    const tieneProductos = detalles.resultado.some((detalle) => {
      const item = detalle.toJSON?.() ?? detalle;
      return !item.es_servicio && Boolean(item.producto_id);
    });
    return this.adaptador.actualizar('facturas', facturaId, { estado_inventario: tieneProductos ? 'APLICADO' : 'NO_APLICA' });
  }
}
