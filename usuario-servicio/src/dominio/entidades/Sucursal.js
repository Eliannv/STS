export default class Sucursal {
  constructor(id, codigo, nombre, activo, direccion, telefono, email, creadoPorId) {
    this.id = id;
    this.codigo = codigo;
    this.nombre = nombre;
    this.activo = activo ?? true;
    this.direccion = direccion ?? null;
    this.telefono = telefono ?? null;
    this.email = email ?? null;
    this.creadoPorId = creadoPorId ?? null;
  }
}
