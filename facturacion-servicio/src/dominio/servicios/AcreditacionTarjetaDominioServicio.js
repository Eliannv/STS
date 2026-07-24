// facturacion-servicio/src/dominio/servicios/AcreditacionTarjetaDominioServicio.js
import AbonoVentaTarjeta from '../entidades/AbonoVentaTarjeta.js';

const redondear = (valor) => parseFloat(Number(valor ?? 0).toFixed(2));

export default class AcreditacionTarjetaDominioServicio {
  calcularMontoNeto(montoBruto, comision = 0, retencion = 0) {
    const bruto = redondear(montoBruto);
    const costoComision = redondear(comision);
    const costoRetencion = redondear(retencion);
    if (!(bruto > 0)) {
      throw new Error('El monto bruto debe ser mayor que cero');
    }
    if (costoComision < 0 || costoRetencion < 0) {
      throw new Error('La comisión y la retención no pueden ser negativas');
    }
    if (bruto < costoComision + costoRetencion) {
      throw new Error('El monto bruto debe ser mayor o igual a comisión más retención');
    }
    return redondear(bruto - costoComision - costoRetencion);
  }

  validarAcreditacion(venta, params = {}) {
    if (venta.getEstado() === 'ANULADA') {
      throw new Error('No se puede acreditar una venta anulada');
    }
    if (venta.getEstado() === 'ACREDITADA') {
      throw new Error('La venta ya está completamente acreditada');
    }
    if (['RECHAZADA', 'LEGACY_LIQUIDADA'].includes(venta.getEstado())) {
      throw new Error(`No se puede acreditar una venta en estado ${venta.getEstado()}`);
    }

    const montoBruto = redondear(params.montoBruto ?? params.monto_bruto);
    const comision = redondear(params.comision);
    const retencion = redondear(params.retencion);
    const montoNeto = this.calcularMontoNeto(montoBruto, comision, retencion);
    const montoEsperado = redondear(venta.getMontoTotal());
    const acreditado = redondear(venta.getMontoBrutoAcreditado());
    const nuevoTotal = redondear(acreditado + montoBruto);
    if (nuevoTotal > montoEsperado) {
      const autorizado =
        params.autorizarExceso === true
        || params.autorizar_exceso === true;
      const justificacion =
        params.justificacionExceso
        ?? params.justificacion_exceso;
      if (!autorizado || !String(justificacion ?? '').trim()) {
        throw new Error(
          'La acreditación supera el monto esperado y requiere autorización con justificación',
        );
      }
    }

    return {
      montoBruto,
      comision,
      retencion,
      montoNeto,
      nuevoTotal,
    };
  }

  construirAbono(venta, params, operacionId, idempotencyKey) {
    const montos = this.validarAcreditacion(venta, params);
    const justificacion =
      params.justificacionExceso
      ?? params.justificacion_exceso
      ?? null;
    const observacion = [
      params.observacion,
      justificacion ? `Exceso autorizado: ${justificacion}` : null,
    ].filter(Boolean).join(' | ') || null;

    return new AbonoVentaTarjeta({
      ventaTarjetaId: venta.getId(),
      fecha: params.fechaAcreditacion ?? params.fecha_acreditacion ?? new Date(),
      monto: montos.montoBruto,
      montoBruto: montos.montoBruto,
      comision: montos.comision,
      retencion: montos.retencion,
      montoNeto: montos.montoNeto,
      banco: params.banco ?? venta.getBanco(),
      numeroLote: params.numeroLote ?? params.numero_lote,
      numeroAutorizacion:
        params.numeroAutorizacion
        ?? params.numero_autorizacion,
      voucher: params.voucher,
      fechaAcreditacion:
        params.fechaAcreditacion
        ?? params.fecha_acreditacion
        ?? new Date(),
      cuentaBancoId: params.cuentaBancoId ?? params.cuenta_banco_id,
      operacionId,
      idempotencyKey,
      usuarioId: params.usuarioId ?? params.usuario_id,
      usuarioNombre: params.usuarioNombre ?? params.usuario_nombre,
      traceId: params.traceId,
      observacion,
      estado: 'PENDIENTE',
    });
  }

  aplicarAcreditacion(venta, abono) {
    const montoBrutoAcreditado = redondear(
      Number(venta.getMontoBrutoAcreditado()) + Number(abono.getMontoBruto()),
    );
    const montoNetoAcreditado = redondear(
      Number(venta.getMontoNetoAcreditado()) + Number(abono.getMontoNeto()),
    );
    const comisionAcumulada = redondear(
      Number(venta.getComisionAcumulada()) + Number(abono.getComision()),
    );
    const retencionAcumulada = redondear(
      Number(venta.getRetencionAcumulada()) + Number(abono.getRetencion()),
    );
    const montoTotal = redondear(venta.getMontoTotal());
    const saldoPendiente = redondear(Math.max(0, montoTotal - montoBrutoAcreditado));
    const estado = montoBrutoAcreditado >= montoTotal
      ? 'ACREDITADA'
      : 'PARCIALMENTE_ACREDITADA';

    venta.setMontoRecibido(montoBrutoAcreditado);
    venta.setSaldoPendiente(saldoPendiente);
    venta.setMontoBrutoAcreditado(montoBrutoAcreditado);
    venta.setMontoNetoAcreditado(montoNetoAcreditado);
    venta.setComisionAcumulada(comisionAcumulada);
    venta.setRetencionAcumulada(retencionAcumulada);
    venta.setFechaUltimaAcreditacion(abono.getFechaAcreditacion());
    venta.setEstado(estado);
    venta.setCuentaBancoId(abono.getCuentaBancoId());
    venta.setUpdatedAt(new Date());
    return venta;
  }
}
