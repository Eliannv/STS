import ReportesSalidaPuerto from '../../aplicacion/puertos/salida/ReportesSalidaPuerto.js';

const servicios = {
  inventario: process.env.INVENTARIO_SERVICIO_URL,
  facturacion: process.env.FACTURACION_SERVICIO_URL,
  caja: process.env.CAJA_SERVICIO_URL,
  usuario: process.env.USUARIO_SERVICIO_URL,
  cliente: process.env.CLIENTE_SERVICIO_URL,
};

const lista = (respuesta) => Array.isArray(respuesta?.resultado) ? respuesta.resultado : [];

export default class MicroserviciosHttpAdaptador extends ReportesSalidaPuerto {
  constructor(configuracion = servicios) { super(); this.servicios = configuracion; }

  url(servicio, ruta, query = {}) {
    const base = this.servicios[servicio];
    if (!base) throw new Error(`Servicio ${servicio} no configurado`);
    const parametros = new URLSearchParams();
    Object.entries(query).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== '') parametros.set(clave, String(valor));
    });
    const path = `/api/v1/${ruta.replace(/^\//, '')}`;
    return `${base.replace(/\/$/, '')}${path}${parametros.toString() ? `?${parametros}` : ''}`;
  }

  async leer(servicio, ruta, query = {}, contexto = {}) {
    const headers = { Accept: 'application/json', 'X-Trace-Id': contexto.traceId || '' };
    if (contexto.authorization) headers.Authorization = contexto.authorization;
    const response = await fetch(this.url(servicio, ruta, query), { headers, signal: AbortSignal.timeout(15000) });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(data?.mensaje || data?.resultado || `Error HTTP ${response.status} en ${servicio}`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  async listarTodos(servicio, ruta, query = {}, contexto = {}) {
    const limite = 100;
    const registros = [];
    let offset = 0;
    while (true) {
      const data = await this.leer(servicio, ruta, { ...query, limit: limite, offset }, contexto);
      const pagina = lista(data);
      registros.push(...pagina);
      if (pagina.length < limite) return registros;
      offset += limite;
    }
  }

  async salud() {
    const resultado = {};
    await Promise.all(Object.entries(this.servicios).map(async ([nombre, base]) => {
      try {
        const response = await fetch(`${base.replace(/\/$/, '')}/health`, { signal: AbortSignal.timeout(3000) });
        resultado[nombre] = response.ok ? 'ok' : 'error';
      } catch { resultado[nombre] = 'error'; }
    }));
    return resultado;
  }
}
