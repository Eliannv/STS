// inventario-servicio/src/infraestructura/adaptador-salida/CajaHttpAdaptador.js
import CajaSalidaPuerto from '../../aplicacion/puertos/salida/CajaSalidaPuerto.js';

const limpiarPayload = (payload = {}) => {
  const { trace_id: traceIdIgnorado, traceId: traceIdBodyIgnorado, ...body } = payload;
  void traceIdIgnorado;
  void traceIdBodyIgnorado;
  return body;
};

export default class CajaHttpAdaptador extends CajaSalidaPuerto {
  constructor(baseUrl = process.env.CAJA_SERVICIO_URL) {
    super();
    this.baseUrl = baseUrl?.replace(/\/$/, '') ?? null;
  }

  postCompra(payload, traceId) {
    return this.post('/api/v1/operaciones/compras', payload, traceId);
  }

  postAnulacionCompra(payload, traceId) {
    return this.post('/api/v1/operaciones/anulaciones-compras', payload, traceId);
  }

  async post(path, payload, traceId) {
    if (!this.baseUrl) {
      return { ok: false, error: 'CAJA_SERVICIO_URL no está configurada' };
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Trace-Id': traceId ?? '',
        },
        body: JSON.stringify(limpiarPayload(payload)),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.ok !== true) {
        return {
          ok: false,
          error: data?.mensaje ?? `caja-servicio respondió HTTP ${response.status}`,
        };
      }
      return { ok: true, data: data.data };
    } catch (error) {
      return {
        ok: false,
        error: error.name === 'AbortError'
          ? 'Tiempo de espera agotado al llamar a caja-servicio'
          : `caja-servicio no disponible: ${error.message}`,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
