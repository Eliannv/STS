export class VentaTarjetaAbonoDTO {
  constructor(datos = {}) {
    this.ventaTarjetaId = datos.ventaTarjetaId ?? datos.venta_tarjeta_id ?? null;
    this.fecha = datos.fecha ?? new Date().toISOString();
    this.monto = Number(datos.monto) || 0;
    this.observacion = datos.observacion ?? null;
    this.usuarioId = datos.usuarioId ?? datos.usuario_id ?? null;
  }
}
