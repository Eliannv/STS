export default class CobroDeuda {
  constructor(id, datos = {}) {
    this.id = id;
    this.facturaId = datos.facturaId;
    this.fechaPago = datos.fechaPago ?? new Date();
    this.montoPagado = datos.montoPagado ?? 0;
    this.metodoPago = datos.metodoPago ?? 'EFECTIVO';
    this.usuarioId = datos.usuarioId ?? null;
    this.observacion = datos.observacion ?? null;
  }
}
