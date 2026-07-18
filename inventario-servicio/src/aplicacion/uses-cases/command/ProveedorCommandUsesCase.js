import Proveedor from '../../../dominio/entidades/Proveedor.js';

export default class ProveedorCommandUsesCase {
  constructor(adaptadorBDSalidaCommand) {
    this.adaptadorBDSalida = adaptadorBDSalidaCommand;
  }

  crear(dtoProveedor) {
    if (!dtoProveedor.nombre || !dtoProveedor.ruc) {
      return Promise.resolve({ estado: 'error', resultado: 'El nombre y RUC del proveedor son requeridos' });
    }
    return this.adaptadorBDSalida.guardar(new Proveedor(null, { ...dtoProveedor, activo: true }));
  }

  editar(dtoProveedor) {
    if (!dtoProveedor.id || !dtoProveedor.nombre || !dtoProveedor.ruc) {
      return Promise.resolve({ estado: 'error', resultado: 'ID, nombre y RUC son requeridos' });
    }
    return this.adaptadorBDSalida.actualizar(new Proveedor(dtoProveedor.id, dtoProveedor));
  }

  eliminar(dtoProveedor) {
    return dtoProveedor.id
      ? this.adaptadorBDSalida.eliminar(dtoProveedor.id)
      : Promise.resolve({ estado: 'error', resultado: 'El ID es requerido para eliminar' });
  }
}
