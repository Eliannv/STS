// facturacion-servicio/src/aplicacion/uses-cases/command/VentaTarjetaCommandUsesCase.js
import { randomUUID } from 'node:crypto';
import { VentaTarjetaAbonoDTO } from '../../dto/VentaTarjetaDTO.js';
import OperacionFinanciera from '../../../dominio/entidades/OperacionFinanciera.js';

export default class VentaTarjetaCommandUsesCase {
  constructor(
    command,
    operacionCommand,
    cajaHttp,
    dominioServicio,
  ) {
    this.command = command;
    this.operacionCommand = operacionCommand;
    this.cajaHttp = cajaHttp;
    this.dominioServicio = dominioServicio;
  }

  async registrarAcreditacion(datos = {}) {
    const dto = new VentaTarjetaAbonoDTO(datos);
    if (!dto.ventaTarjetaId) {
      throw new Error('ventaTarjetaId es requerido');
    }
    if (!dto.cuentaBancoId) {
      throw new Error('cuenta_banco_id es requerido');
    }

    const idempotencyKey =
      `ACREDITACION:${dto.ventaTarjetaId}:${randomUUID()}`;

    const guardado = await this.command.registrarAcreditacion(
      dto.ventaTarjetaId,
      idempotencyKey,
      ({ venta, operacionIdExistente }) => {
        const operacionId = operacionIdExistente ?? randomUUID();
        const abono = this.dominioServicio.construirAbono(
          venta,
          dto,
          operacionId,
          idempotencyKey,
        );
        this.dominioServicio.aplicarAcreditacion(venta, abono);

        return {
          venta,
          abono,
          construirOperacion: (abonoGuardado) => this.construirOperacion(
            venta,
            abonoGuardado,
          ),
        };
      },
      this.operacionCommand,
    );

    if (guardado.idempotente) {
      return {
        estado: 'ok',
        resultado: {
          ventaTarjeta: guardado.venta,
          abono: guardado.abono,
          idempotente: true,
        },
      };
    }

    const { abono, operacion } = guardado;
    const respuestaCaja = await this.cajaHttp.postAcreditacionTarjeta(
      operacion.getPayload(),
      operacion.getTraceId(),
    );
    if (respuestaCaja.ok) {
      await this.command.actualizarEstadoAbono(abono.getId(), 'APLICADO');
      await this.operacionCommand.marcarAplicado(
        operacion.getId(),
        respuestaCaja.data,
      );
      abono.setEstado('APLICADO');
    }

    return {
      estado: 'ok',
      resultado: {
        ventaTarjeta: guardado.venta,
        abono,
        operacion,
        procesamientoCaja: respuestaCaja.ok ? 'APLICADO' : 'PENDIENTE',
      },
    };
  }

  registrarAbono(datos) {
    return this.registrarAcreditacion(datos);
  }

  construirOperacion(venta, abono) {
    const idempotencyKey = abono.getIdempotencyKey();
    const payload = {
      idempotency_key: idempotencyKey,
      idempotency_keys: {
        ingreso: `${idempotencyKey}:BRUTO`,
        comision: `${idempotencyKey}:COMISION`,
        retencion: `${idempotencyKey}:RETENCION`,
      },
      operacion_id: abono.getOperacionId(),
      venta_tarjeta_id: venta.getId(),
      abono_venta_tarjeta_id: abono.getId(),
      factura_id: venta.getFacturaId(),
      factura_codigo: venta.getFacturaIdPersonalizado(),
      monto_bruto: abono.getMontoBruto(),
      comision: abono.getComision(),
      retencion: abono.getRetencion(),
      monto_neto: abono.getMontoNeto(),
      banco: abono.getBanco(),
      numero_lote: abono.getNumeroLote(),
      numero_autorizacion: abono.getNumeroAutorizacion(),
      voucher: abono.getVoucher(),
      fecha_acreditacion: abono.getFechaAcreditacion(),
      cuenta_banco_id: abono.getCuentaBancoId(),
      referencia_tipo: 'VENTA_TARJETA',
      referencia_id: venta.getId(),
      referencia_codigo: venta.getFacturaIdPersonalizado(),
      usuario_id: abono.getUsuarioId(),
      usuario_nombre: abono.getUsuarioNombre(),
      observacion: abono.getObservacion(),
    };

    return new OperacionFinanciera({
      facturaId: venta.getFacturaId(),
      operacionId: abono.getOperacionId(),
      idempotencyKey,
      tipo: 'ACREDITACION_TARJETA',
      metodoPago: 'TARJETA',
      montoTotal: abono.getMontoBruto(),
      montoCobrado: abono.getMontoNeto(),
      montoCredito: 0,
      referenciaPago: abono.getNumeroAutorizacion(),
      estado: 'PENDIENTE',
      payload,
      traceId: abono.getTraceId(),
      usuarioId: abono.getUsuarioId(),
      usuarioNombre: abono.getUsuarioNombre(),
    });
  }
}
