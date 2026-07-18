export class CajaChicaDTO {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.fecha = datos.fecha ?? null;
    this.montoInicial = Number(datos.montoInicial ?? datos.monto_inicial) || 0;
    this.montoActual = Number(datos.montoActual ?? datos.monto_actual) || 0;
    this.estado = datos.estado ?? 'ABIERTA';
    this.usuarioId = datos.usuarioId ?? datos.usuario_id ?? null;
    this.usuarioNombre = datos.usuarioNombre ?? datos.usuario_nombre ?? null;
    this.observacion = datos.observacion ?? null;
    this.cajaBancoId = datos.cajaBancoId ?? datos.caja_banco_id ?? null;
    this.cerradoEn = datos.cerradoEn ?? datos.cerrado_en ?? null;
    this.cerradoPorId = datos.cerradoPorId ?? datos.cerrado_por_id ?? null;
    this.cerradoPorNombre = datos.cerradoPorNombre ?? datos.cerrado_por_nombre ?? null;
  }
}

export class MovimientoCajaChicaDTO {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.cajaChicaId = datos.cajaChicaId ?? datos.caja_chica_id ?? null;
    this.fecha = datos.fecha ?? null;
    this.tipo = datos.tipo ?? null;
    this.descripcion = datos.descripcion ?? null;
    this.monto = Number(datos.monto) || 0;
    this.facturaId = datos.facturaId ?? datos.factura_id ?? null;
    this.referencia = datos.referencia ?? null;
    this.usuarioId = datos.usuarioId ?? datos.usuario_id ?? null;
    this.usuarioNombre = datos.usuarioNombre ?? datos.usuario_nombre ?? null;
  }
}
