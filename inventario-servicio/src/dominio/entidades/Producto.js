export default class Producto {
  constructor(id, datos = {}) {
    this.id = id;
    this.idInterno = datos.idInterno ?? null;
    this.codigo = datos.codigo;
    this.codigoBarras = datos.codigoBarras ?? datos.codigo_barras ?? null;
    this.nombre = datos.nombre;
    this.modelo = datos.modelo ?? null;
    this.color = datos.color ?? null;
    this.grupo = datos.grupo ?? null;
    this.stock = datos.stock == null ? null : Number(datos.stock);
    this.tipoControlStock = datos.tipoControlStock ?? 'NORMAL';
    this.costo = datos.costo == null ? null : Number(datos.costo);
    this.pvp1 = datos.pvp1 ?? 0;
    this.iva = datos.iva ?? 0;
    this.precioConIva = datos.precioConIva ?? 0;
    this.proveedorId = datos.proveedorId ?? null;
    this.ingresoId = datos.ingresoId ?? null;
    this.observacion = datos.observacion ?? null;
    this.activo = datos.activo ?? true;
    this.sucursalId = datos.sucursalId ?? null;
    this.sucursalNombre = datos.sucursalNombre ?? null;
    this.usuarioId = datos.usuarioId ?? null;
    this.usuarioNombre = datos.usuarioNombre ?? null;
    this.operacionId = datos.operacionId ?? null;
    this.idempotencyKey = datos.idempotencyKey ?? null;
    this.motivo = datos.motivo ?? null;
    this.traceId = datos.traceId ?? null;
  }
}
