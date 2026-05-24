// src/aplicacion/uses-cases/command/ClienteCommandUsesCase.js
import Cliente from '../../../dominio/entidades/Cliente.js';

export default class ClienteCommandUsesCase {
  constructor(adaptadorBDSalidaCommand) {
    this.adaptadorBDSalida = adaptadorBDSalidaCommand;
  }

  async crear(dtoCliente) {
    if (!dtoCliente.getNombres() || !dtoCliente.getApellidos()) {
      return { estado: 'error', resultado: 'Nombres y apellidos son requeridos' };
    }

    const cliente = new Cliente(
      null,
      dtoCliente.getNombres(),
      dtoCliente.getApellidos(),
      dtoCliente.getCedula(),
      dtoCliente.getTelefono(),
      dtoCliente.getEmail(),
      dtoCliente.getFechaNacimiento(),
      dtoCliente.getDireccion(),
      dtoCliente.getPais(),
      dtoCliente.getProvincia(),
      dtoCliente.getCiudad(),
      true,
      false,
      false,
      false,
      dtoCliente.getEsConsumidorFinal()
    );

    return await this.adaptadorBDSalida.guardar(cliente);
  }

  async editar(dtoCliente) {
    if (!dtoCliente.getId()) {
      return { estado: 'error', resultado: 'El ID es requerido para actualizar' };
    }
    if (!dtoCliente.getNombres() || !dtoCliente.getApellidos()) {
      return { estado: 'error', resultado: 'Nombres y apellidos son requeridos' };
    }

    const cliente = new Cliente(
      dtoCliente.getId(),
      dtoCliente.getNombres(),
      dtoCliente.getApellidos(),
      dtoCliente.getCedula(),
      dtoCliente.getTelefono(),
      dtoCliente.getEmail(),
      dtoCliente.getFechaNacimiento(),
      dtoCliente.getDireccion(),
      dtoCliente.getPais(),
      dtoCliente.getProvincia(),
      dtoCliente.getCiudad(),
      dtoCliente.getActivo(),
      dtoCliente.getTieneHistorialClinico(),
      dtoCliente.getTieneCredito(),
      dtoCliente.getTieneDeuda(),
      dtoCliente.getEsConsumidorFinal()
    );

    return await this.adaptadorBDSalida.actualizar(cliente);
  }

  async eliminar(dtoCliente) {
    if (!dtoCliente.getId()) {
      return { estado: 'error', resultado: 'El ID es requerido para eliminar' };
    }
    return await this.adaptadorBDSalida.eliminar(dtoCliente.getId());
  }
}
