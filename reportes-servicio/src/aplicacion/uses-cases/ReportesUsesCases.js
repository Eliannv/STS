export default class ReportesUsesCases {
  constructor(dominio) { this.dominio = dominio; }
  kardexProducto(filtros, contexto) { return this.dominio.kardexProducto(filtros, contexto); }
  kardexFecha(filtros, contexto) { return this.dominio.kardexFecha(filtros, contexto); }
  inventarioActual(filtros, contexto) { return this.dominio.inventarioActual(filtros, contexto); }
  inventarioValorizado(filtros, contexto) { return this.dominio.inventarioValorizado(filtros, contexto); }
  productosSinStock(filtros, contexto) { return this.dominio.productosSinStock(filtros, contexto); }
  productosStockMinimo(filtros, contexto) { return this.dominio.productosStockMinimo(filtros, contexto); }
  productosMasVendidos(filtros, contexto) { return this.dominio.productosMasVendidos(filtros, contexto); }
  productosMenosVendidos(filtros, contexto) { return this.dominio.productosMenosVendidos(filtros, contexto); }
  comprasPorProveedor(filtros, contexto) { return this.dominio.comprasPorProveedor(filtros, contexto); }
  ingresosMercaderia(filtros, contexto) { return this.dominio.ingresosMercaderia(filtros, contexto); }
  egresosMercaderia(filtros, contexto) { return this.dominio.egresosMercaderia(filtros, contexto); }
  ventasGenerales(filtros, contexto) { return this.dominio.ventasGenerales(filtros, contexto); }
  ventasPorFecha(filtros, contexto) { return this.dominio.ventasPorFecha(filtros, contexto); }
  ventasPorSucursal(filtros, contexto) { return this.dominio.ventasPorSucursal(filtros, contexto); }
  ventasPorUsuario(filtros, contexto) { return this.dominio.ventasPorUsuario(filtros, contexto); }
  ventasPorCliente(filtros, contexto) { return this.dominio.ventasPorCliente(filtros, contexto); }
  utilidadVentas(filtros, contexto) { return this.dominio.utilidadVentas(filtros, contexto); }
  flujoCaja(filtros, contexto) { return this.dominio.flujoCaja(filtros, contexto); }
  estadoCuentasCobrar(filtros, contexto) { return this.dominio.estadoCuentasCobrar(filtros, contexto); }
  dashboardIndicadores(filtros, contexto) { return this.dominio.dashboardIndicadores(filtros, contexto); }
}
