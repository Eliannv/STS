// src/dominio/entidades/CajaBanco.js
export default class CajaBanco {
  constructor(id, fecha, saldoInicial, saldoActual, estado, usuarioId, usuarioNombre, observacion, activo, cerradoEn, cerradoPorId, cerradoPorNombre) {
    this.id               = id;
    this.fecha            = fecha;
    this.saldoInicial     = saldoInicial  ?? 0;
    this.saldoActual      = saldoActual   ?? 0;
    this.estado           = estado        || 'ABIERTA';
    this.usuarioId        = usuarioId     ?? null;
    this.usuarioNombre    = usuarioNombre || null;
    this.observacion      = observacion   || null;
    this.activo           = activo        ?? true;
    this.cerradoEn        = cerradoEn     ?? null;
    this.cerradoPorId     = cerradoPorId  ?? null;
    this.cerradoPorNombre = cerradoPorNombre || null;
  }
}
