// caja-servicio/src/aplicacion/uses-cases/command/CajaChicaCommandUsesCase.js
import CajaBanco from '../../../dominio/entidades/CajaBanco.js';
import CajaChica from '../../../dominio/entidades/CajaChica.js';

const extraerResultado = (respuesta) => {
  if (respuesta?.estado === 'error') {
    throw new Error(String(respuesta.resultado));
  }

  return respuesta && Object.prototype.hasOwnProperty.call(respuesta, 'resultado')
    ? respuesta.resultado
    : respuesta;
};

const datosPlanos = (valor) => (
  typeof valor?.toJSON === 'function' ? valor.toJSON() : valor
);

const redondear = (valor) => parseFloat(Number(valor).toFixed(2));

const identificadores = (datos = {}) => ({
  operacionId: datos.operacionId ?? datos.operacion_id,
  idempotencyKey: datos.idempotencyKey ?? datos.idempotency_key,
  idempotencyKeys: datos.idempotencyKeys ?? datos.idempotency_keys ?? {},
});

export default class CajaChicaCommandUsesCase {
  constructor(
    cajaChicaCommandPuerto,
    cajaChicaQueryPuerto,
    cajaBancoCommandPuerto,
    cajaBancoQueryPuerto,
    movimientoBancoCommandPuerto,
    movimientoBancoQueryPuerto,
    movimientoChicaCommandPuerto,
    movimientoChicaQueryPuerto,
    dominioServicio,
  ) {
    this.cajaChicaCommandPuerto = cajaChicaCommandPuerto;
    this.cajaChicaQueryPuerto = cajaChicaQueryPuerto;
    this.cajaBancoCommandPuerto = cajaBancoCommandPuerto;
    this.cajaBancoQueryPuerto = cajaBancoQueryPuerto;
    this.movimientoBancoCommandPuerto = movimientoBancoCommandPuerto;
    this.movimientoBancoQueryPuerto = movimientoBancoQueryPuerto;
    this.movimientoChicaCommandPuerto = movimientoChicaCommandPuerto;
    this.movimientoChicaQueryPuerto = movimientoChicaQueryPuerto;
    this.dominioServicio = dominioServicio;
  }

  async abrirCajaChica(datos = {}) {
    const cajaBancoId = Number(datos.cajaBancoId ?? datos.caja_banco_id);
    const montoInicial = redondear(datos.montoInicial ?? datos.monto_inicial ?? 0);
    if (!cajaBancoId) {
      throw new Error('La Caja Banco es requerida');
    }
    if (!(montoInicial >= 0)) {
      throw new Error('El monto inicial debe ser mayor que cero');
    }
    if (!datos.usuarioId && !datos.usuario_id) {
      throw new Error('El usuario es requerido');
    }
    const { operacionId, idempotencyKeys } = identificadores(datos);
    if (!operacionId || !idempotencyKeys.salida || !idempotencyKeys.entrada) {
      throw new Error(
        'operacion_id e idempotency_keys.salida/entrada son requeridos',
      );
    }

    const sucursalId = Number(datos.sucursalId ?? datos.sucursal_id);
    if (!sucursalId) {
      throw new Error('La sucursal es requerida para abrir una Caja Chica');
    }

    // El bloqueo es por sucursal: dos sucursales pueden tener su caja abierta a la vez.
    const abierta = extraerResultado(
      await this.cajaChicaQueryPuerto.cajaAbierta(sucursalId),
    );
    if (abierta) {
      throw new Error('Esta sucursal ya tiene una Caja Chica abierta');
    }

    const cajaBanco = this.convertirCajaBanco(
      extraerResultado(await this.cajaBancoQueryPuerto.buscarPorId(cajaBancoId)),
    );
    this.dominioServicio.validarCajaAbierta(cajaBanco);
    this.dominioServicio.validarSaldoSuficiente(cajaBanco, montoInicial);

    const cajaChica = new CajaChica({
      ...datos,
      fecha: datos.fecha ?? new Date(),
      cajaBancoId,
      montoInicial,
      montoActual: 0,
      estado: 'ABIERTA',
      activo: true,
      ingresosAcumulados: 0,
      egresosAcumulados: 0,
      totalMovimientos: 0,
    });
    const respuestaCaja = await this.cajaChicaCommandPuerto.abrir(cajaChica);
    const cajaGuardada = this.convertirCajaChica(extraerResultado(respuestaCaja));
    const [movimientoBanco, movimientoChica] =
      this.dominioServicio.construirParTransferencia(
        cajaBanco,
        cajaGuardada,
        montoInicial,
        operacionId,
        cajaChica.getUsuarioId(),
        cajaChica.getUsuarioNombre(),
        idempotencyKeys,
      );

    movimientoBanco.setCategoria('REPOSICION_CAJA_CHICA');
    movimientoBanco.setReferenciaTipo('CAJA_CHICA');
    movimientoBanco.setReferenciaId(cajaGuardada.getId());
    movimientoChica.setCategoria('REPOSICION_CAJA_CHICA');
    movimientoChica.setReferenciaTipo('CAJA_BANCO');
    movimientoChica.setReferenciaId(cajaBanco.getId());

    const salidaBanco = await this.guardarMovimientoBanco(movimientoBanco);
    const entradaChica = await this.guardarMovimientoChica(movimientoChica);
    cajaGuardada.setMontoActual(montoInicial);
    cajaGuardada.setIngresosAcumulados(montoInicial);
    cajaGuardada.setTotalMovimientos(1);

    return {
      estado: 'ok',
      resultado: {
        caja: cajaGuardada,
        movimientos: [salidaBanco, entradaChica],
      },
    };
  }

  async cerrarCajaChica(datos = {}) {
    const cajaChicaId = Number(datos.id ?? datos.cajaChicaId ?? datos.caja_chica_id);
    if (!cajaChicaId) {
      throw new Error('El id es requerido');
    }

    const cajaChica = this.convertirCajaChica(
      extraerResultado(await this.cajaChicaQueryPuerto.buscarPorId(cajaChicaId)),
    );
    this.dominioServicio.validarCajaAbierta(cajaChica);

    const saldoContado = Number(
      datos.saldoContado
      ?? datos.saldo_contado
      ?? datos.saldoContadoCierre
      ?? datos.saldo_contado_cierre,
    );
    if (!Number.isFinite(saldoContado) || saldoContado < 0) {
      throw new Error('El saldo contado es requerido');
    }

    const diferenciaArqueo = redondear(
      saldoContado - Number(cajaChica.getSaldoActual()),
    );
    const motivo = datos.motivo ?? datos.motivoDiferencia ?? datos.motivo_diferencia ?? null;
    const transferirABanco =
      datos.transferirABanco
      ?? datos.transferir_a_banco
      ?? true;

    if (diferenciaArqueo !== 0 && !motivo) {
      throw new Error('El motivo de la diferencia es requerido');
    }
    if (transferirABanco === false && saldoContado > 0 && !motivo) {
      throw new Error('El motivo para no transferir el saldo es requerido');
    }

    const movimientos = [];
    const {
      operacionId,
      idempotencyKey,
      idempotencyKeys,
    } = identificadores(datos);
    if (diferenciaArqueo !== 0) {
      const claveAjuste = idempotencyKeys.ajuste ?? idempotencyKey;
      if (!operacionId || !claveAjuste) {
        throw new Error(
          'operacion_id e idempotency_key son requeridos para el ajuste',
        );
      }
      const ajuste = this.dominioServicio.construirMovimiento({
        caja_banco_id: cajaChica.getId(),
        tipo: diferenciaArqueo > 0 ? 'INGRESO' : 'EGRESO',
        categoria: 'AJUSTE',
        origen: 'AJUSTE',
        monto: Math.abs(diferenciaArqueo),
        saldo_anterior: cajaChica.getSaldoActual(),
        saldo_nuevo: saldoContado,
        descripcion: 'Ajuste por arqueo de cierre de Caja Chica',
        referencia_tipo: 'CIERRE_CAJA_CHICA',
        referencia_id: cajaChica.getId(),
        operacion_id: operacionId,
        idempotency_key: claveAjuste,
        motivo,
        observacion: datos.observacion ?? null,
        usuario_id: datos.usuarioId ?? datos.usuario_id,
        usuario_nombre: datos.usuarioNombre ?? datos.usuario_nombre,
      });
      movimientos.push(await this.guardarMovimientoChica(ajuste));
    }

    if (transferirABanco && saldoContado > 0) {
      cajaChica.setSaldoActual(saldoContado);
      const cajaBanco = this.convertirCajaBanco(
        extraerResultado(
          await this.cajaBancoQueryPuerto.buscarPorId(cajaChica.getCajaBancoId()),
        ),
      );
      this.dominioServicio.validarCajaAbierta(cajaBanco);

      if (!operacionId || !idempotencyKeys.salida || !idempotencyKeys.entrada) {
        throw new Error(
          'operacion_id e idempotency_keys.salida/entrada son requeridos',
        );
      }
      const [salidaChica, entradaBanco] =
        this.dominioServicio.construirParTransferencia(
          cajaChica,
          cajaBanco,
          saldoContado,
          operacionId,
          datos.usuarioId ?? datos.usuario_id,
          datos.usuarioNombre ?? datos.usuario_nombre,
          idempotencyKeys,
        );
      salidaChica.setCategoria('DEVOLUCION_CAJA_CHICA');
      salidaChica.setReferenciaTipo('CAJA_BANCO');
      salidaChica.setReferenciaId(cajaBanco.getId());
      entradaBanco.setCategoria('TRANSFERENCIA_ENTRADA');
      entradaBanco.setReferenciaTipo('CAJA_CHICA');
      entradaBanco.setReferenciaId(cajaChica.getId());

      movimientos.push(
        await this.guardarMovimientoChica(salidaChica),
        await this.guardarMovimientoBanco(entradaBanco),
      );
    }

    const diferenciaCierre = transferirABanco
      ? diferenciaArqueo
      : redondear(saldoContado);
    const respuestaCaja = await this.cajaChicaCommandPuerto.cerrar(
      cajaChicaId,
      {
        montoActual: transferirABanco ? 0 : saldoContado,
        saldoContadoCierre: saldoContado,
        diferenciaCierre,
        motivoDiferencia: motivo,
        transferirABanco,
        cerradoEn: new Date(),
        cerradoPorId:
          datos.cerradoPorId
          ?? datos.cerrado_por_id
          ?? datos.usuarioId
          ?? datos.usuario_id,
        cerradoPorNombre:
          datos.cerradoPorNombre
          ?? datos.cerrado_por_nombre
          ?? datos.usuarioNombre
          ?? datos.usuario_nombre,
      },
    );

    return {
      estado: 'ok',
      resultado: {
        caja: this.convertirCajaChica(extraerResultado(respuestaCaja)),
        movimientos,
      },
    };
  }

  async reponerCajaChica(datos = {}) {
    return this.transferirEntreCajas(datos, {
      categoriaSalida: 'REPOSICION_CAJA_CHICA',
      categoriaEntrada: 'REPOSICION_CAJA_CHICA',
      origenEsBanco: true,
    });
  }

  async devolverCajaChica(datos = {}) {
    return this.transferirEntreCajas(datos, {
      categoriaSalida: 'DEVOLUCION_CAJA_CHICA',
      categoriaEntrada: 'TRANSFERENCIA_ENTRADA',
      origenEsBanco: false,
    });
  }

  abrir(datos) {
    return this.abrirCajaChica(datos);
  }

  cerrar(datos) {
    return this.cerrarCajaChica(datos);
  }

  async registrarMovimiento(datos = {}) {
    const cajaChicaId = Number(datos.cajaChicaId ?? datos.caja_chica_id);
    if (!cajaChicaId || !datos.tipo || !datos.categoria || !(Number(datos.monto) > 0)) {
      throw new Error('Caja, tipo, categoría y monto válido son requeridos');
    }

    const caja = this.convertirCajaChica(
      extraerResultado(await this.cajaChicaQueryPuerto.buscarPorId(cajaChicaId)),
    );
    this.dominioServicio.validarCajaAbierta(caja);
    if (datos.tipo === 'EGRESO') {
      this.dominioServicio.validarSaldoSuficiente(caja, datos.monto);
    }
    const { operacionId, idempotencyKey } = identificadores(datos);
    if (!operacionId || !idempotencyKey) {
      throw new Error('operacion_id e idempotency_key son requeridos');
    }

    const movimiento = this.dominioServicio.construirMovimiento({
      ...datos,
      caja_banco_id: cajaChicaId,
      saldo_anterior: caja.getSaldoActual(),
      saldo_nuevo: this.dominioServicio.calcularSaldoNuevo(
        caja.getSaldoActual(),
        datos.tipo,
        datos.monto,
      ),
      operacion_id: operacionId,
      idempotency_key: idempotencyKey,
    });

    return {
      estado: 'ok',
      resultado: await this.guardarMovimientoChica(movimiento),
    };
  }

  eliminarMovimiento() {
    throw new Error('Los movimientos son inmutables');
  }

  async revertirMovimiento(id, datos = {}) {
    if (!id) {
      throw new Error('El id es requerido');
    }
    if (!datos.motivo) {
      throw new Error('El motivo es requerido');
    }
    const { operacionId, idempotencyKey } = identificadores(datos);
    if (!operacionId || !idempotencyKey) {
      throw new Error('operacion_id e idempotency_key son requeridos');
    }

    const movimientoOriginal = extraerResultado(
      await this.movimientoChicaQueryPuerto.findById(id),
    );
    if (!movimientoOriginal) {
      throw new Error('Movimiento no encontrado');
    }

    const caja = this.convertirCajaChica(
      extraerResultado(
        await this.cajaChicaQueryPuerto.buscarPorId(
          movimientoOriginal.getCajaBancoId(),
        ),
      ),
    );
    this.dominioServicio.validarCajaAbierta(caja);
    const reverso = this.dominioServicio.construirReverso(
      movimientoOriginal,
      datos.motivo,
      datos.usuarioId ?? datos.usuario_id,
      datos.usuarioNombre ?? datos.usuario_nombre,
      operacionId,
      idempotencyKey,
    );
    reverso.setCajaBancoId(caja.getId());

    return {
      estado: 'ok',
      resultado: await this.guardarMovimientoChica(reverso),
    };
  }

  async transferirEntreCajas(datos, configuracion) {
    const cajaChicaId = Number(datos.id ?? datos.cajaChicaId ?? datos.caja_chica_id);
    const monto = redondear(datos.monto);
    if (!cajaChicaId || !(monto > 0)) {
      throw new Error('La Caja Chica y un monto válido son requeridos');
    }

    const cajaChica = this.convertirCajaChica(
      extraerResultado(await this.cajaChicaQueryPuerto.buscarPorId(cajaChicaId)),
    );
    const cajaBanco = this.convertirCajaBanco(
      extraerResultado(
        await this.cajaBancoQueryPuerto.buscarPorId(cajaChica.getCajaBancoId()),
      ),
    );
    this.dominioServicio.validarCajaAbierta(cajaChica);
    this.dominioServicio.validarCajaAbierta(cajaBanco);

    const cajaOrigen = configuracion.origenEsBanco ? cajaBanco : cajaChica;
    const cajaDestino = configuracion.origenEsBanco ? cajaChica : cajaBanco;
    this.dominioServicio.validarSaldoSuficiente(cajaOrigen, monto);

    const { operacionId, idempotencyKeys } = identificadores(datos);
    if (!operacionId || !idempotencyKeys.salida || !idempotencyKeys.entrada) {
      throw new Error(
        'operacion_id e idempotency_keys.salida/entrada son requeridos',
      );
    }
    const [movimientoSalida, movimientoEntrada] =
      this.dominioServicio.construirParTransferencia(
        cajaOrigen,
        cajaDestino,
        monto,
        operacionId,
        datos.usuarioId ?? datos.usuario_id,
        datos.usuarioNombre ?? datos.usuario_nombre,
        idempotencyKeys,
      );
    movimientoSalida.setCategoria(configuracion.categoriaSalida);
    movimientoEntrada.setCategoria(configuracion.categoriaEntrada);
    movimientoSalida.setReferenciaTipo(cajaDestino.getTipoCaja());
    movimientoSalida.setReferenciaId(cajaDestino.getId());
    movimientoEntrada.setReferenciaTipo(cajaOrigen.getTipoCaja());
    movimientoEntrada.setReferenciaId(cajaOrigen.getId());

    const salida = configuracion.origenEsBanco
      ? await this.guardarMovimientoBanco(movimientoSalida)
      : await this.guardarMovimientoChica(movimientoSalida);
    const entrada = configuracion.origenEsBanco
      ? await this.guardarMovimientoChica(movimientoEntrada)
      : await this.guardarMovimientoBanco(movimientoEntrada);

    return {
      estado: 'ok',
      resultado: {
        operacionId,
        movimientos: [salida, entrada],
      },
    };
  }

  convertirCajaBanco(valor) {
    if (valor instanceof CajaBanco) {
      return valor;
    }

    return new CajaBanco(datosPlanos(valor) ?? {});
  }

  convertirCajaChica(valor) {
    if (valor instanceof CajaChica) {
      return valor;
    }

    return new CajaChica(datosPlanos(valor) ?? {});
  }

  async guardarMovimientoBanco(movimiento) {
    const existente = extraerResultado(
      await this.movimientoBancoQueryPuerto.findByIdempotencyKey(
        movimiento.getIdempotencyKey(),
      ),
    );
    if (existente) {
      return existente;
    }

    return extraerResultado(
      await this.movimientoBancoCommandPuerto.save(movimiento),
    );
  }

  async guardarMovimientoChica(movimiento) {
    const existente = extraerResultado(
      await this.movimientoChicaQueryPuerto.findByIdempotencyKey(
        movimiento.getIdempotencyKey(),
      ),
    );
    if (existente) {
      return existente;
    }

    return extraerResultado(
      await this.movimientoChicaCommandPuerto.save(movimiento),
    );
  }
}
