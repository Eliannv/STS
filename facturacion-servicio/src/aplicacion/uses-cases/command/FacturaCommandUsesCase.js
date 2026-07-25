// facturacion-servicio/src/aplicacion/uses-cases/command/FacturaCommandUsesCase.js
import { randomUUID } from 'node:crypto';
import Factura from '../../../dominio/entidades/Factura.js';
import OperacionFinanciera from '../../../dominio/entidades/OperacionFinanciera.js';

const redondear = (valor) => parseFloat(Number(valor ?? 0).toFixed(2));

const normalizarMetodo = (valor) => String(valor ?? '').trim().toUpperCase();

export default class FacturaCommandUsesCase {
  constructor(
    adaptador,
    query,
    inventarioStock,
    operacionFinancieraCommand = null,
    cajaHttp = null,
    operacionFinancieraQuery = null,
  ) {
    this.adaptador = adaptador;
    this.query = query;
    this.inventarioStock = inventarioStock;
    this.operacionFinancieraCommand = operacionFinancieraCommand;
    this.cajaHttp = cajaHttp;
    this.operacionFinancieraQuery = operacionFinancieraQuery;
  }

  async crear(datos) {
    if (datos.total == null) return Promise.resolve({ estado: 'error', resultado: 'total es requerido' });
    if (!datos.clienteId && !datos.nombreCliente) return Promise.resolve({ estado: 'error', resultado: 'Se requiere cliente o nombre de cliente' });
    const venta = new Factura(null, datos);
    const guardado = await this.adaptador.guardar(
      venta,
      (factura) => this.construirOperacionVenta(factura, venta, datos),
    );
    if (guardado.estado !== 'ok') return guardado;

    const factura = guardado.resultado;
    const operacion = guardado.operacionFinanciera;
    if (operacion && this.cajaHttp && this.operacionFinancieraCommand) {
      const respuestaCaja = await this.cajaHttp.postVenta(
        operacion.getPayload(),
        operacion.getTraceId(),
      );
      if (respuestaCaja.ok) {
        await this.operacionFinancieraCommand.marcarAplicado(
          operacion.getId(),
          respuestaCaja.data,
        );
      }
    }

    const inventario = await this.inventarioStock.aplicarVenta({ factura, items: venta.items, contexto: venta });
    if (inventario.estado !== 'ok') {
      await this.adaptador.actualizarEstadoInventario(factura.id, 'ERROR');
      return { estado: 'error', resultado: `La factura ${factura.id_personalizado || factura.id} fue creada, pero inventario no pudo confirmarla: ${inventario.resultado}`, facturaId: factura.id };
    }

    const estadoInventario = inventario.noAplica ? 'NO_APLICA' : 'APLICADO';
    await this.adaptador.actualizarEstadoInventario(factura.id, estadoInventario);
    factura.setDataValue?.('estado_inventario', estadoInventario);
    return { estado: 'ok', resultado: factura };
  }

  construirOperacionVenta(factura, venta, datos) {
    const metodoPago = normalizarMetodo(venta.metodoPago);
    if (metodoPago === 'TARJETA') {
      return null;
    }
    const montoTotal = redondear(venta.total);
    const montoCredito = redondear(venta.saldoPendiente);
    const montoPagado = redondear(Math.max(0, montoTotal - montoCredito));
    const montoCobrado = montoPagado;

    if (montoCobrado === 0 && montoCredito === 0) {
      return null;
    }

    let metodoCobro = null;
    if (montoCobrado > 0) {
      if (!['EFECTIVO', 'TRANSFERENCIA'].includes(metodoPago)) {
        throw new Error('metodo_cobro es obligatorio para el monto cobrado');
      }
      metodoCobro = metodoPago;
    }

    let tipo = 'VENTA_CREDITO';
    if (montoCobrado > 0 && montoCredito > 0) {
      tipo = 'VENTA_MIXTA';
    } else if (montoCobrado > 0) {
      tipo = metodoCobro === 'EFECTIVO'
        ? 'VENTA_EFECTIVO'
        : 'VENTA_TRANSFERENCIA';
    }

    const operacionId = randomUUID();
    const idempotencyKey = `VENTA:${factura.id}:${factura.id_personalizado}`;
    const referenciaPago =
      datos.referenciaPago
      ?? datos.referencia_pago
      ?? datos.codigoTransferencia
      ?? datos.codigo_transferencia
      ?? null;
    const payload = {
      idempotency_key: idempotencyKey,
      operacion_id: operacionId,
      factura_id: factura.id,
      factura_codigo: factura.id_personalizado,
      cliente_id: venta.clienteId,
      cliente_nombre: venta.nombreCliente,
      metodo_pago: metodoPago,
      metodo_cobro: metodoCobro,
      monto_total: montoTotal,
      monto_cobrado: montoCobrado,
      monto_credito: montoCredito,
      fecha_vencimiento:
        datos.fechaVencimiento
        ?? datos.fecha_vencimiento
        ?? null,
      referencia_pago: referenciaPago,
      referencia_tipo: 'FACTURA',
      referencia_id: factura.id,
      referencia_codigo: factura.id_personalizado,
      tercero_id: venta.clienteId,
      tercero_nombre: venta.nombreCliente,
      usuario_id: venta.usuarioId,
      usuario_nombre: venta.usuarioNombre,
      sucursal_id: venta.sucursalId,
      observacion: venta.observacion,
    };

    return new OperacionFinanciera({
      facturaId: factura.id,
      operacionId,
      idempotencyKey,
      tipo,
      metodoPago,
      metodoCobro,
      montoTotal,
      montoCobrado,
      montoCredito,
      fechaVencimiento: payload.fecha_vencimiento,
      referenciaPago,
      estado: 'PENDIENTE',
      payload,
      traceId: venta.traceId,
      usuarioId: venta.usuarioId,
      usuarioNombre: venta.usuarioNombre,
      sucursalId: venta.sucursalId,
    });
  }

  editar(datos) {
    if (!datos.id) return Promise.resolve({ estado: 'error', resultado: 'id es requerido' });
    if (!datos.clienteId) return Promise.resolve({ estado: 'error', resultado: 'clienteId es requerido' });
    return this.adaptador.actualizar(new Factura(datos.id, datos));
  }

  cobrar(id) { return id ? this.adaptador.cobrar(id) : Promise.resolve({ estado: 'error', resultado: 'id es requerido' }); }

  async construirOperacionAnulacion(factura, contexto = {}) {
    if (!this.operacionFinancieraCommand || !this.cajaHttp) {
      return null;
    }

    const idempotencyKey = `ANULACION:FACTURA:${factura.id}`;
    const existente = this.operacionFinancieraQuery
      ? await this.operacionFinancieraQuery.findByIdempotencyKey(idempotencyKey)
      : null;
    if (existente) {
      return existente;
    }

    const operaciones = this.operacionFinancieraQuery
      ? await this.operacionFinancieraQuery.findByFacturaId(factura.id)
      : [];
    const operacionesOrigen = operaciones.filter(
      (operacion) => operacion.getTipo() !== 'ANULACION_VENTA',
    );
    const pendientes = operacionesOrigen.filter(
      (operacion) => operacion.getEstado() === 'PENDIENTE',
    );
    for (const operacion of pendientes) {
      await this.operacionFinancieraCommand.marcarDescartado(
        operacion.getId(),
        `Factura ${factura.id_personalizado || factura.id} anulada`,
      );
    }

    const operacionIdsOriginales = [
      ...new Set(
        operacionesOrigen
          .map((operacion) => operacion.getOperacionId())
          .filter(Boolean),
      ),
    ];
    const cuentaCobrarId =
      contexto.cuentaCobrarId
      ?? operacionesOrigen
        .map((operacion) => operacion.getCuentaCobrarId())
        .find(Boolean)
      ?? null;
    const operacionId = randomUUID();
    const motivo = contexto.motivo || 'Anulación de factura';
    const payload = {
      operacion_id: operacionId,
      idempotency_key: idempotencyKey,
      operacion_ids_originales: operacionIdsOriginales,
      cuenta_cobrar_id: cuentaCobrarId,
      referencia_tipo: 'FACTURA',
      referencia_id: factura.id,
      referencia_codigo: factura.id_personalizado,
      motivo,
      usuario_id: contexto.usuarioId,
      usuario_nombre: contexto.usuarioNombre,
      sucursal_id: contexto.sucursalId,
    };

    return new OperacionFinanciera({
      facturaId: factura.id,
      cuentaCobrarId,
      operacionId,
      operacionIdOriginal: operacionIdsOriginales[0] ?? null,
      idempotencyKey,
      tipo: 'ANULACION_VENTA',
      metodoPago: factura.metodo_pago,
      montoTotal: redondear(factura.total),
      montoCobrado: redondear(factura.abonado),
      montoCredito: redondear(factura.saldo_pendiente),
      estado: 'PENDIENTE',
      payload,
      traceId: contexto.traceId,
      usuarioId: contexto.usuarioId,
      usuarioNombre: contexto.usuarioNombre,
      sucursalId: contexto.sucursalId,
    });
  }

  async anular(id, contexto = {}) {
    if (!id) return { estado: 'error', resultado: 'id es requerido' };
    const consulta = await this.query.buscarPorId(id);
    if (consulta.estado !== 'ok') return consulta;
    const factura = consulta.resultado;
    if (factura.estado_pago === 'ANULADA') return { estado: 'error', resultado: 'Factura no encontrada o ya estaba anulada' };

    if (!['NO_APLICA', 'REVERSADO'].includes(factura.estado_inventario)) {
      await this.adaptador.actualizarEstadoInventario(id, 'REVERSA_PENDIENTE');
      const reversa = await this.inventarioStock.revertirVenta({ factura, contexto });
      if (reversa.estado !== 'ok') {
        await this.adaptador.actualizarEstadoInventario(id, 'ERROR_REVERSA');
        return { estado: 'error', resultado: `No se anuló la factura porque inventario no pudo devolver el stock: ${reversa.resultado}` };
      }
    }

    const operacion = await this.construirOperacionAnulacion(factura, contexto);
    const anulacion = await this.adaptador.anular(
      id,
      factura.estado_inventario === 'NO_APLICA' ? 'NO_APLICA' : 'REVERSADO',
      operacion,
    );
    if (anulacion.estado !== 'ok') {
      return anulacion;
    }

    const operacionGuardada = anulacion.operacionFinanciera;
    if (operacionGuardada) {
      const respuestaCaja = await this.cajaHttp.postAnulacion(
        operacionGuardada.getPayload(),
        operacionGuardada.getTraceId(),
      );
      if (respuestaCaja.ok) {
        await this.operacionFinancieraCommand.marcarAplicado(
          operacionGuardada.getId(),
          respuestaCaja.data,
        );
        return {
          ...anulacion,
          reversoFinanciero: 'APLICADO',
          detalleFinanciero: respuestaCaja.data,
        };
      }
      return {
        ...anulacion,
        reversoFinanciero: 'PENDIENTE',
        advertencia:
          `La factura fue anulada. El reverso financiero se reintentará automáticamente: ${respuestaCaja.error}`,
      };
    }

    return anulacion;
  }

  eliminar(id, contexto = {}) {
    return this.anular(id, {
      ...contexto,
      motivo: contexto.motivo || 'Eliminación lógica de factura',
    });
  }
}
