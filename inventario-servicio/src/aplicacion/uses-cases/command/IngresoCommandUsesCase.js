import Ingreso from '../../../dominio/entidades/Ingreso.js';
import DetalleIngreso from '../../../dominio/entidades/DetalleIngreso.js';

export default class IngresoCommandUsesCase {
  constructor(adaptadorBDSalidaCommand) {
    this.adaptadorBDSalida = adaptadorBDSalidaCommand;
  }

  crear(dto) {
    if (!dto.numeroFactura) return Promise.resolve({ estado: 'error', resultado: 'El número de factura es requerido' });
    if (!dto.fecha) return Promise.resolve({ estado: 'error', resultado: 'La fecha es requerida' });
    return this.adaptadorBDSalida.guardar(new Ingreso(null, { ...dto, estado: 'BORRADOR' }), dto.detalles.map((detalle) => new DetalleIngreso(null, detalle)));
  }

  editar(dto) {
    if (!dto.id || !dto.numeroFactura || !dto.fecha) return Promise.resolve({ estado: 'error', resultado: 'ID, número de factura y fecha son requeridos' });
    return this.adaptadorBDSalida.actualizar(new Ingreso(dto.id, dto));
  }

  finalizar(dto) { return dto.id ? this.adaptadorBDSalida.finalizar(dto) : Promise.resolve({ estado: 'error', resultado: 'El ID es requerido para finalizar' }); }
  eliminar(dto) { return dto.id ? this.adaptadorBDSalida.eliminar(dto) : Promise.resolve({ estado: 'error', resultado: 'El ID es requerido para eliminar' }); }

  agregarDetalle(dto) {
    if (!dto.ingresoId) return Promise.resolve({ estado: 'error', resultado: 'El ID del ingreso es requerido' });
    if (!['EXISTENTE', 'NUEVO'].includes(dto.tipo)) return Promise.resolve({ estado: 'error', resultado: 'El tipo debe ser EXISTENTE o NUEVO' });
    if (dto.tipo === 'EXISTENTE' && !dto.productoId) return Promise.resolve({ estado: 'error', resultado: 'Para tipo EXISTENTE se requiere el ID del producto' });
    if (dto.tipo === 'NUEVO' && !dto.nombre) return Promise.resolve({ estado: 'error', resultado: 'Para tipo NUEVO se requiere el nombre del producto' });
    if (dto.stockIngresado <= 0) return Promise.resolve({ estado: 'error', resultado: 'El stock ingresado debe ser mayor a 0' });
    return this.adaptadorBDSalida.guardarDetalle(new DetalleIngreso(null, dto));
  }

  editarDetalle(dto) {
    if (!dto.id) return Promise.resolve({ estado: 'error', resultado: 'El ID del detalle es requerido' });
    if (dto.stockIngresado <= 0) return Promise.resolve({ estado: 'error', resultado: 'El stock ingresado debe ser mayor a 0' });
    return this.adaptadorBDSalida.actualizarDetalle(new DetalleIngreso(dto.id, dto));
  }

  eliminarDetalle(dto) { return dto.id ? this.adaptadorBDSalida.eliminarDetalle(dto.id) : Promise.resolve({ estado: 'error', resultado: 'El ID del detalle es requerido' }); }
}
