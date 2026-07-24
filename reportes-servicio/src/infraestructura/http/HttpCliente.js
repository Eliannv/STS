// reportes-servicio/src/infraestructura/http/HttpCliente.js
const obtenerMensajeError = (data, status) => (
  data?.error?.message
  ?? data?.error
  ?? data?.mensaje
  ?? data?.message
  ?? `Solicitud HTTP fallida con estado ${status}`
);

const construirUrl = (url, params = {}) => {
  const destino = new URL(url);
  Object.entries(params).forEach(([clave, valor]) => {
    if (valor === null || valor === undefined || valor === '') return;

    if (Array.isArray(valor)) {
      valor.forEach((item) => destino.searchParams.append(clave, item));
      return;
    }

    destino.searchParams.set(clave, valor);
  });
  return destino.toString();
};

export default class HttpCliente {
  constructor(timeoutMs = 8000) {
    this.timeoutMs = timeoutMs;
  }

  async get(url, params = {}, headers = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(construirUrl(url, params), {
        method: 'GET',
        headers: { ...headers },
        signal: controller.signal,
      });
      const contentType = response.headers.get('content-type') ?? '';
      const data = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : await response.text().catch(() => null);

      if (!response.ok) {
        return {
          ok: false,
          error: obtenerMensajeError(data, response.status),
          status: response.status,
        };
      }

      return { ok: true, data, status: response.status };
    } catch (error) {
      return {
        ok: false,
        error: error.name === 'AbortError'
          ? `Tiempo de espera agotado después de ${this.timeoutMs}ms`
          : `Error de red: ${error.message}`,
        status: 0,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
