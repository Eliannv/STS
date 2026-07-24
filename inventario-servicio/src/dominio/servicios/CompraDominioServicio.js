// inventario-servicio/src/dominio/servicios/CompraDominioServicio.js
import OperacionFinancieraInventario from '../entidades/OperacionFinancieraInventario.js';

const redondear = (valor) => parseFloat(Number(valor ?? 0).toFixed(2));

const requerido = (valor, campo) => {
  if (valor === null || valor === undefined || valor === '') {
    throw new Error(`${campo} es requerido`);
  }
  return valor;
};

export default class CompraDominioServicio {
  validarDatosFinancieros(ingreso, contexto = {}) {
    requerido(contexto.operacionId, 'operacion_id');
    requerido(contexto.idempotencyKey, 'idempotency_key');

    if (!['CONTADO', 'CREDITO'].includes(ingreso.tipo_compra)) {
      throw new Error('tipo_compra debe ser CONTADO o CREDITO');
    }

    if (ingreso.tipo_compra === 'CONTADO') {
      if (!['EFECTIVO', 'TRANSFERENCIA'].includes(contexto.metodoPago)) {
        throw new Error('metodo_pago debe ser EFECTIVO o TRANSFERENCIA');
      }
      if (!['BANCO', 'CHICA'].includes(contexto.cajaTipo)) {
        throw new Error('caja_tipo debe ser BANCO o CHICA');
      }
      requerido(contexto.cajaId, 'caja_id');
    }
  }

  construirOperacionCompra(ingreso, montoTotal, contexto = {}) {
    this.validarDatosFinancieros(ingreso, contexto);
    const tipoCompra = ingreso.tipo_compra;
    const payload = {
      idempotency_key: contexto.idempotencyKey,
      operacion_id: contexto.operacionId,
      ingreso_id: ingreso.id,
      ingreso_codigo: ingreso.id_personalizado || ingreso.numero_factura,
      proveedor_id: ingreso.proveedor_id,
      proveedor_nombre: ingreso.proveedor_nombre,
      tipo_compra: tipoCompra,
      metodo_pago: tipoCompra === 'CONTADO' ? contexto.metodoPago : null,
      monto_total: redondear(montoTotal),
      caja_tipo: tipoCompra === 'CONTADO' ? contexto.cajaTipo : null,
      caja_id: tipoCompra === 'CONTADO' ? Number(contexto.cajaId) : null,
      fecha_vencimiento: contexto.fechaVencimiento ?? null,
      usuario_id: contexto.usuarioId ?? ingreso.usuario_id ?? null,
      usuario_nombre: contexto.usuarioNombre ?? null,
      sucursal_id: contexto.sucursalId ?? null,
      observacion: ingreso.observacion ?? null,
    };

    return new OperacionFinancieraInventario({
      ingresoId: ingreso.id,
      operacionId: contexto.operacionId,
      idempotencyKey: contexto.idempotencyKey,
      tipo: tipoCompra === 'CONTADO' ? 'COMPRA_CONTADO' : 'COMPRA_CREDITO',
      tipoCompra,
      metodoPago: payload.metodo_pago,
      cajaTipo: payload.caja_tipo,
      cajaId: payload.caja_id,
      montoTotal: payload.monto_total,
      fechaVencimiento: payload.fecha_vencimiento,
      payload,
      traceId: contexto.traceId ?? null,
      usuarioId: payload.usuario_id,
      usuarioNombre: payload.usuario_nombre,
      sucursalId: payload.sucursal_id,
    });
  }

  construirOperacionAnulacion(ingreso, contexto = {}) {
    requerido(contexto.operacionId, 'operacion_id');
    requerido(contexto.idempotencyKey, 'idempotency_key');
    requerido(contexto.motivo, 'motivo');

    const esCredito = ingreso.tipo_compra === 'CREDITO';
    const conReembolso = contexto.conReembolso === true;
    if (!esCredito && !conReembolso) return null;
    if (conReembolso) {
      requerido(contexto.operacionIdOriginal, 'operacion_id_original');
    }

    const tipo = conReembolso ? 'DEVOLUCION_PROVEEDOR' : 'ANULACION_COMPRA';
    const payload = {
      idempotency_key: contexto.idempotencyKey,
      operacion_id: contexto.operacionId,
      operacion_id_original: contexto.operacionIdOriginal ?? null,
      ingreso_id: ingreso.id,
      ingreso_codigo: ingreso.id_personalizado || ingreso.numero_factura,
      cuenta_pagar_id: ingreso.cuenta_pagar_id ?? null,
      tipo_compra: ingreso.tipo_compra,
      con_reembolso: conReembolso,
      monto_total: redondear(ingreso.total),
      caja_tipo: conReembolso
        ? contexto.cajaTipo ?? ingreso.caja_tipo
        : null,
      caja_id: conReembolso
        ? Number(contexto.cajaId ?? ingreso.caja_id)
        : null,
      motivo: contexto.motivo,
      usuario_id: contexto.usuarioId ?? null,
      usuario_nombre: contexto.usuarioNombre ?? null,
      sucursal_id: contexto.sucursalId ?? null,
    };

    if (conReembolso) {
      if (!['BANCO', 'CHICA'].includes(payload.caja_tipo)) {
        throw new Error('caja_tipo debe ser BANCO o CHICA para registrar el reembolso');
      }
      requerido(payload.caja_id, 'caja_id');
    }

    return new OperacionFinancieraInventario({
      ingresoId: ingreso.id,
      cuentaPagarId: payload.cuenta_pagar_id,
      operacionId: contexto.operacionId,
      operacionIdOriginal: contexto.operacionIdOriginal ?? null,
      idempotencyKey: contexto.idempotencyKey,
      tipo,
      tipoCompra: ingreso.tipo_compra,
      cajaTipo: payload.caja_tipo,
      cajaId: payload.caja_id,
      montoTotal: payload.monto_total,
      payload,
      motivo: contexto.motivo,
      traceId: contexto.traceId ?? null,
      usuarioId: payload.usuario_id,
      usuarioNombre: payload.usuario_nombre,
      sucursalId: payload.sucursal_id,
    });
  }
}
