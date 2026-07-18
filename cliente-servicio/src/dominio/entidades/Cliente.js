export default class Cliente {
  constructor(id, datos = {}) {
    this.id = id;
    this.nombres = datos.nombres;
    this.apellidos = datos.apellidos;
    this.cedula = datos.cedula ?? null;
    this.telefono = datos.telefono ?? null;
    this.email = datos.email ?? null;
    this.fechaNacimiento = datos.fechaNacimiento ?? null;
    this.direccion = datos.direccion ?? null;
    this.pais = datos.pais ?? null;
    this.provincia = datos.provincia ?? null;
    this.ciudad = datos.ciudad ?? null;
    this.activo = datos.activo ?? true;
    this.tieneHistorialClinico = datos.tieneHistorialClinico ?? false;
    this.tieneCredito = datos.tieneCredito ?? false;
    this.tieneDeuda = datos.tieneDeuda ?? false;
    this.esConsumidorFinal = datos.esConsumidorFinal ?? false;
  }
}
