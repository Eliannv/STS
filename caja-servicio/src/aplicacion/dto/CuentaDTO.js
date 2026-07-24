// caja-servicio/src/aplicacion/dto/CuentaDTO.js
export default class CuentaDTO {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.fecha = datos.fecha ?? null;
    this.tipo = datos.tipo ?? null;
    this.tipoCuentaPorPagar = datos.tipoCuentaPorPagar ?? null;
    this.montoTotal = datos.montoTotal ?? 0;
    this.montoAbonado = datos.montoAbonado ?? 0;
    this.saldo = datos.saldo ?? 0;
    this.estado = datos.estado ?? 'PENDIENTE';
    this.observacion = datos.observacion ?? null;
    this.terceroNombre = datos.terceroNombre ?? null;
    this.terceroId = datos.terceroId ?? null;
    this.usuarioId = datos.usuarioId ?? null;
    this.sucursalId = datos.sucursalId ?? null;
    this.cajaBancoId = datos.cajaBancoId ?? null;
    this.createdAt = datos.createdAt ?? null;
    this.updatedAt = datos.updatedAt ?? null;
    this.origen = datos.origen ?? null;
    this.referenciaTipo = datos.referenciaTipo ?? null;
    this.referenciaId = datos.referenciaId ?? null;
    this.referenciaCodigo = datos.referenciaCodigo ?? null;
    this.terceroTipo = datos.terceroTipo ?? null;
    this.fechaEmision = datos.fechaEmision ?? null;
    this.fechaVencimiento = datos.fechaVencimiento ?? null;
    this.moneda = datos.moneda ?? 'USD';
    this.usuarioNombre = datos.usuarioNombre ?? null;
    this.operacionId = datos.operacionId ?? null;
    this.idempotencyKey = datos.idempotencyKey ?? null;
  }

  static fromEntidad(entidad) {
    if (!entidad) {
      return null;
    }

    return new CuentaDTO({
      id: entidad.getId(),
      fecha: entidad.getFecha(),
      tipo: entidad.getTipo(),
      tipoCuentaPorPagar: entidad.getTipoCuentaPorPagar(),
      montoTotal: entidad.getMontoTotal(),
      montoAbonado: entidad.getMontoAbonado(),
      saldo: entidad.getSaldo(),
      estado: entidad.getEstado(),
      observacion: entidad.getObservacion(),
      terceroNombre: entidad.getTerceroNombre(),
      terceroId: entidad.getTerceroId(),
      usuarioId: entidad.getUsuarioId(),
      sucursalId: entidad.getSucursalId(),
      cajaBancoId: entidad.getCajaBancoId(),
      createdAt: entidad.getCreatedAt(),
      updatedAt: entidad.getUpdatedAt(),
      origen: entidad.getOrigen(),
      referenciaTipo: entidad.getReferenciaTipo(),
      referenciaId: entidad.getReferenciaId(),
      referenciaCodigo: entidad.getReferenciaCodigo(),
      terceroTipo: entidad.getTerceroTipo(),
      fechaEmision: entidad.getFechaEmision(),
      fechaVencimiento: entidad.getFechaVencimiento(),
      moneda: entidad.getMoneda(),
      usuarioNombre: entidad.getUsuarioNombre(),
      operacionId: entidad.getOperacionId(),
      idempotencyKey: entidad.getIdempotencyKey(),
    });
  }

  getId() { return this.id; }
  getFecha() { return this.fecha; }
  getTipo() { return this.tipo; }
  getTipoCuentaPorPagar() { return this.tipoCuentaPorPagar; }
  getMontoTotal() { return this.montoTotal; }
  getMontoAbonado() { return this.montoAbonado; }
  getSaldo() { return this.saldo; }
  getEstado() { return this.estado; }
  getObservacion() { return this.observacion; }
  getTerceroNombre() { return this.terceroNombre; }
  getTerceroId() { return this.terceroId; }
  getUsuarioId() { return this.usuarioId; }
  getSucursalId() { return this.sucursalId; }
  getCajaBancoId() { return this.cajaBancoId; }
  getCreatedAt() { return this.createdAt; }
  getUpdatedAt() { return this.updatedAt; }
  getOrigen() { return this.origen; }
  getReferenciaTipo() { return this.referenciaTipo; }
  getReferenciaId() { return this.referenciaId; }
  getReferenciaCodigo() { return this.referenciaCodigo; }
  getTerceroTipo() { return this.terceroTipo; }
  getFechaEmision() { return this.fechaEmision; }
  getFechaVencimiento() { return this.fechaVencimiento; }
  getMoneda() { return this.moneda; }
  getUsuarioNombre() { return this.usuarioNombre; }
  getOperacionId() { return this.operacionId; }
  getIdempotencyKey() { return this.idempotencyKey; }
}
