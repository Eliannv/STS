// src/dominio/entidades/CajaChica.js
export default class CajaChica {
  constructor(id, fecha, montoInicial, montoActual, estado, usuarioId, usuarioNombre, observacion, activo, cajaBancoId, cerradoEn, cerradoPorId, cerradoPorNombre) {
    this.id               = id;
    this.fecha            = fecha;
    this.montoInicial     = montoInicial  ?? 0;
    this.montoActual      = montoActual   ?? 0;
    this.estado           = estado        || 'ABIERTA';
    this.usuarioId        = usuarioId     ?? null;
    this.usuarioNombre    = usuarioNombre || null;
    this.observacion      = observacion   || null;
    this.activo           = activo        ?? true;
    this.cajaBancoId      = cajaBancoId   ?? null;
    this.cerradoEn        = cerradoEn     ?? null;
    this.cerradoPorId     = cerradoPorId  ?? null;
    this.cerradoPorNombre = cerradoPorNombre || null;
  }
}
