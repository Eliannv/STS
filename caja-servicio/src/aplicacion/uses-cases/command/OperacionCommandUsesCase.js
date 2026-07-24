// caja-servicio/src/aplicacion/uses-cases/command/OperacionCommandUsesCase.js
const extraerResultado = (respuesta) => {
  if (respuesta?.estado === 'error') {
    throw new Error(String(respuesta.resultado));
  }

  return respuesta && Object.prototype.hasOwnProperty.call(respuesta, 'resultado')
    ? respuesta.resultado
    : respuesta;
};

const redondear = (valor) => parseFloat(Number(valor ?? 0).toFixed(2));

const obtener = (datos, camelCase, snakeCase) => (
  datos[camelCase] ?? datos[snakeCase]
);

const validarIdentificadores = (params) => {
  const operacionId = obtener(params, 'operacionId', 'operacion_id');
  const idempotencyKey = obtener(params, 'idempotencyKey', 'idempotency_key');
  if (!operacionId) {
    throw new Error('operacion_id es requerido');
  }
  if (!idempotencyKey) {
    throw new Error('idempotency_key es requerido');
  }
  return { operacionId, idempotencyKey };
};

const normalizarMetodoCobro = (valor) => {
  const metodo = String(valor ?? '').trim().toUpperCase();
  if (!['EFECTIVO', 'TRANSFERENCIA'].includes(metodo)) {
    throw new Error('metodo_cobro debe ser EFECTIVO o TRANSFERENCIA');
  }
  return metodo;
};

export default class OperacionCommandUsesCase {
  constructor(
    movBancoQuery,
    movBancoCommand,
    movChicaQuery,
    movChicaCommand,
    cajaBancoQuery,
    cajaBancoCommand,
    cajaChicaQuery,
    cajaChicaCommand,
    cuentaQuery,
    cuentaCommand,
    movFinancieroDominioServicio,
    cuentaDominioServicio,
  ) {
    this.movBancoQuery = movBancoQuery;
    this.movBancoCommand = movBancoCommand;
    this.movChicaQuery = movChicaQuery;
    this.movChicaCommand = movChicaCommand;
    this.cajaBancoQuery = cajaBancoQuery;
    this.cajaBancoCommand = cajaBancoCommand;
    this.cajaChicaQuery = cajaChicaQuery;
    this.cajaChicaCommand = cajaChicaCommand;
    this.cuentaQuery = cuentaQuery;
    this.cuentaCommand = cuentaCommand;
    this.movFinancieroDominioServicio = movFinancieroDominioServicio;
    this.cuentaDominioServicio = cuentaDominioServicio;
  }

  async procesarVenta(params = {}) {
    const { operacionId, idempotencyKey } = validarIdentificadores(params);
    const montoCobrado = redondear(obtener(params, 'montoCobrado', 'monto_cobrado'));
    const montoCredito = redondear(obtener(params, 'montoCredito', 'monto_credito'));
    let movimiento = null;
    let cuenta = null;

    if (montoCobrado > 0) {
      const metodoCobro = normalizarMetodoCobro(
        obtener(params, 'metodoCobro', 'metodo_cobro'),
      );
      const destino = this.obtenerDestinoCaja(metodoCobro);
      movimiento = extraerResultado(
        await destino.movimientoQuery.findByIdempotencyKey(idempotencyKey),
      );

      if (!movimiento) {
        const caja = await this.obtenerCajaAbierta(destino.cajaQuery);
        movimiento = this.construirMovimientoIngreso({
          params,
          caja,
          monto: montoCobrado,
          metodoCobro,
          categoria: metodoCobro === 'EFECTIVO'
            ? 'VENTA_EFECTIVO'
            : 'VENTA_TRANSFERENCIA',
          origen: 'FACTURACION',
          operacionId,
          idempotencyKey,
        });
        movimiento = extraerResultado(
          await destino.movimientoCommand.save(movimiento),
        );
      }
    }

    if (montoCredito > 0) {
      cuenta = extraerResultado(
        await this.cuentaQuery.findByIdempotencyKey(idempotencyKey),
      );

      if (!cuenta) {
        cuenta = this.cuentaDominioServicio.construirCuentaCobrar({
          montoTotal: obtener(params, 'montoTotal', 'monto_total'),
          montoCobrado,
          montoCredito,
          fechaVencimiento: obtener(params, 'fechaVencimiento', 'fecha_vencimiento'),
          referenciaTipo: obtener(params, 'referenciaTipo', 'referencia_tipo') ?? 'FACTURA',
          referenciaId: obtener(params, 'referenciaId', 'referencia_id'),
          referenciaCodigo: obtener(params, 'referenciaCodigo', 'referencia_codigo'),
          terceroId: obtener(params, 'terceroId', 'tercero_id'),
          terceroNombre: obtener(params, 'terceroNombre', 'tercero_nombre'),
          sucursalId: obtener(params, 'sucursalId', 'sucursal_id'),
          usuarioId: obtener(params, 'usuarioId', 'usuario_id'),
          usuarioNombre: obtener(params, 'usuarioNombre', 'usuario_nombre'),
          operacionId,
          idempotencyKey,
          observacion: params.observacion,
        });
        cuenta = extraerResultado(await this.cuentaCommand.save(cuenta));
      }

      const creacionExistente = typeof this.cuentaQuery.findMovimientoByIdempotencyKey === 'function'
        ? extraerResultado(
          await this.cuentaQuery.findMovimientoByIdempotencyKey(idempotencyKey),
        )
        : null;
      if (!creacionExistente) {
        const movimientoCuenta = this.cuentaDominioServicio.construirMovimientoCuenta(
          cuenta,
          'CREACION',
          montoCredito,
          operacionId,
          obtener(params, 'usuarioId', 'usuario_id'),
          obtener(params, 'usuarioNombre', 'usuario_nombre'),
          {
            idempotencyKey,
            traceId: params.traceId,
            observacion: params.observacion,
          },
        );
        await this.cuentaCommand.saveMovimiento(movimientoCuenta);
      }
    }

    return {
      movimiento_id: movimiento?.getId?.() ?? null,
      cuenta_cobrar_id: cuenta?.getId?.() ?? null,
    };
  }

  async procesarCobro(params = {}) {
    const { operacionId, idempotencyKey } = validarIdentificadores(params);
    const cuentaId = Number(
      obtener(params, 'cuentaCobrarId', 'cuenta_cobrar_id'),
    );
    const monto = redondear(params.monto ?? obtener(params, 'montoCobrado', 'monto_cobrado'));
    if (!cuentaId || !(monto > 0)) {
      throw new Error('cuenta_cobrar_id y monto válido son requeridos');
    }

    const metodoCobro = normalizarMetodoCobro(
      obtener(params, 'metodoCobro', 'metodo_cobro'),
    );
    const destino = this.obtenerDestinoCaja(metodoCobro);
    const cuenta = extraerResultado(await this.cuentaQuery.findById(cuentaId));
    if (!cuenta) {
      throw new Error('Cuenta por cobrar no encontrada');
    }

    const abonoExistente = typeof this.cuentaQuery.findMovimientoByIdempotencyKey === 'function'
      ? extraerResultado(
        await this.cuentaQuery.findMovimientoByIdempotencyKey(idempotencyKey),
      )
      : null;
    let movimiento = extraerResultado(
      await destino.movimientoQuery.findByIdempotencyKey(idempotencyKey),
    );
    if (abonoExistente) {
      return {
        movimiento_id:
          movimiento?.getId?.()
          ?? abonoExistente.getMovimientoFinancieroId(),
        cuenta_cobrar_id: cuenta.getId(),
        estado_cuenta: cuenta.getEstado(),
      };
    }

    if (!movimiento) {
      this.cuentaDominioServicio.validarCuentaActiva(cuenta);
      const caja = await this.obtenerCajaAbierta(destino.cajaQuery);
      movimiento = this.construirMovimientoIngreso({
        params,
        caja,
        monto,
        metodoCobro,
        categoria: metodoCobro === 'EFECTIVO'
          ? 'COBRO_DEUDA_EFECTIVO'
          : 'COBRO_DEUDA_TRANSFERENCIA',
        origen: 'COBRO_DEUDA',
        operacionId,
        idempotencyKey,
      });
      movimiento = extraerResultado(
        await destino.movimientoCommand.save(movimiento),
      );
    }

    const movimientoCuenta = this.cuentaDominioServicio.construirMovimientoCuenta(
      cuenta,
      'ABONO',
      monto,
      operacionId,
      obtener(params, 'usuarioId', 'usuario_id'),
      obtener(params, 'usuarioNombre', 'usuario_nombre'),
      {
        metodoPago: metodoCobro,
        cajaTipo: destino.tipoCaja,
        cajaId: movimiento.getCajaBancoId(),
        movimientoFinancieroId: movimiento.getId(),
        idempotencyKey,
        traceId: params.traceId,
        observacion: params.observacion,
      },
    );
    this.cuentaDominioServicio.aplicarAbono(cuenta, monto);
    await this.cuentaCommand.saveMovimiento(movimientoCuenta, cuenta);

    return {
      movimiento_id: movimiento.getId(),
      cuenta_cobrar_id: cuenta.getId(),
      estado_cuenta: cuenta.getEstado(),
    };
  }

  async procesarAnulacion(params = {}) {
    const { operacionId, idempotencyKey } = validarIdentificadores(params);
    const operacionesOriginales = obtener(
      params,
      'operacionIdsOriginales',
      'operacion_ids_originales',
    ) ?? [];
    const clavesReversos = obtener(
      params,
      'idempotencyKeysReversos',
      'idempotency_keys_reversos',
    ) ?? {};
    const motivo = params.motivo;
    if (!motivo) {
      throw new Error('El motivo es requerido');
    }

    const originales = await this.buscarMovimientosOriginales(operacionesOriginales);
    const revertidos = [];

    for (let indice = 0; indice < originales.length; indice += 1) {
      const { movimientoOriginal, destino } = originales[indice];
      const claveReverso = originales.length === 1
        ? idempotencyKey
        : clavesReversos[movimientoOriginal.getId()]
          ?? clavesReversos[movimientoOriginal.getOperacionId()]
          ?? clavesReversos[indice];
      if (!claveReverso) {
        throw new Error(
          'idempotency_keys_reversos es requerido para anulaciones múltiples',
        );
      }
      let reverso = extraerResultado(
        await destino.movimientoQuery.findByIdempotencyKey(claveReverso),
      );

      if (!reverso) {
        const caja = extraerResultado(
          await destino.cajaQuery.buscarPorId(movimientoOriginal.getCajaBancoId()),
        );
        this.movFinancieroDominioServicio.validarCajaAbierta(caja);
        reverso = this.movFinancieroDominioServicio.construirReverso(
          movimientoOriginal,
          motivo,
          obtener(params, 'usuarioId', 'usuario_id'),
          obtener(params, 'usuarioNombre', 'usuario_nombre'),
          operacionId,
          claveReverso,
        );
        reverso.setTraceId(params.traceId ?? movimientoOriginal.getTraceId());
        reverso = extraerResultado(
          await destino.movimientoCommand.save(reverso),
        );
      }
      revertidos.push(reverso.getId());
    }

    let cuentaAnuladaId = null;
    const cuentaId = Number(
      obtener(params, 'cuentaCobrarId', 'cuenta_cobrar_id'),
    );
    if (cuentaId) {
      const cuenta = extraerResultado(await this.cuentaQuery.findById(cuentaId));
      if (!cuenta) {
        throw new Error('Cuenta por cobrar no encontrada');
      }
      if (cuenta.getEstado() !== 'ANULADA') {
        const movimientoCuenta = this.cuentaDominioServicio.construirAnulacion(
          cuenta,
          motivo,
          obtener(params, 'usuarioId', 'usuario_id'),
        );
        movimientoCuenta.setOperacionId(operacionId);
        movimientoCuenta.setIdempotencyKey(idempotencyKey);
        movimientoCuenta.setUsuarioNombre(
          obtener(params, 'usuarioNombre', 'usuario_nombre'),
        );
        movimientoCuenta.setTraceId(params.traceId);
        cuenta.setSaldo(0);
        cuenta.setEstado('ANULADA');
        await this.cuentaCommand.saveMovimiento(movimientoCuenta, cuenta);
      }
      cuentaAnuladaId = cuenta.getId();
    }

    return {
      revertidos,
      cuenta_anulada_id: cuentaAnuladaId,
    };
  }

  async procesarAcreditacionTarjeta(params = {}) {
    const { operacionId, idempotencyKey } = validarIdentificadores(params);
    const montoBruto = redondear(obtener(params, 'montoBruto', 'monto_bruto'));
    const comision = redondear(params.comision);
    const retencion = redondear(params.retencion);
    const montoNeto = redondear(obtener(params, 'montoNeto', 'monto_neto'));
    if (!(montoBruto > 0)) {
      throw new Error('monto_bruto debe ser mayor que cero');
    }
    if (comision < 0 || retencion < 0) {
      throw new Error('Comisión y retención no pueden ser negativas');
    }
    if (montoBruto < comision + retencion) {
      throw new Error('monto_bruto debe ser mayor o igual a comisión más retención');
    }
    if (redondear(montoBruto - comision - retencion) !== montoNeto) {
      throw new Error('monto_neto no coincide con bruto menos comisión y retención');
    }

    const cajaId = Number(obtener(params, 'cuentaBancoId', 'cuenta_banco_id'));
    if (!cajaId) {
      throw new Error('cuenta_banco_id es requerido');
    }
    const claves = obtener(params, 'idempotencyKeys', 'idempotency_keys') ?? {};
    if (!claves.ingreso) {
      throw new Error('idempotency_keys.ingreso es requerido');
    }
    if (comision > 0 && !claves.comision) {
      throw new Error('idempotency_keys.comision es requerido');
    }
    if (retencion > 0 && !claves.retencion) {
      throw new Error('idempotency_keys.retencion es requerido');
    }

    const caja = extraerResultado(
      await this.cajaBancoQuery.buscarPorId(cajaId),
    );
    this.movFinancieroDominioServicio.validarCajaAbierta(caja);
    const comunes = {
      caja_banco_id: cajaId,
      origen: 'VENTA_TARJETA',
      referencia_tipo:
        obtener(params, 'referenciaTipo', 'referencia_tipo')
        ?? 'VENTA_TARJETA',
      referencia_id: obtener(params, 'referenciaId', 'referencia_id'),
      referencia_codigo:
        obtener(params, 'referenciaCodigo', 'referencia_codigo'),
      venta_id: obtener(params, 'facturaId', 'factura_id'),
      operacion_id: operacionId,
      observacion: params.observacion,
      trace_id: params.traceId,
      usuario_id: obtener(params, 'usuarioId', 'usuario_id'),
      usuario_nombre: obtener(params, 'usuarioNombre', 'usuario_nombre'),
      afecta_flujo_operativo: true,
    };
    let saldoProyectado = Number(caja.getSaldoActual());
    const movimientos = [];
    const agregarMovimiento = (tipo, categoria, monto, key, descripcion) => {
      const saldoAnterior = saldoProyectado;
      saldoProyectado = this.movFinancieroDominioServicio.calcularSaldoNuevo(
        saldoAnterior,
        tipo,
        monto,
      );
      movimientos.push(
        this.movFinancieroDominioServicio.construirMovimiento({
          ...comunes,
          tipo,
          categoria,
          monto,
          saldo_anterior: saldoAnterior,
          saldo_nuevo: saldoProyectado,
          idempotency_key: key,
          descripcion,
        }),
      );
    };

    agregarMovimiento(
      'INGRESO',
      'ACREDITACION_TARJETA',
      montoBruto,
      claves.ingreso,
      'Acreditación bruta de venta con tarjeta',
    );
    if (comision > 0) {
      agregarMovimiento(
        'EGRESO',
        'COMISION_BANCARIA',
        comision,
        claves.comision,
        'Comisión bancaria por acreditación de tarjeta',
      );
    }
    if (retencion > 0) {
      agregarMovimiento(
        'EGRESO',
        'RETENCION_BANCARIA',
        retencion,
        claves.retencion,
        'Retención bancaria por acreditación de tarjeta',
      );
    }

    const guardados = await this.movBancoCommand.saveAll(movimientos);
    const porCategoria = Object.fromEntries(
      guardados.map((movimiento) => [movimiento.getCategoria(), movimiento.getId()]),
    );
    return {
      operacion_id: operacionId,
      idempotency_key: idempotencyKey,
      movimientos: guardados.map((movimiento) => movimiento.getId()),
      movimiento_ingreso_id: porCategoria.ACREDITACION_TARJETA ?? null,
      movimiento_comision_id: porCategoria.COMISION_BANCARIA ?? null,
      movimiento_retencion_id: porCategoria.RETENCION_BANCARIA ?? null,
      monto_bruto: montoBruto,
      comision,
      retencion,
      monto_neto: montoNeto,
    };
  }

  async procesarCompra(params = {}) {
    const { operacionId, idempotencyKey } = validarIdentificadores(params);
    const tipoCompra = String(
      obtener(params, 'tipoCompra', 'tipo_compra') ?? '',
    ).toUpperCase();
    const montoTotal = redondear(
      obtener(params, 'montoTotal', 'monto_total'),
    );
    if (!['CONTADO', 'CREDITO'].includes(tipoCompra) || !(montoTotal > 0)) {
      throw new Error('tipo_compra y monto_total válido son requeridos');
    }

    if (tipoCompra === 'CREDITO') {
      return this.crearCuentaPagar({
        ...params,
        operacionId,
        idempotencyKey,
        tipoCuentaPorPagar: 'Deuda',
        terceroTipo: 'PROVEEDOR',
        origen: 'INVENTARIO',
        referenciaTipo:
          obtener(params, 'referenciaTipo', 'referencia_tipo')
          ?? 'INGRESO',
        referenciaId:
          obtener(params, 'referenciaId', 'referencia_id')
          ?? obtener(params, 'ingresoId', 'ingreso_id'),
        referenciaCodigo:
          obtener(params, 'referenciaCodigo', 'referencia_codigo')
          ?? obtener(params, 'ingresoCodigo', 'ingreso_codigo'),
      });
    }

    const cajaTipo = obtener(params, 'cajaTipo', 'caja_tipo');
    const cajaId = Number(obtener(params, 'cajaId', 'caja_id'));
    const destino = this.obtenerDestinoPorCaja(cajaTipo);
    let movimiento = extraerResultado(
      await destino.movimientoQuery.findByIdempotencyKey(idempotencyKey),
    );
    if (!movimiento) {
      const caja = await this.obtenerCajaSeleccionada(destino, cajaId);
      this.movFinancieroDominioServicio.validarSaldoSuficiente(caja, montoTotal);
      movimiento = this.construirMovimientoCaja({
        params,
        caja,
        tipo: 'EGRESO',
        monto: montoTotal,
        categoria: 'PAGO_PROVEEDOR',
        origen: 'INVENTARIO',
        operacionId,
        idempotencyKey,
      });
      movimiento = extraerResultado(
        await destino.movimientoCommand.save(movimiento),
      );
    }

    return {
      movimiento_id: movimiento.getId(),
      cuenta_pagar_id: null,
    };
  }

  async crearCuentaPagar(params = {}) {
    const { operacionId, idempotencyKey } = validarIdentificadores(params);
    let cuenta = extraerResultado(
      await this.cuentaQuery.findByIdempotencyKey(idempotencyKey),
    );
    if (!cuenta) {
      cuenta = this.cuentaDominioServicio.construirCuentaPagar({
        montoTotal: obtener(params, 'montoTotal', 'monto_total'),
        tipoCuentaPorPagar:
          obtener(params, 'tipoCuentaPorPagar', 'tipo_cuenta_por_pagar')
          ?? 'Deuda',
        fechaVencimiento:
          obtener(params, 'fechaVencimiento', 'fecha_vencimiento'),
        referenciaTipo: obtener(params, 'referenciaTipo', 'referencia_tipo'),
        referenciaId: obtener(params, 'referenciaId', 'referencia_id'),
        referenciaCodigo:
          obtener(params, 'referenciaCodigo', 'referencia_codigo'),
        terceroId:
          obtener(params, 'terceroId', 'tercero_id')
          ?? obtener(params, 'proveedorId', 'proveedor_id'),
        terceroNombre:
          obtener(params, 'terceroNombre', 'tercero_nombre')
          ?? obtener(params, 'proveedorNombre', 'proveedor_nombre'),
        terceroTipo:
          obtener(params, 'terceroTipo', 'tercero_tipo')
          ?? 'PROVEEDOR',
        sucursalId: obtener(params, 'sucursalId', 'sucursal_id'),
        cajaBancoId: obtener(params, 'cajaBancoId', 'caja_banco_id'),
        usuarioId: obtener(params, 'usuarioId', 'usuario_id'),
        usuarioNombre: obtener(params, 'usuarioNombre', 'usuario_nombre'),
        operacionId,
        idempotencyKey,
        origen: params.origen ?? 'OTRO',
        observacion: params.observacion,
      });
      cuenta = extraerResultado(await this.cuentaCommand.save(cuenta));
    }

    const movimientoExistente = extraerResultado(
      await this.cuentaQuery.findMovimientoByIdempotencyKey(idempotencyKey),
    );
    if (!movimientoExistente) {
      const movimientoCuenta =
        this.cuentaDominioServicio.construirMovimientoCuenta(
          cuenta,
          'CREACION',
          cuenta.getMontoTotal(),
          operacionId,
          obtener(params, 'usuarioId', 'usuario_id'),
          obtener(params, 'usuarioNombre', 'usuario_nombre'),
          {
            idempotencyKey,
            traceId: params.traceId,
            observacion: params.observacion,
          },
        );
      await this.cuentaCommand.saveMovimiento(movimientoCuenta);
    }

    return {
      movimiento_id: null,
      cuenta_pagar_id: cuenta.getId(),
      estado_cuenta: cuenta.getEstado(),
    };
  }

  async procesarPagoProveedor(params = {}) {
    const { operacionId, idempotencyKey } = validarIdentificadores(params);
    const cuentaId = Number(
      obtener(params, 'cuentaPagarId', 'cuenta_pagar_id')
      ?? params.cuentaId
      ?? params.cuenta_id,
    );
    const monto = redondear(params.monto);
    if (!cuentaId || !(monto > 0)) {
      throw new Error('cuenta_pagar_id y monto válido son requeridos');
    }

    const cuenta = extraerResultado(await this.cuentaQuery.findById(cuentaId));
    if (!cuenta || cuenta.getTipo() !== 'PAGAR') {
      throw new Error('Cuenta por pagar no encontrada');
    }
    const pagoExistente = extraerResultado(
      await this.cuentaQuery.findMovimientoByIdempotencyKey(idempotencyKey),
    );
    const cajaTipo = obtener(params, 'cajaTipo', 'caja_tipo');
    const cajaId = Number(obtener(params, 'cajaId', 'caja_id'));
    const destino = this.obtenerDestinoPorCaja(cajaTipo);
    let movimiento = extraerResultado(
      await destino.movimientoQuery.findByIdempotencyKey(idempotencyKey),
    );
    if (pagoExistente) {
      return {
        movimiento_id:
          movimiento?.getId?.()
          ?? pagoExistente.getMovimientoFinancieroId(),
        cuenta_pagar_id: cuenta.getId(),
        estado_cuenta: cuenta.getEstado(),
      };
    }

    this.cuentaDominioServicio.validarCuentaActiva(cuenta);
    if (monto > Number(cuenta.getSaldo())) {
      throw new Error('El pago no puede superar el saldo pendiente');
    }
    if (!movimiento) {
      const caja = await this.obtenerCajaSeleccionada(destino, cajaId);
      this.movFinancieroDominioServicio.validarSaldoSuficiente(caja, monto);
      movimiento = this.construirMovimientoCaja({
        params,
        caja,
        tipo: 'EGRESO',
        monto,
        categoria: 'PAGO_PROVEEDOR',
        origen: 'CUENTA_PAGAR',
        operacionId,
        idempotencyKey,
      });
      movimiento = extraerResultado(
        await destino.movimientoCommand.save(movimiento),
      );
    }

    const movimientoCuenta =
      this.cuentaDominioServicio.construirMovimientoCuenta(
        cuenta,
        'PAGO',
        monto,
        operacionId,
        obtener(params, 'usuarioId', 'usuario_id'),
        obtener(params, 'usuarioNombre', 'usuario_nombre'),
        {
          metodoPago: obtener(params, 'metodoPago', 'metodo_pago'),
          cajaTipo: destino.tipoCaja,
          cajaId,
          movimientoFinancieroId: movimiento.getId(),
          idempotencyKey,
          traceId: params.traceId,
          observacion: params.observacion,
          referenciaCodigo:
            obtener(params, 'referenciaPago', 'referencia_pago')
            ?? cuenta.getReferenciaCodigo(),
        },
      );
    this.cuentaDominioServicio.aplicarPago(cuenta, monto);
    await this.cuentaCommand.saveMovimiento(movimientoCuenta, cuenta);

    return {
      movimiento_id: movimiento.getId(),
      cuenta_pagar_id: cuenta.getId(),
      estado_cuenta: cuenta.getEstado(),
    };
  }

  async procesarAnulacionCompra(params = {}) {
    const { operacionId, idempotencyKey } = validarIdentificadores(params);
    const motivo = params.motivo;
    if (!motivo) throw new Error('El motivo es requerido');
    const conReembolso =
      obtener(params, 'conReembolso', 'con_reembolso') === true;

    const cuentaId = Number(
      obtener(params, 'cuentaPagarId', 'cuenta_pagar_id'),
    );
    let cuentaAnuladaId = null;
    if (cuentaId) {
      const cuenta = extraerResultado(await this.cuentaQuery.findById(cuentaId));
      if (!cuenta || cuenta.getTipo() !== 'PAGAR') {
        throw new Error('Cuenta por pagar no encontrada');
      }
      const anulacionExistente = extraerResultado(
        await this.cuentaQuery.findMovimientoByIdempotencyKey(idempotencyKey),
      );
      if (cuenta.getEstado() === 'PAGADA' && !conReembolso) {
        throw new Error(
          'Una cuenta pagada requiere devolución con reembolso explícito',
        );
      }
      if (
        !anulacionExistente
        && !['ANULADA', 'PAGADA'].includes(cuenta.getEstado())
      ) {
        const anulacion = this.cuentaDominioServicio.construirAnulacion(
          cuenta,
          motivo,
          obtener(params, 'usuarioId', 'usuario_id'),
          obtener(params, 'usuarioNombre', 'usuario_nombre'),
          {
            operacionId,
            idempotencyKey,
            traceId: params.traceId,
          },
        );
        cuenta.setSaldo(0);
        cuenta.setEstado('ANULADA');
        await this.cuentaCommand.saveMovimiento(anulacion, cuenta);
      }
      if (cuenta.getEstado() === 'ANULADA') {
        cuentaAnuladaId = cuenta.getId();
      }
    }

    let movimiento = null;
    if (conReembolso) {
      const cajaTipo = obtener(params, 'cajaTipo', 'caja_tipo');
      const cajaId = Number(obtener(params, 'cajaId', 'caja_id'));
      const destino = this.obtenerDestinoPorCaja(cajaTipo);
      movimiento = extraerResultado(
        await destino.movimientoQuery.findByIdempotencyKey(idempotencyKey),
      );
      if (!movimiento) {
        const caja = await this.obtenerCajaSeleccionada(destino, cajaId);
        const monto = redondear(obtener(params, 'montoTotal', 'monto_total'));
        if (!(monto > 0)) throw new Error('monto_total válido es requerido');
        const operacionOriginal = obtener(
          params,
          'operacionIdOriginal',
          'operacion_id_original',
        );
        if (!operacionOriginal) {
          throw new Error('operacion_id_original es requerido');
        }
        const originales = await this.buscarMovimientosOriginales(
          [operacionOriginal],
        );
        const originalEncontrado = originales.find(
          ({ movimientoOriginal }) =>
            movimientoOriginal.getCategoria() === 'PAGO_PROVEEDOR',
        );
        if (!originalEncontrado) {
          throw new Error('No se encontró el pago original de la compra');
        }
        if (
          originalEncontrado.destino.tipoCaja !== destino.tipoCaja
          || Number(originalEncontrado.movimientoOriginal.getCajaBancoId()) !== cajaId
        ) {
          throw new Error(
            'El reembolso debe registrarse en la misma caja del pago original',
          );
        }
        const original = originalEncontrado.movimientoOriginal;
        movimiento = this.construirMovimientoCaja({
          params,
          caja,
          tipo: 'INGRESO',
          monto,
          categoria: 'DEVOLUCION_PROVEEDOR',
          origen: 'INVENTARIO',
          operacionId,
          idempotencyKey,
        });
        movimiento.setMovimientoRevertidoId(original?.getId?.() ?? null);
        movimiento.setMotivo(motivo);
        movimiento = extraerResultado(
          await destino.movimientoCommand.save(movimiento),
        );
      }
    }

    return {
      movimiento_id: movimiento?.getId?.() ?? null,
      cuenta_anulada_id: cuentaAnuladaId,
    };
  }

  async procesarAjuste(params = {}) {
    const { operacionId, idempotencyKey } = validarIdentificadores(params);
    const tipo = String(params.tipo ?? '').toUpperCase();
    const categoria = String(params.categoria ?? '').toUpperCase();
    const monto = redondear(params.monto);
    if (!['INGRESO', 'EGRESO'].includes(tipo) || !(monto > 0)) {
      throw new Error('tipo y monto válido son requeridos');
    }
    if (!['AJUSTE', 'OTRO_INGRESO', 'OTRO_EGRESO', 'PAGO_TRABAJADOR'].includes(categoria)) {
      throw new Error('Categoría de ajuste no permitida');
    }
    if (!params.motivo) throw new Error('El motivo es requerido');

    const destino = this.obtenerDestinoPorCaja(
      obtener(params, 'cajaTipo', 'caja_tipo'),
    );
    let movimiento = extraerResultado(
      await destino.movimientoQuery.findByIdempotencyKey(idempotencyKey),
    );
    if (!movimiento) {
      const caja = await this.obtenerCajaSeleccionada(
        destino,
        Number(obtener(params, 'cajaId', 'caja_id')),
      );
      if (tipo === 'EGRESO') {
        this.movFinancieroDominioServicio.validarSaldoSuficiente(caja, monto);
      }
      movimiento = this.construirMovimientoCaja({
        params,
        caja,
        tipo,
        monto,
        categoria,
        origen: 'AJUSTE',
        operacionId,
        idempotencyKey,
        afectaFlujoOperativo: categoria !== 'AJUSTE',
      });
      movimiento.setMotivo(params.motivo);
      movimiento = extraerResultado(
        await destino.movimientoCommand.save(movimiento),
      );
    }
    return { movimiento_id: movimiento.getId() };
  }

  obtenerDestinoCaja(metodoCobro) {
    if (metodoCobro === 'EFECTIVO') {
      return {
        tipoCaja: 'CHICA',
        cajaQuery: this.cajaChicaQuery,
        cajaCommand: this.cajaChicaCommand,
        movimientoQuery: this.movChicaQuery,
        movimientoCommand: this.movChicaCommand,
      };
    }

    return {
      tipoCaja: 'BANCO',
      cajaQuery: this.cajaBancoQuery,
      cajaCommand: this.cajaBancoCommand,
      movimientoQuery: this.movBancoQuery,
      movimientoCommand: this.movBancoCommand,
    };
  }

  obtenerDestinoPorCaja(cajaTipo) {
    const tipo = String(cajaTipo ?? '').toUpperCase();
    if (tipo === 'CHICA') return this.obtenerDestinoCaja('EFECTIVO');
    if (tipo === 'BANCO') return this.obtenerDestinoCaja('TRANSFERENCIA');
    throw new Error('caja_tipo debe ser BANCO o CHICA');
  }

  async obtenerCajaSeleccionada(destino, cajaId) {
    if (!cajaId) throw new Error('caja_id es requerido');
    const caja = extraerResultado(await destino.cajaQuery.buscarPorId(cajaId));
    if (!caja) throw new Error('Caja no encontrada');
    this.movFinancieroDominioServicio.validarCajaAbierta(caja);
    return caja;
  }

  async obtenerCajaAbierta(cajaQuery) {
    const caja = extraerResultado(await cajaQuery.cajaAbierta());
    if (!caja) {
      throw new Error('No existe una caja abierta para el método de cobro');
    }
    this.movFinancieroDominioServicio.validarCajaAbierta(caja);
    return caja;
  }

  construirMovimientoIngreso({
    params,
    caja,
    monto,
    categoria,
    origen,
    operacionId,
    idempotencyKey,
  }) {
    return this.movFinancieroDominioServicio.construirMovimiento({
      caja_banco_id: caja.getId(),
      tipo: 'INGRESO',
      categoria,
      origen,
      monto,
      saldo_anterior: caja.getSaldoActual(),
      saldo_nuevo: this.movFinancieroDominioServicio.calcularSaldoNuevo(
        caja.getSaldoActual(),
        'INGRESO',
        monto,
      ),
      descripcion: params.descripcion ?? categoria.replaceAll('_', ' '),
      referencia_tipo: obtener(params, 'referenciaTipo', 'referencia_tipo'),
      referencia_id: obtener(params, 'referenciaId', 'referencia_id'),
      referencia_codigo: obtener(params, 'referenciaCodigo', 'referencia_codigo'),
      venta_id: obtener(params, 'referenciaId', 'referencia_id'),
      operacion_id: operacionId,
      idempotency_key: idempotencyKey,
      observacion: params.observacion,
      trace_id: params.traceId,
      usuario_id: obtener(params, 'usuarioId', 'usuario_id'),
      usuario_nombre: obtener(params, 'usuarioNombre', 'usuario_nombre'),
      afecta_flujo_operativo: true,
    });
  }

  construirMovimientoCaja({
    params,
    caja,
    tipo,
    monto,
    categoria,
    origen,
    operacionId,
    idempotencyKey,
    afectaFlujoOperativo = true,
  }) {
    return this.movFinancieroDominioServicio.construirMovimiento({
      caja_banco_id: caja.getId(),
      tipo,
      categoria,
      origen,
      monto,
      saldo_anterior: caja.getSaldoActual(),
      saldo_nuevo: this.movFinancieroDominioServicio.calcularSaldoNuevo(
        caja.getSaldoActual(),
        tipo,
        monto,
      ),
      descripcion: params.descripcion ?? categoria.replaceAll('_', ' '),
      referencia_tipo:
        obtener(params, 'referenciaTipo', 'referencia_tipo')
        ?? 'INGRESO',
      referencia_id:
        obtener(params, 'referenciaId', 'referencia_id')
        ?? obtener(params, 'ingresoId', 'ingreso_id'),
      referencia_codigo:
        obtener(params, 'referenciaCodigo', 'referencia_codigo')
        ?? obtener(params, 'ingresoCodigo', 'ingreso_codigo'),
      operacion_id: operacionId,
      idempotency_key: idempotencyKey,
      observacion: params.observacion,
      trace_id: params.traceId,
      usuario_id: obtener(params, 'usuarioId', 'usuario_id'),
      usuario_nombre: obtener(params, 'usuarioNombre', 'usuario_nombre'),
      afecta_flujo_operativo: afectaFlujoOperativo,
    });
  }

  async buscarMovimientosOriginales(operacionIds) {
    const identificadores = Array.isArray(operacionIds)
      ? [...new Set(operacionIds.filter(Boolean))]
      : [];
    const encontrados = [];

    for (const operacionId of identificadores) {
      const movimientosBanco = extraerResultado(
        await this.movBancoQuery.findByOperacionId(operacionId),
      ) ?? [];
      const movimientosChica = extraerResultado(
        await this.movChicaQuery.findByOperacionId(operacionId),
      ) ?? [];
      movimientosBanco.forEach((movimientoOriginal) => encontrados.push({
        movimientoOriginal,
        destino: this.obtenerDestinoCaja('TRANSFERENCIA'),
      }));
      movimientosChica.forEach((movimientoOriginal) => encontrados.push({
        movimientoOriginal,
        destino: this.obtenerDestinoCaja('EFECTIVO'),
      }));
    }

    return encontrados.filter(
      ({ movimientoOriginal }) => !movimientoOriginal.getMovimientoRevertidoId(),
    );
  }
}
