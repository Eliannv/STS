// cliente-servicio/src/infraestructura/adaptador-salida/FichaClienteHttpAdaptador.js
import FichaClienteSalidaPuerto from '../../aplicacion/puertos/salida/FichaClienteSalidaPuerto.js';

const lista = (respuesta) => {
  const datos = respuesta?.resultado ?? respuesta?.data ?? respuesta;
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.rows)) return datos.rows;
  if (Array.isArray(datos?.items)) return datos.items;
  return [];
};

export default class FichaClienteHttpAdaptador extends FichaClienteSalidaPuerto {
  constructor(urls = {}) {
    super();
    this.urls = {
      facturacion: urls.facturacion ?? process.env.FACTURACION_SERVICIO_URL,
      caja: urls.caja ?? process.env.CAJA_SERVICIO_URL,
      usuario: urls.usuario ?? process.env.USUARIO_SERVICIO_URL,
    };
  }

  // Reenvía el token del usuario y la sucursal en curso: cada servicio aplica su
  // propio scope, de modo que la ficha hereda exactamente los permisos que tendría
  // el empleado consultando ese módulo directamente.
  async leer(servicio, ruta, query = {}, contexto = {}) {
    const base = this.urls[servicio];
    if (!base) return null;

    const url = new URL(`${base.replace(/\/$/, '')}${ruta}`);
    Object.entries(query)
      .filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
      .forEach(([clave, valor]) => url.searchParams.set(clave, valor));

    const headers = { Accept: 'application/json', 'X-Trace-Id': contexto.traceId || '' };
    if (contexto.authorization) headers.Authorization = contexto.authorization;
    if (contexto.sucursalId) headers['X-Sucursal-Id'] = String(contexto.sucursalId);

    try {
      const respuesta = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
      // Un bloque que falla no puede tumbar la ficha entera: se devuelve vacío y
      // el resto de la información sigue siendo útil para atender al cliente.
      if (!respuesta.ok) return null;
      return await respuesta.json();
    } catch {
      return null;
    }
  }

  async facturasDelCliente(clienteId, contexto) {
    return lista(await this.leer('facturacion', `/api/v1/facturas/cliente/${clienteId}`, {}, contexto));
  }

  async resumenFinanciero(clienteId, contexto, alcance = 'sucursal') {
    const respuesta = await this.leer(
      'facturacion',
      `/api/v1/facturas/resumen/${clienteId}`,
      alcance === 'empresa' ? { alcance: 'empresa' } : {},
      contexto,
    );
    return respuesta?.resultado ?? null;
  }

  async cuentasPorCobrar(clienteId, contexto) {
    return lista(await this.leer('caja', '/api/v1/cuentas', { tipo: 'COBRAR', terceroId: clienteId, limit: 200 }, contexto));
  }

  async pagosRealizados(clienteId, contexto) {
    return lista(await this.leer('facturacion', '/api/v1/deudas', { clienteId, limit: 200 }, contexto));
  }

  async ventasConTarjeta(clienteId, contexto) {
    return lista(await this.leer('facturacion', '/api/v1/ventas-tarjeta/listar', { clienteId, limit: 200 }, contexto));
  }

  async catalogoSucursales(contexto) {
    return lista(await this.leer('usuario', '/api/v1/sucursales', {}, contexto));
  }

  // Catálogo mínimo (id + nombre) para rotular quién emitió cada documento.
  // Evita que el frontend tenga que consultar usuarios por su cuenta.
  async catalogoUsuarios(contexto) {
    return lista(await this.leer('usuario', '/api/v1/usuarios/catalogo', {}, contexto));
  }
}
