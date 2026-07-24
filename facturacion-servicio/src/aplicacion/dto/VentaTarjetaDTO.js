// facturacion-servicio/src/aplicacion/dto/VentaTarjetaDTO.js
export class VentaTarjetaAbonoDTO {
  constructor(datos = {}) {
    this.ventaTarjetaId =
      datos.ventaTarjetaId
      ?? datos.venta_tarjeta_id
      ?? null;
    this.montoBruto =
      Number(datos.montoBruto ?? datos.monto_bruto ?? datos.monto)
      || 0;
    this.comision = Number(datos.comision) || 0;
    this.retencion = Number(datos.retencion) || 0;
    this.banco = datos.banco ?? null;
    this.numeroLote = datos.numeroLote ?? datos.numero_lote ?? null;
    this.numeroAutorizacion =
      datos.numeroAutorizacion
      ?? datos.numero_autorizacion
      ?? null;
    this.voucher = datos.voucher ?? null;
    this.fechaAcreditacion =
      datos.fechaAcreditacion
      ?? datos.fecha_acreditacion
      ?? new Date();
    this.cuentaBancoId =
      datos.cuentaBancoId
      ?? datos.cuenta_banco_id
      ?? null;
    this.usuarioId = datos.usuarioId ?? datos.usuario_id ?? null;
    this.usuarioNombre =
      datos.usuarioNombre
      ?? datos.usuario_nombre
      ?? null;
    this.traceId = datos.traceId ?? null;
    this.observacion = datos.observacion ?? null;
    this.autorizarExceso =
      datos.autorizarExceso
      ?? datos.autorizar_exceso
      ?? false;
    this.justificacionExceso =
      datos.justificacionExceso
      ?? datos.justificacion_exceso
      ?? null;
  }
}
