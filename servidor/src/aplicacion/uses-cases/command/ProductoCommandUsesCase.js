// src/aplicacion/uses-cases/command/ProductoCommandUsesCase.js
import Producto from '../../../dominio/entidades/Producto.js';

export default class ProductoCommandUsesCase {
  constructor(adaptadorBDSalidaCommand) {
    this.adaptadorBDSalida = adaptadorBDSalidaCommand;
  }

  async crear(dtoProducto) {
    if (!dtoProducto.getNombre()) {
      return { estado: 'error', resultado: 'El nombre del producto es requerido' };
    }
    if (!dtoProducto.getCodigo()) {
      return { estado: 'error', resultado: 'El código del producto es requerido' };
    }

    const producto = new Producto(
      null,
      dtoProducto.getIdInterno(),
      dtoProducto.getCodigo(),
      dtoProducto.getNombre(),
      dtoProducto.getModelo(),
      dtoProducto.getColor(),
      dtoProducto.getGrupo(),
      dtoProducto.getStock(),
      dtoProducto.getTipoControlStock(),
      dtoProducto.getCosto(),
      dtoProducto.getPvp1(),
      dtoProducto.getIva(),
      dtoProducto.getPrecioConIva(),
      dtoProducto.getProveedorId(),
      dtoProducto.getIngresoId(),
      dtoProducto.getObservacion(),
      true
    );

    return await this.adaptadorBDSalida.guardar(producto);
  }

  async editar(dtoProducto) {
    if (!dtoProducto.getId()) {
      return { estado: 'error', resultado: 'El ID es requerido para actualizar' };
    }
    if (!dtoProducto.getNombre()) {
      return { estado: 'error', resultado: 'El nombre del producto es requerido' };
    }
    if (!dtoProducto.getCodigo()) {
      return { estado: 'error', resultado: 'El código del producto es requerido' };
    }

    const producto = new Producto(
      dtoProducto.getId(),
      dtoProducto.getIdInterno(),
      dtoProducto.getCodigo(),
      dtoProducto.getNombre(),
      dtoProducto.getModelo(),
      dtoProducto.getColor(),
      dtoProducto.getGrupo(),
      dtoProducto.getStock(),
      dtoProducto.getTipoControlStock(),
      dtoProducto.getCosto(),
      dtoProducto.getPvp1(),
      dtoProducto.getIva(),
      dtoProducto.getPrecioConIva(),
      dtoProducto.getProveedorId(),
      dtoProducto.getIngresoId(),
      dtoProducto.getObservacion(),
      dtoProducto.getActivo()
    );

    return await this.adaptadorBDSalida.actualizar(producto);
  }

  async eliminar(dtoProducto) {
    if (!dtoProducto.getId()) {
      return { estado: 'error', resultado: 'El ID es requerido para eliminar' };
    }
    return await this.adaptadorBDSalida.eliminar(dtoProducto.getId());
  }
}
