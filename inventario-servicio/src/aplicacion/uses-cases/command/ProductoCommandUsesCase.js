import Producto from '../../../dominio/entidades/Producto.js';

export default class ProductoCommandUsesCase {
  constructor(adaptadorBDSalidaCommand) {
    this.adaptadorBDSalida = adaptadorBDSalidaCommand;
  }

  crear(dtoProducto) {
    if (!dtoProducto.nombre || !dtoProducto.codigo) {
      return Promise.resolve({ estado: 'error', resultado: 'El nombre y código del producto son requeridos' });
    }
    return this.adaptadorBDSalida.guardar(new Producto(null, { ...dtoProducto, activo: true }));
  }

  editar(dtoProducto) {
    if (!dtoProducto.id || !dtoProducto.nombre || !dtoProducto.codigo) {
      return Promise.resolve({ estado: 'error', resultado: 'ID, nombre y código son requeridos' });
    }
    return this.adaptadorBDSalida.actualizar(new Producto(dtoProducto.id, dtoProducto));
  }

  eliminar(dtoProducto) {
    return dtoProducto.id
      ? this.adaptadorBDSalida.eliminar(dtoProducto.id)
      : Promise.resolve({ estado: 'error', resultado: 'El ID es requerido para eliminar' });
  }

  reducirStock(items) {
    if (!items || items.length === 0) {
      return Promise.resolve({ estado: 'error', resultado: 'Se requiere un array de items con productoId y cantidad' });
    }
    return this.adaptadorBDSalida.reducirStock(items);
  }
}
