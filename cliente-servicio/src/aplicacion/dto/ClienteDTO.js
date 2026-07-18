export class ClienteDTO {
  constructor(datos = {}) {
    Object.assign(this, {
      id: datos.id ?? null, nombres: datos.nombres ?? '', apellidos: datos.apellidos ?? '',
      cedula: datos.cedula ?? null, telefono: datos.telefono ?? null, email: datos.email ?? null,
      fechaNacimiento: datos.fechaNacimiento ?? null, direccion: datos.direccion ?? null,
      pais: datos.pais ?? null, provincia: datos.provincia ?? null, ciudad: datos.ciudad ?? null,
      activo: datos.activo ?? true, tieneHistorialClinico: datos.tieneHistorialClinico ?? false,
      tieneCredito: datos.tieneCredito ?? false, tieneDeuda: datos.tieneDeuda ?? false,
      esConsumidorFinal: datos.esConsumidorFinal ?? false
    });
  }
}
