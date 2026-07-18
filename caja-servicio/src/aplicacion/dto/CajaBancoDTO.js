export class CajaBancoDTO {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.fecha = datos.fecha ?? null;
    this.saldoInicial = Number(datos.saldoInicial ?? datos.saldo_inicial) || 0;
    this.saldoActual = Number(datos.saldoActual ?? datos.saldo_actual) || 0;
    this.estado = datos.estado ?? 'ABIERTA';
    this.usuarioId = datos.usuarioId ?? datos.usuario_id ?? null;
    this.usuarioNombre = datos.usuarioNombre ?? datos.usuario_nombre ?? null;
    this.observacion = datos.observacion ?? null;
    this.cerradoEn = datos.cerradoEn ?? datos.cerrado_en ?? null;
    this.cerradoPorId = datos.cerradoPorId ?? datos.cerrado_por_id ?? null;
    this.cerradoPorNombre = datos.cerradoPorNombre ?? datos.cerrado_por_nombre ?? null;
  }
}

export class MovimientoCajaBancoDTO {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.cajaBancoId = datos.cajaBancoId ?? datos.caja_banco_id ?? null;
    this.fecha = datos.fecha ?? null;
    this.tipo = datos.tipo ?? null;
    this.categoria = datos.categoria ?? 'OTRO_INGRESO';
    this.monto = Number(datos.monto) || 0;
    this.descripcion = datos.descripcion ?? null;
    this.referenciaId = datos.referenciaId ?? datos.referencia_id ?? null;
    this.ventaId = datos.ventaId ?? datos.venta_id ?? null;
    this.usuarioId = datos.usuarioId ?? datos.usuario_id ?? null;
    this.usuarioNombre = datos.usuarioNombre ?? datos.usuario_nombre ?? null;
  }
}
