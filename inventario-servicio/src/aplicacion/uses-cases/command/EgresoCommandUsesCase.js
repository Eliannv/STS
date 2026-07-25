// inventario-servicio/src/aplicacion/uses-cases/command/EgresoCommandUsesCase.js
import DetalleEgreso from '../../../dominio/entidades/DetalleEgreso.js';
import EgresoMercaderia from '../../../dominio/entidades/EgresoMercaderia.js';
import OperacionFinancieraInventario from '../../../dominio/entidades/OperacionFinancieraInventario.js';
import DetalleEgresoDTO from '../../dto/DetalleEgresoDTO.js';
import EgresoMercaderiaDTO from '../../dto/EgresoMercaderiaDTO.js';

const TIPOS_EGRESO = Object.freeze([
  'DEVOLUCION_PROVEEDOR',
  'MERMA',
  'ROTURA',
  'ROBO',
  'PERDIDA',
  'VENCIMIENTO',
  'CONSUMO_INTERNO',
  'MUESTRA',
  'DONACION',
  'OBSOLESCENCIA',
  'RETIRO_CALIDAD',
  'OTRO',
]);

const requerido = (valor, campo) => {
  if (valor === null || valor === undefined || valor === '') {
    throw new Error(`${campo} es requerido`);
  }
  return valor;
};

const numero = (valor) => Number(valor ?? 0);
const redondear = (valor) => Number(numero(valor).toFixed(2));

export default class EgresoCommandUsesCase {
  constructor({
    egresoQuery,
    egresoCommand,
    existenciaStock,
    movimientoStockServicio,
    egresoDominioServicio,
    operacionFinancieraQuery,
    operacionFinancieraCommand,
    cajaSalida,
  }) {
    this.egresoQuery = egresoQuery;
    this.egresoCommand = egresoCommand;
    this.existenciaStock = existenciaStock;
    this.movimientoStockServicio = movimientoStockServicio;
    this.egresoDominioServicio = egresoDominioServicio;
    this.operacionFinancieraQuery = operacionFinancieraQuery;
    this.operacionFinancieraCommand = operacionFinancieraCommand;
    this.cajaSalida = cajaSalida;
  }

  async crearEgreso(params = {}, usuarioId, usuarioNombre) {
    const tipoEgreso = requerido(
      params.tipoEgreso ?? params.tipo_egreso,
      'tipo_egreso',
    );
    if (!TIPOS_EGRESO.includes(tipoEgreso)) {
      throw new Error('tipo_egreso no es válido');
    }
    const egreso = new EgresoMercaderia({
      tipoEgreso,
      descripcion:
        params.descripcion
        ?? params.motivo
        ?? params.observacion
        ?? tipoEgreso.replaceAll('_', ' '),
      motivo: params.motivo,
      observacion: params.observacion,
      fecha: params.fecha ?? new Date(),
      estado: 'BORRADOR',
      estadoFinanciero: 'NO_APLICA',
      origen: params.origen ?? 'INVENTARIO',
      ingresoOrigenId:
        params.ingresoOrigenId
        ?? params.ingreso_origen_id,
      usuarioId,
      usuarioNombre,
      proveedorId: params.proveedorId ?? params.proveedor_id,
      proveedorNombre: params.proveedorNombre ?? params.proveedor_nombre,
      sucursalId: params.sucursalId ?? params.sucursal_id,
      sucursalNombre: params.sucursalNombre ?? params.sucursal_nombre,
      documentoReferencia:
        params.documentoReferencia
        ?? params.documento_referencia,
    });
    if (egreso.requiereMotivo() && !egreso.getMotivo()?.trim()) {
      throw new Error('motivo es requerido cuando tipo_egreso es OTRO');
    }
    if (egreso.generaMovimientoFinanciero()) {
      requerido(egreso.getProveedorId(), 'proveedor_id');
      requerido(egreso.getIngresoOrigenId(), 'ingreso_origen_id');
      const ingreso = await this.egresoQuery.findIngresoById(
        egreso.getIngresoOrigenId(),
      );
      if (!ingreso) throw new Error('Ingreso de origen no encontrado');
      if (
        ingreso.proveedor_id
        && Number(ingreso.proveedor_id) !== Number(egreso.getProveedorId())
      ) {
        throw new Error('El ingreso de origen no pertenece al proveedor');
      }
      egreso.setProveedorNombre(
        egreso.getProveedorNombre() ?? ingreso.proveedor_nombre,
      );
    }
    return EgresoMercaderiaDTO.fromEntidad(
      await this.egresoCommand.save(egreso),
      [],
    );
  }

  async agregarDetalle(egresoId, params = {}) {
    const egreso = await this.egresoQuery.findById(egresoId);
    if (!egreso) throw new Error('Egreso no encontrado');
    if (!egreso.esEditable()) {
      throw new Error('Solo se pueden agregar detalles a un borrador');
    }
    const productoId = Number(
      requerido(params.productoId ?? params.producto_id, 'producto_id'),
    );
    const cantidad = Number(requerido(params.cantidad, 'cantidad'));
    if (!(cantidad > 0)) throw new Error('cantidad debe ser mayor que cero');
    const detalles = await this.egresoQuery.findDetallesByEgresoId(egresoId);
    if (detalles.some((detalle) => Number(detalle.getProductoId()) === productoId)) {
      throw new Error('El producto ya fue agregado al egreso');
    }
    // El costo debe ser el promedio de la sucursal que registra el egreso, no el global.
    const producto = await this.existenciaStock.findStockByProductoId(productoId, {
      sucursalId: egreso.getSucursalId(),
    });
    if (!producto || producto.activo !== true) {
      throw new Error('Producto activo no encontrado');
    }
    if (producto.tipo_control_stock === 'ILIMITADO') {
      throw new Error('El producto no controla existencias');
    }

    const detalleIngresoId =
      params.detalleIngresoId
      ?? params.detalle_ingreso_id
      ?? null;
    let costoOriginal = numero(producto.costo);
    if (egreso.generaMovimientoFinanciero()) {
      requerido(detalleIngresoId, 'detalle_ingreso_id');
      const detalleIngreso = await this.egresoQuery.findDetalleIngresoById(
        detalleIngresoId,
      );
      if (
        !detalleIngreso
        || Number(detalleIngreso.ingreso_id) !== Number(egreso.getIngresoOrigenId())
        || Number(detalleIngreso.producto_id) !== productoId
      ) {
        throw new Error('El detalle no pertenece al ingreso de origen');
      }
      const yaDevuelto = await this.egresoQuery.cantidadDevueltaDetalleIngreso(
        detalleIngresoId,
      );
      if (cantidad + yaDevuelto > Number(detalleIngreso.stock_ingresado ?? 0)) {
        throw new Error('La cantidad supera lo comprado en el ingreso de origen');
      }
      costoOriginal = numero(detalleIngreso.costo_unitario);
    }

    const detalle = new DetalleEgreso({
      egresoId,
      productoId,
      detalleIngresoId,
      nombre: producto.nombre,
      modelo: producto.modelo,
      color: producto.color,
      grupo: producto.grupo,
      cantidad,
      costoUnitario: numero(producto.costo),
      costoUnitarioOriginal: costoOriginal,
      idempotencyKey:
        params.idempotencyKey
        ?? params.idempotency_key
        ?? `BORRADOR_EGRESO:${egresoId}:PRODUCTO:${productoId}`,
      operacionId: params.operacionId ?? params.operacion_id ?? null,
    });
    return DetalleEgresoDTO.fromEntidad(
      await this.egresoCommand.saveDetalle(detalle),
    );
  }

  async eliminarDetalle(egresoId, detalleId) {
    const egreso = await this.egresoQuery.findById(egresoId);
    if (!egreso) throw new Error('Egreso no encontrado');
    if (!egreso.esEditable()) {
      throw new Error('Solo se pueden eliminar detalles de un borrador');
    }
    return this.egresoCommand.deleteDetalle(detalleId, egresoId);
  }

  async confirmarEgreso(egresoId, params = {}) {
    const operacionId = requerido(
      params.operacionId ?? params.operacion_id,
      'operacion_id',
    );
    const idempotencyKey = requerido(
      params.idempotencyKey ?? params.idempotency_key,
      'idempotency_key',
    );
    const existente =
      await this.egresoQuery.findByOperacionConfirmacionId(operacionId);
    if (existente) {
      return EgresoMercaderiaDTO.fromEntidad(existente);
    }
    const existentePorClave =
      await this.egresoQuery.findByIdempotencyKey(idempotencyKey);
    if (existentePorClave?.estaConfirmado()) {
      return EgresoMercaderiaDTO.fromEntidad(existentePorClave);
    }
    const estadoActual = await this.egresoQuery.findById(egresoId);
    if (estadoActual?.estaConfirmado()) {
      return EgresoMercaderiaDTO.fromEntidad(estadoActual);
    }

    const resultado = await this.egresoCommand.enTransaccion(
      async (transaction) => {
        const egreso = await this.egresoQuery.findById(
          egresoId,
          { transaction, lock: true },
        );
        if (!egreso) throw new Error('Egreso no encontrado');
        const detalles = await this.egresoQuery.findDetallesByEgresoId(
          egresoId,
          { transaction },
        );
        this.egresoDominioServicio.validarPuedeConfirmar(egreso, detalles);

        for (let index = 0; index < detalles.length; index += 1) {
          const movimiento =
            this.egresoDominioServicio.construirMovimientoStock({
              egreso,
              detalle: detalles[index],
              index,
              operacionId,
              usuarioId: params.usuarioId ?? params.usuario_id,
              usuarioNombre: params.usuarioNombre ?? params.usuario_nombre,
              traceId: params.traceId,
            });
          const aplicado = await this.movimientoStockServicio.aplicar(
            movimiento,
            { transaction },
          );
          if (aplicado.estado !== 'ok') throw new Error(aplicado.resultado);
        }

        const costoTotal =
          this.egresoDominioServicio.calcularCostoTotal(detalles);
        const conReembolso =
          egreso.generaMovimientoFinanciero()
          && (params.conReembolso ?? params.con_reembolso) === true;
        let operacionFinanciera = null;
        if (conReembolso) {
          const monto = redondear(
            params.monto
            ?? params.montoReembolso
            ?? params.monto_reembolso
            ?? costoTotal,
          );
          if (!(monto > 0)) throw new Error('monto de reembolso inválido');
          const payload = {
            idempotency_key: idempotencyKey,
            operacion_id: operacionId,
            egreso_id: egreso.getId(),
            ingreso_origen_id: egreso.getIngresoOrigenId(),
            proveedor_id: egreso.getProveedorId(),
            proveedor_nombre: egreso.getProveedorNombre(),
            monto,
            metodo_pago: requerido(
              params.metodoPago ?? params.metodo_pago,
              'metodo_pago',
            ),
            caja_tipo: requerido(
              params.cajaTipo ?? params.caja_tipo,
              'caja_tipo',
            ),
            caja_id: Number(requerido(
              params.cajaId ?? params.caja_id,
              'caja_id',
            )),
            referencia_pago:
              params.referenciaPago
              ?? params.referencia_pago
              ?? null,
            fecha: params.fecha ?? new Date(),
            usuario_id: params.usuarioId ?? params.usuario_id,
            usuario_nombre: params.usuarioNombre ?? params.usuario_nombre,
            observacion: egreso.getObservacion(),
          };
          operacionFinanciera = new OperacionFinancieraInventario({
            egresoId: egreso.getId(),
            operacionId,
            idempotencyKey,
            tipo: 'REEMBOLSO_DEVOLUCION',
            metodoPago: payload.metodo_pago,
            cajaTipo: payload.caja_tipo,
            cajaId: payload.caja_id,
            monto,
            montoTotal: monto,
            proveedorId: egreso.getProveedorId(),
            proveedorNombre: egreso.getProveedorNombre(),
            ingresoOrigenId: egreso.getIngresoOrigenId(),
            payload,
            traceId: params.traceId,
            usuarioId: payload.usuario_id,
            usuarioNombre: payload.usuario_nombre,
            sucursalId: egreso.getSucursalId(),
          });
          operacionFinanciera = await this.operacionFinancieraCommand.save(
            operacionFinanciera,
            { transaction },
          );
        }

        const confirmado = await this.egresoCommand.confirmar(
          egresoId,
          {
            costoTotal,
            estadoFinanciero: operacionFinanciera
              ? 'PENDIENTE'
              : 'NO_APLICA',
            operacionConfirmacionId: operacionId,
            confirmadoPorId: params.usuarioId ?? params.usuario_id,
            confirmadoPorNombre:
              params.usuarioNombre
              ?? params.usuario_nombre,
          },
          { transaction },
        );
        return { egreso: confirmado, operacionFinanciera };
      },
    );

    if (resultado.operacionFinanciera) {
      const envio = await this.cajaSalida.postDevolucionProveedor(
        resultado.operacionFinanciera.getPayload(),
        resultado.operacionFinanciera.getTraceId(),
      );
      if (envio.ok) {
        await this.operacionFinancieraCommand.marcarAplicada(
          resultado.operacionFinanciera.getId(),
          envio.data,
        );
        resultado.egreso.setEstadoFinanciero('APLICADO');
      }
    }
    return EgresoMercaderiaDTO.fromEntidad(resultado.egreso);
  }

  async anularEgreso(egresoId, params = {}) {
    const motivoAnulacion = requerido(
      params.motivoAnulacion
      ?? params.motivo_anulacion
      ?? params.motivo,
      'motivo_anulacion',
    );
    const operacionId = requerido(
      params.operacionId ?? params.operacion_id,
      'operacion_id',
    );
    const idempotencyKey = requerido(
      params.idempotencyKey ?? params.idempotency_key,
      'idempotency_key',
    );
    const existente = await this.egresoQuery.findByOperacionAnulacionId(
      operacionId,
    );
    if (existente) return EgresoMercaderiaDTO.fromEntidad(existente);
    const estadoActual = await this.egresoQuery.findById(egresoId);
    if (estadoActual?.getEstado() === 'ANULADO') {
      return EgresoMercaderiaDTO.fromEntidad(estadoActual);
    }

    const resultado = await this.egresoCommand.enTransaccion(
      async (transaction) => {
        const egreso = await this.egresoQuery.findById(
          egresoId,
          { transaction, lock: true },
        );
        if (!egreso) throw new Error('Egreso no encontrado');
        this.egresoDominioServicio.validarPuedeAnular(egreso);
        const movimientos = await this.egresoQuery.findMovimientosByEgresoId(
          egresoId,
          { transaction, lock: true },
        );
        const originales = movimientos.filter(
          (movimiento) =>
            movimiento.tipo_movimiento !== 'ANULACION_EGRESO'
            && !movimiento.movimiento_revertido_id,
        );
        for (const original of originales) {
          const reverso =
            this.egresoDominioServicio.construirMovimientoAnulacion(
              original,
              operacionId,
              params.usuarioId ?? params.usuario_id,
              params.usuarioNombre ?? params.usuario_nombre,
            );
          reverso.motivo = motivoAnulacion;
          reverso.traceId = params.traceId;
          const aplicado = await this.movimientoStockServicio.aplicar(
            reverso,
            { transaction },
          );
          if (aplicado.estado !== 'ok') throw new Error(aplicado.resultado);
        }

        const operaciones =
          await this.operacionFinancieraQuery.findByEgresoId(
            egresoId,
            { transaction },
          );
        const originalAplicada = operaciones.find(
          (operacion) =>
            operacion.getTipo() === 'REEMBOLSO_DEVOLUCION'
            && operacion.getEstado() === 'APLICADO',
        );
        await this.operacionFinancieraCommand.descartarPendientesPorEgreso(
          egresoId,
          motivoAnulacion,
          { transaction },
        );

        let operacionFinanciera = null;
        if (originalAplicada) {
          const payload = {
            idempotency_key: idempotencyKey,
            operacion_id: operacionId,
            operacion_ids_originales: [originalAplicada.getOperacionId()],
            referencia_tipo: 'EGRESO',
            referencia_id: egreso.getId(),
            referencia_codigo: egreso.getIdPersonalizado(),
            motivo: motivoAnulacion,
            usuario_id: params.usuarioId ?? params.usuario_id,
            usuario_nombre: params.usuarioNombre ?? params.usuario_nombre,
          };
          operacionFinanciera = new OperacionFinancieraInventario({
            egresoId: egreso.getId(),
            operacionId,
            operacionIdOriginal: originalAplicada.getOperacionId(),
            idempotencyKey,
            tipo: 'ANULACION_REEMBOLSO',
            metodoPago: originalAplicada.getMetodoPago(),
            cajaTipo: originalAplicada.getCajaTipo(),
            cajaId: originalAplicada.getCajaId(),
            monto: originalAplicada.getMonto(),
            montoTotal: originalAplicada.getMonto(),
            proveedorId: egreso.getProveedorId(),
            proveedorNombre: egreso.getProveedorNombre(),
            ingresoOrigenId: egreso.getIngresoOrigenId(),
            payload,
            motivo: motivoAnulacion,
            traceId: params.traceId,
            usuarioId: payload.usuario_id,
            usuarioNombre: payload.usuario_nombre,
            sucursalId: egreso.getSucursalId(),
          });
          operacionFinanciera = await this.operacionFinancieraCommand.save(
            operacionFinanciera,
            { transaction },
          );
        }

        const anulado = await this.egresoCommand.anular(
          egresoId,
          {
            motivoAnulacion,
            operacionAnulacionId: operacionId,
            anuladoPorId: params.usuarioId ?? params.usuario_id,
            anuladoPorNombre: params.usuarioNombre ?? params.usuario_nombre,
            estadoFinanciero: operacionFinanciera
              ? 'PENDIENTE'
              : egreso.getEstadoFinanciero() === 'APLICADO'
                ? 'ERROR'
                : 'NO_APLICA',
          },
          { transaction },
        );
        return { egreso: anulado, operacionFinanciera };
      },
    );

    if (resultado.operacionFinanciera) {
      const envio = await this.cajaSalida.postAnulacionDevolucion(
        resultado.operacionFinanciera.getPayload(),
        resultado.operacionFinanciera.getTraceId(),
      );
      if (envio.ok) {
        await this.operacionFinancieraCommand.marcarAplicada(
          resultado.operacionFinanciera.getId(),
          envio.data,
        );
        resultado.egreso.setEstadoFinanciero('APLICADO');
      }
    }
    return EgresoMercaderiaDTO.fromEntidad(resultado.egreso);
  }

  async descartarEgreso(egresoId, params = {}) {
    const egreso = await this.egresoQuery.findById(egresoId);
    if (!egreso) throw new Error('Egreso no encontrado');
    if (!egreso.esEditable()) {
      throw new Error('Solo se puede descartar un egreso en borrador');
    }
    return EgresoMercaderiaDTO.fromEntidad(
      await this.egresoCommand.descartar(egresoId, {
        usuarioId: params.usuarioId ?? params.usuario_id,
      }),
    );
  }
}
