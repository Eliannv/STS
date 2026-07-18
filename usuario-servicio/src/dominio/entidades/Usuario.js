export default class Usuario {
  constructor(id, nombre, apellido, email, passwordHash, cedula, fechaNacimiento, rol, activo, sucursalId) {
    this.id = id;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.passwordHash = passwordHash;
    this.cedula = cedula;
    this.fechaNacimiento = fechaNacimiento;
    this.rol = rol ?? 'OPERADOR';
    this.activo = activo ?? true;
    this.sucursalId = sucursalId ?? null;
  }
}
