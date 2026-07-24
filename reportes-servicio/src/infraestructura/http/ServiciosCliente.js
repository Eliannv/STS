// reportes-servicio/src/infraestructura/http/ServiciosCliente.js
const normalizarBaseUrl = (url) => String(url ?? '').replace(/\/+$/, '');

export default class ServiciosCliente {
  constructor(httpCliente, urls = {}) {
    this.http = httpCliente;
    this.urls = {
      facturacion: normalizarBaseUrl(
        urls.facturacion ?? process.env.FACTURACION_SERVICIO_URL,
      ),
      caja: normalizarBaseUrl(
        urls.caja ?? process.env.CAJA_SERVICIO_URL,
      ),
      inventario: normalizarBaseUrl(
        urls.inventario ?? process.env.INVENTARIO_SERVICIO_URL,
      ),
      usuario: normalizarBaseUrl(
        urls.usuario ?? process.env.USUARIO_SERVICIO_URL,
      ),
      cliente: normalizarBaseUrl(
        urls.cliente ?? process.env.CLIENTE_SERVICIO_URL,
      ),
    };
  }

  getFacturas(filtros = {}, traceId = null) {
    return this._get(
      'facturacion',
      '/api/v1/facturacion/reportes/ventas',
      filtros,
      traceId,
    );
  }

  getCobrosPeriodo(filtros = {}, traceId = null) {
    return this._get(
      'facturacion',
      '/api/v1/facturacion/reportes/cobros',
      filtros,
      traceId,
    );
  }

  getTarjetas(filtros = {}, traceId = null) {
    return this._get(
      'facturacion',
      '/api/v1/facturacion/reportes/tarjetas',
      filtros,
      traceId,
    );
  }

  getFacturasHoy(traceId = null) {
    return this._get(
      'facturacion',
      '/api/v1/facturacion/reportes/ventas-hoy',
      {},
      traceId,
    );
  }

  getComprobacionDashboard(traceId = null) {
    return this._get(
      'facturacion',
      '/api/v1/facturacion/reportes/dashboard-snapshot',
      {},
      traceId,
    );
  }

  getMovimientosCaja(filtros = {}, traceId = null) {
    return this._get(
      'caja',
      '/api/v1/caja/reportes/movimientos',
      filtros,
      traceId,
    );
  }

  getCuentasCobrar(filtros = {}, traceId = null) {
    return this._get(
      'caja',
      '/api/v1/caja/reportes/cuentas-cobrar',
      filtros,
      traceId,
    );
  }

  getCuentasPagar(filtros = {}, traceId = null) {
    return this._get(
      'caja',
      '/api/v1/caja/reportes/cuentas-pagar',
      filtros,
      traceId,
    );
  }

  getSaldoCajas(traceId = null) {
    return this._get(
      'caja',
      '/api/v1/caja/reportes/saldo-actual',
      {},
      traceId,
    );
  }

  getFlujoCaja(filtros = {}, traceId = null) {
    return this._get(
      'caja',
      '/api/v1/caja/reportes/flujo',
      filtros,
      traceId,
    );
  }

  getMovimientosStock(filtros = {}, traceId = null) {
    return this._get(
      'inventario',
      '/api/v1/inventario/reportes/kardex',
      filtros,
      traceId,
    );
  }

  getCompras(filtros = {}, traceId = null) {
    return this._get(
      'inventario',
      '/api/v1/inventario/reportes/compras',
      filtros,
      traceId,
    );
  }

  getAlertasStock(traceId = null) {
    return this._get(
      'inventario',
      '/api/v1/inventario/reportes/alertas-stock',
      {},
      traceId,
    );
  }

  getValorInventario(traceId = null) {
    return this._get(
      'inventario',
      '/api/v1/inventario/reportes/valor',
      {},
      traceId,
    );
  }

  _get(servicio, ruta, params, traceId) {
    const baseUrl = this.urls[servicio];
    if (!baseUrl) {
      return Promise.resolve({
        ok: false,
        error: `URL de ${servicio}-servicio no configurada`,
        status: 0,
      });
    }

    const headers = traceId ? { 'X-Trace-Id': traceId } : {};
    return this.http.get(`${baseUrl}${ruta}`, params, headers);
  }
}
