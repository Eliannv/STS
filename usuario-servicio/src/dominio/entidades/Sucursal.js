export default class Sucursal {
  constructor(id, codigo, nombre, activo, direccion, telefono, creadoPorId) {
    this.id = id;
    this.codigo = codigo;
    this.nombre = nombre;
    this.activo = activo ?? true;
    this.direccion = direccion ?? null;
    this.telefono = telefono ?? null;
    this.creadoPorId = creadoPorId ?? null;
  }
}
