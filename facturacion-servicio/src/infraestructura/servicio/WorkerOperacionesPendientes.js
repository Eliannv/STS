// facturacion-servicio/src/infraestructura/servicio/WorkerOperacionesPendientes.js
export default class WorkerOperacionesPendientes {
  constructor(
    operacionQuery,
    operacionCommand,
    cajaHttp,
    ventaTarjetaCommand = null,
    intervaloMs = 30000,
  ) {
    this.operacionQuery = operacionQuery;
    this.operacionCommand = operacionCommand;
    this.cajaHttp = cajaHttp;
    this.ventaTarjetaCommand = ventaTarjetaCommand;
    this.intervaloMs = intervaloMs;
    this.temporizador = null;
    this.ejecutando = false;
  }

  start() {
    if (this.temporizador) return;
    this.temporizador = setInterval(
      () => this.ejecutar(),
      this.intervaloMs,
    );
    this.temporizador.unref?.();
  }

  stop() {
    if (!this.temporizador) return;
    clearInterval(this.temporizador);
    this.temporizador = null;
  }

  async ejecutar() {
    if (this.ejecutando) return;
    this.ejecutando = true;
    try {
      const pendientes = await this.operacionQuery.findPendientes(10);
      for (const operacion of pendientes) {
        await this.procesar(operacion);
      }
    } catch (error) {
      console.error('Worker de operaciones financieras:', error.message);
    } finally {
      this.ejecutando = false;
    }
  }

  async procesar(operacion) {
    try {
      const respuesta = await this.enviar(operacion);
      if (respuesta.ok) {
        await this.actualizarEstadoAbono(operacion, 'APLICADO');
        await this.operacionCommand.marcarAplicado(
          operacion.getId(),
          respuesta.data,
        );
        return;
      }

      const intentos = Number(operacion.getIntentos() ?? 0) + 1;
      if (intentos >= 5) {
        await this.actualizarEstadoAbono(operacion, 'ERROR');
        await this.operacionCommand.incrementarIntentos(
          operacion.getId(),
          null,
          respuesta.error,
        );
        await this.operacionCommand.marcarError(
          operacion.getId(),
          respuesta.error,
        );
        return;
      }

      const segundos = Math.min(intentos ** 2 * 30, 3600);
      const proximoReintento = new Date(Date.now() + segundos * 1000);
      await this.operacionCommand.incrementarIntentos(
        operacion.getId(),
        proximoReintento,
        respuesta.error,
      );
    } catch (error) {
      console.error(
        `Operación financiera ${operacion.getId()} no procesada:`,
        error.message,
      );
    }
  }

  enviar(operacion) {
    const tipo = operacion.getTipo();
    if (tipo === 'ACREDITACION_TARJETA') {
      return this.cajaHttp.postAcreditacionTarjeta(
        operacion.getPayload(),
        operacion.getTraceId(),
      );
    }
    if (tipo.startsWith('VENTA_')) {
      return this.cajaHttp.postVenta(
        operacion.getPayload(),
        operacion.getTraceId(),
      );
    }
    if (tipo.startsWith('COBRO_')) {
      return this.cajaHttp.postCobro(
        operacion.getPayload(),
        operacion.getTraceId(),
      );
    }
    return this.cajaHttp.postAnulacion(
      operacion.getPayload(),
      operacion.getTraceId(),
    );
  }

  async actualizarEstadoAbono(operacion, estado) {
    if (
      operacion.getTipo() !== 'ACREDITACION_TARJETA'
      || !this.ventaTarjetaCommand
    ) {
      return;
    }
    const abonoId = operacion.getPayload()?.abono_venta_tarjeta_id;
    if (abonoId) {
      await this.ventaTarjetaCommand.actualizarEstadoAbono(abonoId, estado);
    }
  }
}
