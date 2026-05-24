// src/aplicacion/dto/IngresoDTO.js

export class IngresoDTO {
  constructor({
    id, idPersonalizado,
    proveedorId, proveedorNombre,
    numeroFactura, fecha, tipoCompra, observacion,
    descuento, flete, iva, total, estado, usuarioId,
    buscar, fechaDesde, fechaHasta,
    detalles,
  } = {}) {
    this.id              = id;
    this.idPersonalizado = idPersonalizado;
    this.proveedorId     = proveedorId     ?? null;
    this.proveedorNombre = proveedorNombre ?? null;
    this.numeroFactura   = numeroFactura;
    this.fecha           = fecha;
    this.tipoCompra      = tipoCompra      || 'CONTADO';
    this.observacion     = observacion     ?? null;
    this.descuento       = parseFloat(descuento)  || 0;
    this.flete           = parseFloat(flete)       || 0;
    this.iva             = parseFloat(iva)          || 0;
    this.total           = parseFloat(total)        || 0;
    this.estado          = estado;
    this.usuarioId       = usuarioId       ?? null;
    this.buscar          = buscar;
    this.fechaDesde      = fechaDesde;
    this.fechaHasta      = fechaHasta;
    this.detalles        = (detalles || []).map(d => ({
      productoId:     d.productoId     || d.producto_id     || null,
      tipo:           d.tipo                                 || 'EXISTENTE',
      codigo:         d.codigo                               || null,
      nombre:         d.nombre                               || null,
      grupo:          d.grupo                                || null,
      stockIngresado: parseInt(d.stockIngresado  || d.stock_ingresado)  || 0,
      costoUnitario:  parseFloat(d.costoUnitario || d.costo_unitario)   || 0,
      subtotal:       parseFloat(d.subtotal)                             || 0,
    }));
  }

  getId()              { return this.id; }
  getIdPersonalizado() { return this.idPersonalizado; }
  getProveedorId()     { return this.proveedorId; }
  getProveedorNombre() { return this.proveedorNombre; }
  getNumeroFactura()   { return this.numeroFactura; }
  getFecha()           { return this.fecha; }
  getTipoCompra()      { return this.tipoCompra; }
  getObservacion()     { return this.observacion; }
  getDescuento()       { return this.descuento; }
  getFlete()           { return this.flete; }
  getIva()             { return this.iva; }
  getTotal()           { return this.total; }
  getEstado()          { return this.estado; }
  getUsuarioId()       { return this.usuarioId; }
  getBuscar()          { return this.buscar; }
  getFechaDesde()      { return this.fechaDesde; }
  getFechaHasta()      { return this.fechaHasta; }
  getDetalles()        { return this.detalles; }
}

export class DetalleIngresoDTO {
  constructor({
    id, ingresoId, productoId, tipo,
    codigo, nombre, grupo,
    stockIngresado, costoUnitario, subtotal,
  } = {}) {
    this.id             = id;
    this.ingresoId      = ingresoId;
    this.productoId     = productoId    ?? null;
    this.tipo           = tipo          || 'EXISTENTE';
    this.codigo         = codigo        ?? null;
    this.nombre         = nombre        ?? null;
    this.grupo          = grupo         ?? null;
    this.stockIngresado = parseInt(stockIngresado)    || 0;
    this.costoUnitario  = parseFloat(costoUnitario)   || 0;
    this.subtotal       = parseFloat(subtotal)         || 0;
  }

  getId()             { return this.id; }
  getIngresoId()      { return this.ingresoId; }
  getProductoId()     { return this.productoId; }
  getTipo()           { return this.tipo; }
  getCodigo()         { return this.codigo; }
  getNombre()         { return this.nombre; }
  getGrupo()          { return this.grupo; }
  getStockIngresado() { return this.stockIngresado; }
  getCostoUnitario()  { return this.costoUnitario; }
  getSubtotal()       { return this.subtotal; }
}
