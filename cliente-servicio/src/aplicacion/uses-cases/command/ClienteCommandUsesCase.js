import Cliente from '../../../dominio/entidades/Cliente.js';

export default class ClienteCommandUsesCase {
  constructor(adaptadorBDSalidaCommand) {
    this.adaptadorBDSalida = adaptadorBDSalidaCommand;
  }

  crear(dtoCliente) {
    if (!dtoCliente.nombres || !dtoCliente.apellidos) {
      return Promise.resolve({ estado: 'error', resultado: 'Nombres y apellidos son requeridos' });
    }

    return this.adaptadorBDSalida.guardar(new Cliente(null, {
      ...dtoCliente,
      activo: true,
      tieneHistorialClinico: false,
      tieneCredito: false,
      tieneDeuda: false
    }));
  }

  editar(dtoCliente) {
    if (!dtoCliente.id || !dtoCliente.nombres || !dtoCliente.apellidos) {
      return Promise.resolve({ estado: 'error', resultado: 'ID, nombres y apellidos son requeridos' });
    }

    return this.adaptadorBDSalida.actualizar(new Cliente(dtoCliente.id, dtoCliente));
  }

  eliminar(dtoCliente) {
    return dtoCliente.id
      ? this.adaptadorBDSalida.eliminar(dtoCliente.id)
      : Promise.resolve({ estado: 'error', resultado: 'El ID es requerido para eliminar' });
  }
}
