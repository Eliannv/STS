// src/aplicacion/uses-cases/command/SucursalCommandUsesCase.js
import Sucursal from '../../../dominio/entidades/Sucursal.js';

export default class SucursalCommandUsesCase {
  constructor(adaptadorBDSalidaCommand) {
    this.adaptadorBDSalida = adaptadorBDSalidaCommand;
  }

  async crear(dtoSucursal) {
    if (!dtoSucursal.getCodigo() || !dtoSucursal.getNombre()) {
      return { estado: 'error', resultado: 'Código y nombre son requeridos' };
    }

    const sucursal = new Sucursal(
      null,
      dtoSucursal.getCodigo(),
      dtoSucursal.getNombre(),
      true,
      dtoSucursal.getDireccion(),
      dtoSucursal.getTelefono(),
      dtoSucursal.getCreadoPorId()
    );

    return await this.adaptadorBDSalida.guardar(sucursal);
  }

  async editar(dtoSucursal) {
    if (!dtoSucursal.getId()) {
      return { estado: 'error', resultado: 'El ID es requerido para actualizar' };
    }
    if (!dtoSucursal.getCodigo() || !dtoSucursal.getNombre()) {
      return { estado: 'error', resultado: 'Código y nombre son requeridos' };
    }

    const sucursal = new Sucursal(
      dtoSucursal.getId(),
      dtoSucursal.getCodigo(),
      dtoSucursal.getNombre(),
      dtoSucursal.getActivo(),
      dtoSucursal.getDireccion(),
      dtoSucursal.getTelefono(),
      null
    );

    return await this.adaptadorBDSalida.actualizar(sucursal);
  }

  async eliminar(dtoSucursal) {
    if (!dtoSucursal.getId()) {
      return { estado: 'error', resultado: 'El ID es requerido para eliminar' };
    }
    return await this.adaptadorBDSalida.eliminar(dtoSucursal.getId());
  }
}
