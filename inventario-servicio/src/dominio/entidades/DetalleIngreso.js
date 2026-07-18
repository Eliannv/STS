export default class DetalleIngreso {
  constructor(id, datos = {}) {
    this.id = id;
    this.ingresoId = datos.ingresoId ?? null;
    this.productoId = datos.productoId ?? null;
    this.tipo = datos.tipo ?? 'EXISTENTE';
    this.codigo = datos.codigo ?? null;
    this.nombre = datos.nombre ?? null;
    this.modelo = datos.modelo ?? null;
    this.color = datos.color ?? null;
    this.grupo = datos.grupo ?? null;
    this.pvp1 = datos.pvp1 ?? null;
    this.observacion = datos.observacion ?? null;
    this.stockIngresado = datos.stockIngresado ?? 0;
    this.costoUnitario = datos.costoUnitario ?? 0;
    this.subtotal = datos.subtotal ?? 0;
  }
}
