export default class Proveedor {
  constructor(id, datos = {}) {
    this.id = id;
    this.codigo = datos.codigo ?? null;
    this.nombre = datos.nombre;
    this.representante = datos.representante ?? null;
    this.ruc = datos.ruc;
    this.telefonoPrincipal = datos.telefonoPrincipal ?? null;
    this.telefonoSecundario = datos.telefonoSecundario ?? null;
    this.codigoLugar = datos.codigoLugar ?? null;
    this.direccion = datos.direccion ?? null;
    this.fechaIngreso = datos.fechaIngreso ?? null;
    this.saldo = datos.saldo ?? 0;
    this.activo = datos.activo ?? true;
  }
}
