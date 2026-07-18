export default class VentaTarjeta {
  constructor(id, datos = {}) {
    this.id = id;
    this.facturaId = datos.facturaId ?? null;
    this.clienteId = datos.clienteId ?? null;
    this.clienteNombre = datos.clienteNombre ?? null;
    this.fechaVenta = datos.fechaVenta ?? new Date();
    this.montoTotal = datos.montoTotal ?? 0;
    this.montoRecibido = datos.montoRecibido ?? 0;
    this.saldoPendiente = datos.saldoPendiente ?? 0;
    this.estado = datos.estado ?? 'PENDIENTE';
    this.ultimosCuatroTarjeta = datos.ultimosCuatroTarjeta ?? null;
    this.banco = datos.banco ?? null;
    this.observacion = datos.observacion ?? null;
  }
}
