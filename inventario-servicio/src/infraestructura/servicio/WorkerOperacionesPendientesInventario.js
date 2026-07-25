// inventario-servicio/src/infraestructura/servicio/WorkerOperacionesPendientesInventario.js
export default class WorkerOperacionesPendientesInventario {
  constructor(operacionQuery, operacionCommand, cajaHttp, intervaloMs = 30000) {
    this.operacionQuery = operacionQuery;
    this.operacionCommand = operacionCommand;
    this.cajaHttp = cajaHttp;
    this.intervaloMs = intervaloMs;
    this.temporizador = null;
    this.ejecutando = false;
  }

  start() {
    if (this.temporizador) return;
    this.temporizador = setInterval(() => this.ejecutar(), this.intervaloMs);
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
      console.error('Worker financiero de inventario:', error.message);
    } finally {
      this.ejecutando = false;
    }
  }

  async procesar(operacion) {
    try {
      const tipo = operacion.getTipo();
      let respuesta;
      if (['COMPRA_CONTADO', 'COMPRA_CREDITO'].includes(tipo)) {
        respuesta = await this.cajaHttp.postCompra(
          operacion.getPayload(),
          operacion.getTraceId(),
        );
      } else if (['ANULACION_COMPRA', 'DEVOLUCION_PROVEEDOR'].includes(tipo)) {
        respuesta = await this.cajaHttp.postAnulacionCompra(
          operacion.getPayload(),
          operacion.getTraceId(),
        );
      } else if (tipo === 'REEMBOLSO_DEVOLUCION') {
        respuesta = await this.cajaHttp.postDevolucionProveedor(
          operacion.getPayload(),
          operacion.getTraceId(),
        );
      } else if (tipo === 'ANULACION_REEMBOLSO') {
        respuesta = await this.cajaHttp.postAnulacionDevolucion(
          operacion.getPayload(),
          operacion.getTraceId(),
        );
      } else {
        respuesta = { ok: false, error: `Tipo no soportado: ${tipo}` };
      }
      if (respuesta.ok) {
        await this.operacionCommand.marcarAplicada(
          operacion.getId(),
          respuesta.data,
        );
        const cuentaPagarId = respuesta.data?.cuenta_pagar_id;
        if (cuentaPagarId) {
          await this.operacionCommand.vincularCuentaPagar(
            operacion.getId(),
            cuentaPagarId,
          );
        }
        return;
      }

      const intentos = Number(operacion.getIntentos() ?? 0) + 1;
      if (intentos >= 5) {
        await this.operacionCommand.registrarFallo(
          operacion.getId(),
          respuesta.error,
          null,
        );
        await this.operacionCommand.marcarDescartada(
          operacion.getId(),
          respuesta.error,
        );
        return;
      }
      const segundos = Math.min(intentos ** 2 * 30, 3600);
      await this.operacionCommand.registrarFallo(
        operacion.getId(),
        respuesta.error,
        new Date(Date.now() + segundos * 1000),
      );
    } catch (error) {
      console.error(
        `Operación financiera de inventario ${operacion.getId()} no procesada:`,
        error.message,
      );
    }
  }
}
