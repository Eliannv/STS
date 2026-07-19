export class SucursalDTO {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.codigo = datos.codigo ?? '';
    this.nombre = datos.nombre ?? '';
    this.activo = datos.activo ?? true;
    this.direccion = datos.direccion ?? null;
    this.telefono = datos.telefono ?? null;
    this.email = datos.email ?? null;
    this.creadoPorId = datos.creadoPorId ?? null;
  }
}
