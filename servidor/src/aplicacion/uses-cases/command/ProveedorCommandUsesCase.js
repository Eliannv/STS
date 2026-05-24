// src/aplicacion/uses-cases/command/ProveedorCommandUsesCase.js
import Proveedor from '../../../dominio/entidades/Proveedor.js';

export default class ProveedorCommandUsesCase {
  constructor(adaptadorBDSalidaCommand) {
    this.adaptadorBDSalida = adaptadorBDSalidaCommand;
  }

  async crear(dtoProveedor) {
    if (!dtoProveedor.getNombre()) {
      return { estado: 'error', resultado: 'El nombre del proveedor es requerido' };
    }
    if (!dtoProveedor.getRuc()) {
      return { estado: 'error', resultado: 'El RUC del proveedor es requerido' };
    }

    const proveedor = new Proveedor(
      null,
      dtoProveedor.getCodigo(),
      dtoProveedor.getNombre(),
      dtoProveedor.getRepresentante(),
      dtoProveedor.getRuc(),
      dtoProveedor.getTelefonoPrincipal(),
      dtoProveedor.getTelefonoSecundario(),
      dtoProveedor.getCodigoLugar(),
      dtoProveedor.getDireccion(),
      dtoProveedor.getFechaIngreso(),
      dtoProveedor.getSaldo(),
      true
    );

    return await this.adaptadorBDSalida.guardar(proveedor);
  }

  async editar(dtoProveedor) {
    if (!dtoProveedor.getId()) {
      return { estado: 'error', resultado: 'El ID es requerido para actualizar' };
    }
    if (!dtoProveedor.getNombre()) {
      return { estado: 'error', resultado: 'El nombre del proveedor es requerido' };
    }
    if (!dtoProveedor.getRuc()) {
      return { estado: 'error', resultado: 'El RUC del proveedor es requerido' };
    }

    const proveedor = new Proveedor(
      dtoProveedor.getId(),
      dtoProveedor.getCodigo(),
      dtoProveedor.getNombre(),
      dtoProveedor.getRepresentante(),
      dtoProveedor.getRuc(),
      dtoProveedor.getTelefonoPrincipal(),
      dtoProveedor.getTelefonoSecundario(),
      dtoProveedor.getCodigoLugar(),
      dtoProveedor.getDireccion(),
      dtoProveedor.getFechaIngreso(),
      dtoProveedor.getSaldo(),
      dtoProveedor.getActivo()
    );

    return await this.adaptadorBDSalida.actualizar(proveedor);
  }

  async eliminar(dtoProveedor) {
    if (!dtoProveedor.getId()) {
      return { estado: 'error', resultado: 'El ID es requerido para eliminar' };
    }
    return await this.adaptadorBDSalida.eliminar(dtoProveedor.getId());
  }
}
