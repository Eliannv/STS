// caja-servicio/src/aplicacion/uses-cases/command/CajaBancoCommandUsesCase.js
import CajaBanco from '../../../dominio/entidades/CajaBanco.js';

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

const normalizarPeriodo = (valor) => {
  if (!valor) {
    throw new Error('El periodo es requerido');
  }

  if (/^\d{4}-\d{2}$/.test(String(valor))) {
    return `${valor}-01`;
  }

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    throw new Error('Periodo inválido');
  }

  const anio = fecha.getUTCFullYear();
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
  return `${anio}-${mes}-01`;
};

export default class CajaBancoCommandUsesCase {
  constructor(
    cajaBancoCommandPuerto,
    cajaBancoQueryPuerto,
    movimientoCommandPuerto,
    movimientoQueryPuerto,
    dominioServicio,
    cajaChicaQueryPuerto = null,
  ) {
    this.cajaBancoCommandPuerto = cajaBancoCommandPuerto;
    this.cajaBancoQueryPuerto = cajaBancoQueryPuerto;
    this.movimientoCommandPuerto = movimientoCommandPuerto;
    this.movimientoQueryPuerto = movimientoQueryPuerto;
    this.dominioServicio = dominioServicio;
    this.cajaChicaQueryPuerto = cajaChicaQueryPuerto;
  }

  async abrirCajaBanco(datos = {}) {
    if (!datos.usuarioId && !datos.usuario_id) {
      throw new Error('El usuario es requerido');
    }
    const operacionId = datos.operacionId ?? datos.operacion_id;
    const idempotencyKey = datos.idempotencyKey ?? datos.idempotency_key;
    if (!operacionId || !idempotencyKey) {
      throw new Error('operacion_id e idempotency_key son requeridos');
    }

    const fecha = datos.fecha ?? new Date();
    const periodo = normalizarPeriodo(datos.periodo ?? fecha);
    const abierta = extraerResultado(
      await this.cajaBancoQueryPuerto.cajaAbierta(),
    );

    if (abierta) {
      throw new Error('Ya existe una Caja Banco abierta');
    }

    if (typeof this.cajaBancoQueryPuerto.buscarPorMes === 'function') {
      const cajasPeriodo = extraerResultado(
        await this.cajaBancoQueryPuerto.buscarPorMes(periodo.slice(0, 7)),
      );

      if (Array.isArray(cajasPeriodo) && cajasPeriodo.length > 0) {
        throw new Error(`Ya existe una Caja Banco para ${periodo.slice(0, 7)}`);
      }
    }

    const ultimaCerrada = await this.buscarUltimaCajaCerrada();
    const saldoHeredado = ultimaCerrada
      ? Number(
        ultimaCerrada.getSaldoContadoCierre()
        ?? ultimaCerrada.getSaldoActual()
        ?? 0,
      )
      : 0;
    const saldoInicial = redondear(
      datos.saldoInicial
      ?? datos.saldo_inicial
      ?? saldoHeredado,
    );

    const caja = new CajaBanco({
      ...datos,
      fecha,
      periodo,
      fechaApertura: datos.fechaApertura ?? datos.fecha_apertura ?? new Date(),
      saldoInicial,
      saldoActual: 0,
      estado: 'ABIERTA',
      activo: true,
      ingresosAcumulados: 0,
      egresosAcumulados: 0,
      totalMovimientos: 0,
    });

    const respuestaCaja = await this.cajaBancoCommandPuerto.abrir(caja);
    const cajaGuardada = this.convertirCaja(extraerResultado(respuestaCaja));
    const movimientoApertura = this.dominioServicio.construirMovimientoApertura(
      cajaGuardada,
      saldoInicial,
      caja.getUsuarioId(),
      caja.getUsuarioNombre(),
      operacionId,
      idempotencyKey,
    );

    const movimientoGuardado = await this.guardarMovimientoIdempotente(
      movimientoApertura,
    );
    cajaGuardada.setSaldoActual(saldoInicial);
    cajaGuardada.setTotalMovimientos(1);

    return {
      estado: 'ok',
      resultado: {
        caja: cajaGuardada,
        movimiento: movimientoGuardado,
        saldoHeredado,
      },
    };
  }

  async cerrarCajaBanco(datos = {}) {
    const cajaId = Number(datos.id ?? datos.cajaBancoId ?? datos.caja_banco_id);
    if (!cajaId) {
      throw new Error('El id es requerido');
    }

    const caja = this.convertirCaja(
      extraerResultado(await this.cajaBancoQueryPuerto.buscarPorId(cajaId)),
    );
    this.dominioServicio.validarCajaAbierta(caja);

    const cajaChicaAbierta = await this.buscarCajaChicaAbierta(cajaId);
    if (cajaChicaAbierta) {
      throw new Error('Debe cerrar la Caja Chica asociada antes de cerrar la Caja Banco');
    }

    const saldoContado = Number(
      datos.saldoContado
      ?? datos.saldo_contado
      ?? datos.saldoContadoCierre
      ?? datos.saldo_contado_cierre,
    );
    if (!Number.isFinite(saldoContado) || saldoContado < 0) {
      throw new Error('El saldo contado es requerido');
    }

    const diferencia = redondear(saldoContado - Number(caja.getSaldoActual()));
    const motivo = datos.motivo ?? datos.motivoDiferencia ?? datos.motivo_diferencia ?? null;
    if (diferencia !== 0 && !motivo) {
      throw new Error('El motivo de la diferencia es requerido');
    }

    let movimientoAjuste = null;
    if (diferencia !== 0) {
      const operacionId =
        datos.operacionIdAjuste
        ?? datos.operacion_id_ajuste
        ?? datos.operacionId
        ?? datos.operacion_id;
      const idempotencyKey =
        datos.idempotencyKeyAjuste
        ?? datos.idempotency_key_ajuste
        ?? datos.idempotencyKey
        ?? datos.idempotency_key;
      if (!operacionId || !idempotencyKey) {
        throw new Error(
          'operacion_id e idempotency_key son requeridos para el ajuste',
        );
      }
      const tipo = diferencia > 0 ? 'INGRESO' : 'EGRESO';
      movimientoAjuste = this.dominioServicio.construirMovimiento({
        caja_banco_id: caja.getId(),
        tipo,
        categoria: 'AJUSTE',
        origen: 'AJUSTE',
        monto: Math.abs(diferencia),
        saldo_anterior: caja.getSaldoActual(),
        saldo_nuevo: saldoContado,
        descripcion: 'Ajuste por arqueo de cierre de Caja Banco',
        referencia_tipo: 'CIERRE_CAJA_BANCO',
        referencia_id: caja.getId(),
        operacion_id: operacionId,
        idempotency_key: idempotencyKey,
        motivo,
        observacion: datos.observacion ?? datos.observacionCierre ?? datos.observacion_cierre,
        usuario_id: datos.usuarioId ?? datos.usuario_id,
        usuario_nombre: datos.usuarioNombre ?? datos.usuario_nombre,
      });
      movimientoAjuste = await this.guardarMovimientoIdempotente(movimientoAjuste);
    }

    const datosCierre = {
      saldoActual: saldoContado,
      saldoContadoCierre: saldoContado,
      diferenciaCierre: diferencia,
      motivoDiferencia: motivo,
      observacionCierre:
        datos.observacion
        ?? datos.observacionCierre
        ?? datos.observacion_cierre
        ?? null,
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
    };
    const respuestaCaja = await this.cajaBancoCommandPuerto.cerrar(
      cajaId,
      datosCierre,
    );

    return {
      estado: 'ok',
      resultado: {
        caja: this.convertirCaja(extraerResultado(respuestaCaja)),
        movimientoAjuste,
      },
    };
  }

  abrir(datos) {
    return this.abrirCajaBanco(datos);
  }

  cerrar(datos) {
    return this.cerrarCajaBanco(datos);
  }

  async registrarMovimiento(datos = {}) {
    const cajaId = Number(datos.cajaBancoId ?? datos.caja_banco_id);
    if (!cajaId || !datos.tipo || !datos.categoria || !(Number(datos.monto) > 0)) {
      throw new Error('Caja, tipo, categoría y monto válido son requeridos');
    }

    const caja = this.convertirCaja(
      extraerResultado(await this.cajaBancoQueryPuerto.buscarPorId(cajaId)),
    );
    this.dominioServicio.validarCajaAbierta(caja);
    if (datos.tipo === 'EGRESO') {
      this.dominioServicio.validarSaldoSuficiente(caja, datos.monto);
    }

    const idempotencyKey = datos.idempotencyKey ?? datos.idempotency_key;
    const operacionId = datos.operacionId ?? datos.operacion_id;
    if (!idempotencyKey || !operacionId) {
      throw new Error('operacion_id e idempotency_key son requeridos');
    }
    const movimiento = this.dominioServicio.construirMovimiento({
      ...datos,
      caja_banco_id: cajaId,
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
      resultado: await this.guardarMovimientoIdempotente(movimiento),
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
    const operacionId = datos.operacionId ?? datos.operacion_id;
    const idempotencyKey = datos.idempotencyKey ?? datos.idempotency_key;
    if (!operacionId || !idempotencyKey) {
      throw new Error('operacion_id e idempotency_key son requeridos');
    }

    const movimientoOriginal = extraerResultado(
      await this.movimientoQueryPuerto.findById(id),
    );
    if (!movimientoOriginal) {
      throw new Error('Movimiento no encontrado');
    }

    const caja = this.convertirCaja(
      extraerResultado(
        await this.cajaBancoQueryPuerto.buscarPorId(
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
      resultado: await this.guardarMovimientoIdempotente(reverso),
    };
  }

  async buscarUltimaCajaCerrada() {
    const respuesta = await this.cajaBancoQueryPuerto.lista({
      estado: 'CERRADA',
      limit: 1,
      offset: 0,
    });
    const resultado = extraerResultado(respuesta);
    const ultima = Array.isArray(resultado) ? resultado[0] : resultado?.rows?.[0];
    return ultima ? this.convertirCaja(ultima) : null;
  }

  async buscarCajaChicaAbierta(cajaBancoId) {
    if (!this.cajaChicaQueryPuerto) {
      return null;
    }

    if (typeof this.cajaChicaQueryPuerto.buscarAbiertaPorCajaBanco === 'function') {
      return extraerResultado(
        await this.cajaChicaQueryPuerto.buscarAbiertaPorCajaBanco(cajaBancoId),
      );
    }

    const respuesta = await this.cajaChicaQueryPuerto.lista({
      estado: 'ABIERTA',
      cajaBancoId,
      limit: 1,
      offset: 0,
    });
    const resultado = extraerResultado(respuesta);
    return Array.isArray(resultado) ? resultado[0] ?? null : resultado?.rows?.[0] ?? null;
  }

  convertirCaja(valor) {
    if (valor instanceof CajaBanco) {
      return valor;
    }

    return new CajaBanco(datosPlanos(valor) ?? {});
  }

  async guardarMovimientoIdempotente(movimiento) {
    const existente = extraerResultado(
      await this.movimientoQueryPuerto.findByIdempotencyKey(
        movimiento.getIdempotencyKey(),
      ),
    );
    if (existente) {
      return existente;
    }

    return extraerResultado(
      await this.movimientoCommandPuerto.save(movimiento),
    );
  }
}
