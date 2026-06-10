// src/aplicacion/uses-cases/command/FacturaCommandUsesCase.js
import Factura from '../../../dominio/entidades/Factura.js';
import { FacturaDTO } from '../../dto/FacturaDTO.js';

export default class FacturaCommandUsesCase {
  constructor(ventaCommandAdaptador) {
    this._adaptador = ventaCommandAdaptador;
  }

  async crear(datos) {
    const dto = new FacturaDTO(datos);
    if (dto.getTotal() == null) return { estado: 'error', resultado: 'total es requerido' };
    if (!dto.getNombreCliente() && !dto.getClienteId()) return { estado: 'error', resultado: 'Se requiere cliente o nombre de cliente' };

    const venta = new Factura(
      null,
      dto.getClienteId(),
      dto.getNumeroFactura(),
      dto.getTipo(),
      dto.getEstado(),
      dto.getSubtotal(),
      dto.getDescuento(),
      dto.getTotal(),
      dto.getSaldoPendiente(),
      dto.getObservacion(),
      dto.getUsuarioId(),
      dto.getNombreCliente(),
      dto.getMetodoPago(),
      dto.getHistorialClinicoId(),
      dto.getFechaPago(),
      dto.getItems(),
    );
    return this._adaptador.guardar(venta);
  }

  async editar(datos) {
    const dto = new FacturaDTO(datos);
    if (!dto.getId())      return { estado: 'error', resultado: 'id es requerido' };
    if (!dto.getClienteId()) return { estado: 'error', resultado: 'clienteId es requerido' };

    const venta = new Factura(
      dto.getId(),
      dto.getClienteId(),
      dto.getNumeroFactura(),
      dto.getTipo(),
      dto.getEstado(),
      dto.getSubtotal(),
      dto.getDescuento(),
      dto.getTotal(),
      dto.getSaldoPendiente(),
      dto.getObservacion(),
      dto.getUsuarioId(),
    );
    return this._adaptador.actualizar(venta);
  }

  async cobrar(id) {
    if (!id) return { estado: 'error', resultado: 'id es requerido' };
    return this._adaptador.cobrar(id);
  }

  async eliminar(id) {
    if (!id) return { estado: 'error', resultado: 'id es requerido' };
    return this._adaptador.eliminar(id);
  }
}
