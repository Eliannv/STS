// inventario-servicio/src/aplicacion/uses-cases/command/IngresoCommandUsesCase.js
import Ingreso from '../../../dominio/entidades/Ingreso.js';
import DetalleIngreso from '../../../dominio/entidades/DetalleIngreso.js';
import { randomUUID } from 'node:crypto';

export default class IngresoCommandUsesCase {
  constructor(
    adaptadorBDSalidaCommand,
    operacionFinancieraCommand = null,
    cajaSalida = null,
  ) {
    this.adaptadorBDSalida = adaptadorBDSalidaCommand;
    this.operacionFinancieraCommand = operacionFinancieraCommand;
    this.cajaSalida = cajaSalida;
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

  async finalizar(dto) {
    if (!dto.id) {
      return { estado: 'error', resultado: 'El ID es requerido para finalizar' };
    }
    dto.operacionId ??= randomUUID();
    dto.idempotencyKey ??= `COMPRA:${dto.id}`;
    const respuesta = await this.adaptadorBDSalida.finalizar(dto);
    return this.procesarOperacionPendiente(respuesta);
  }

  async eliminar(dto) {
    if (!dto.id) {
      return { estado: 'error', resultado: 'El ID es requerido para eliminar' };
    }
    dto.operacionId ??= randomUUID();
    dto.idempotencyKey ??= `ANULACION_COMPRA:${dto.id}`;
    const respuesta = await this.adaptadorBDSalida.eliminar(dto);
    return this.procesarOperacionPendiente(respuesta);
  }

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

  async procesarOperacionPendiente(respuesta) {
    const operacion = respuesta?.operacionFinanciera;
    if (
      respuesta?.estado !== 'ok'
      || !operacion
      || !this.operacionFinancieraCommand
      || !this.cajaSalida
    ) {
      return respuesta;
    }

    const envio = operacion.getTipo() === 'COMPRA_CONTADO'
      || operacion.getTipo() === 'COMPRA_CREDITO'
      ? await this.cajaSalida.postCompra(
        operacion.getPayload(),
        operacion.getTraceId(),
      )
      : await this.cajaSalida.postAnulacionCompra(
        operacion.getPayload(),
        operacion.getTraceId(),
      );

    if (envio.ok) {
      await this.operacionFinancieraCommand.marcarAplicada(
        operacion.getId(),
        envio.data,
      );
      const cuentaPagarId = envio.data?.cuenta_pagar_id ?? null;
      if (cuentaPagarId) {
        await this.operacionFinancieraCommand.vincularCuentaPagar(
          operacion.getId(),
          cuentaPagarId,
        );
      }
      return {
        ...respuesta,
        estadoFinanciero: 'APLICADO',
        cuentaPagarId,
      };
    }

    return {
      ...respuesta,
      estadoFinanciero: 'PENDIENTE',
      advertenciaFinanciera:
        'El inventario fue confirmado; la operación financiera será reintentada.',
    };
  }
}
