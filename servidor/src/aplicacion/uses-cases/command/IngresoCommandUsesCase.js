// src/aplicacion/uses-cases/command/IngresoCommandUsesCase.js
import Ingreso       from '../../../dominio/entidades/Ingreso.js';
import DetalleIngreso from '../../../dominio/entidades/DetalleIngreso.js';

export default class IngresoCommandUsesCase {
  constructor(adaptadorBDSalidaCommand) {
    this.adaptadorBDSalida = adaptadorBDSalidaCommand;
  }

  // ── Ingreso ──────────────────────────────────────────────────────────────

  async crear(dtoIngreso) {
    if (!dtoIngreso.getNumeroFactura()) {
      return { estado: 'error', resultado: 'El número de factura es requerido' };
    }
    if (!dtoIngreso.getFecha()) {
      return { estado: 'error', resultado: 'La fecha es requerida' };
    }

    const ingreso = new Ingreso(
      null,
      null,
      dtoIngreso.getProveedorId(),
      dtoIngreso.getProveedorNombre(),
      dtoIngreso.getNumeroFactura(),
      dtoIngreso.getFecha(),
      dtoIngreso.getTipoCompra(),
      dtoIngreso.getObservacion(),
      dtoIngreso.getDescuento(),
      dtoIngreso.getFlete(),
      dtoIngreso.getIva(),
      dtoIngreso.getTotal(),
      'BORRADOR',
      dtoIngreso.getUsuarioId()
    );

    const detalles = dtoIngreso.getDetalles().map(d => new DetalleIngreso(
      null, null,
      d.productoId, d.tipo, d.codigo, d.nombre, d.grupo,
      d.stockIngresado, d.costoUnitario, d.subtotal
    ));

    return await this.adaptadorBDSalida.guardar(ingreso, detalles);
  }

  async editar(dtoIngreso) {
    if (!dtoIngreso.getId()) {
      return { estado: 'error', resultado: 'El ID es requerido para actualizar' };
    }
    if (!dtoIngreso.getNumeroFactura()) {
      return { estado: 'error', resultado: 'El número de factura es requerido' };
    }
    if (!dtoIngreso.getFecha()) {
      return { estado: 'error', resultado: 'La fecha es requerida' };
    }

    const ingreso = new Ingreso(
      dtoIngreso.getId(),
      null,
      dtoIngreso.getProveedorId(),
      dtoIngreso.getProveedorNombre(),
      dtoIngreso.getNumeroFactura(),
      dtoIngreso.getFecha(),
      dtoIngreso.getTipoCompra(),
      dtoIngreso.getObservacion(),
      dtoIngreso.getDescuento(),
      dtoIngreso.getFlete(),
      dtoIngreso.getIva(),
      dtoIngreso.getTotal(),
      null,
      dtoIngreso.getUsuarioId()
    );

    return await this.adaptadorBDSalida.actualizar(ingreso);
  }

  async finalizar(dtoIngreso) {
    if (!dtoIngreso.getId()) {
      return { estado: 'error', resultado: 'El ID es requerido para finalizar' };
    }
    return await this.adaptadorBDSalida.finalizar(dtoIngreso.getId());
  }

  async eliminar(dtoIngreso) {
    if (!dtoIngreso.getId()) {
      return { estado: 'error', resultado: 'El ID es requerido para eliminar' };
    }
    return await this.adaptadorBDSalida.eliminar(dtoIngreso.getId());
  }

  // ── Detalle ───────────────────────────────────────────────────────────────

  async agregarDetalle(dtoDetalle) {
    if (!dtoDetalle.getIngresoId()) {
      return { estado: 'error', resultado: 'El ID del ingreso es requerido' };
    }
    const tipo = dtoDetalle.getTipo();
    if (!['EXISTENTE', 'NUEVO'].includes(tipo)) {
      return { estado: 'error', resultado: 'El tipo debe ser EXISTENTE o NUEVO' };
    }
    if (tipo === 'EXISTENTE' && !dtoDetalle.getProductoId()) {
      return { estado: 'error', resultado: 'Para tipo EXISTENTE se requiere el ID del producto' };
    }
    if (tipo === 'NUEVO' && !dtoDetalle.getNombre()) {
      return { estado: 'error', resultado: 'Para tipo NUEVO se requiere el nombre del producto' };
    }
    if (dtoDetalle.getStockIngresado() <= 0) {
      return { estado: 'error', resultado: 'El stock ingresado debe ser mayor a 0' };
    }

    const detalle = new DetalleIngreso(
      null,
      dtoDetalle.getIngresoId(),
      dtoDetalle.getProductoId(),
      tipo,
      dtoDetalle.getCodigo(),
      dtoDetalle.getNombre(),
      dtoDetalle.getGrupo(),
      dtoDetalle.getStockIngresado(),
      dtoDetalle.getCostoUnitario(),
      dtoDetalle.getSubtotal()
    );

    return await this.adaptadorBDSalida.guardarDetalle(detalle);
  }

  async editarDetalle(dtoDetalle) {
    if (!dtoDetalle.getId()) {
      return { estado: 'error', resultado: 'El ID del detalle es requerido' };
    }
    if (dtoDetalle.getStockIngresado() <= 0) {
      return { estado: 'error', resultado: 'El stock ingresado debe ser mayor a 0' };
    }

    const detalle = new DetalleIngreso(
      dtoDetalle.getId(),
      dtoDetalle.getIngresoId(),
      dtoDetalle.getProductoId(),
      dtoDetalle.getTipo(),
      dtoDetalle.getCodigo(),
      dtoDetalle.getNombre(),
      dtoDetalle.getGrupo(),
      dtoDetalle.getStockIngresado(),
      dtoDetalle.getCostoUnitario(),
      dtoDetalle.getSubtotal()
    );

    return await this.adaptadorBDSalida.actualizarDetalle(detalle);
  }

  async eliminarDetalle(dtoDetalle) {
    if (!dtoDetalle.getId()) {
      return { estado: 'error', resultado: 'El ID del detalle es requerido' };
    }
    return await this.adaptadorBDSalida.eliminarDetalle(dtoDetalle.getId());
  }
}
