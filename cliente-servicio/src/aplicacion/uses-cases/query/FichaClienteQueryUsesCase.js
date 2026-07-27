import FichaCliente from '../../../dominio/entidades/FichaCliente.js';

// Agrega la Ficha del Cliente. Cliente e historial clínico se leen por los puertos
// locales (viven en esta misma base); el resto se pide a los servicios dueños de
// cada dato mediante el puerto de salida. Todas las consultas son independientes
// entre sí, así que se lanzan en paralelo.
export default class FichaClienteQueryUsesCase {
  constructor(clienteQuery, historialQuery, serviciosSalida) {
    this.clienteQuery = clienteQuery;
    this.historialQuery = historialQuery;
    this.servicios = serviciosSalida;
  }

  async obtener(clienteId, contexto = {}) {
    if (!clienteId) return { estado: 'error', resultado: 'El ID del cliente es requerido' };

    // El cliente se resuelve primero: sin él la ficha no existe y evita disparar
    // seis consultas contra los demás servicios para nada.
    const respuestaCliente = await this.clienteQuery.buscarPorId(clienteId);
    if (respuestaCliente.estado !== 'ok' || !respuestaCliente.resultado) {
      return { estado: 'error', resultado: 'Cliente no encontrado' };
    }

    const [
      historiales,
      facturas,
      resumenSucursal,
      resumenEmpresa,
      cuentas,
      pagos,
      tarjetas,
      sucursales,
      usuarios,
    ] = await Promise.all([
      this.historialQuery.listaPorCliente(clienteId),
      this.servicios.facturasDelCliente(clienteId, contexto),
      this.servicios.resumenFinanciero(clienteId, contexto, 'sucursal'),
      this.servicios.resumenFinanciero(clienteId, contexto, 'empresa'),
      this.servicios.cuentasPorCobrar(clienteId, contexto),
      this.servicios.pagosRealizados(clienteId, contexto),
      this.servicios.ventasConTarjeta(clienteId, contexto),
      this.servicios.catalogoSucursales(contexto),
      this.servicios.catalogoUsuarios(contexto),
    ]);

    const ficha = new FichaCliente({
      cliente: this.planos(respuestaCliente.resultado),
      historiales: this.planos(historiales?.resultado ?? historiales) ?? [],
      facturas,
      resumenSucursal,
      resumenEmpresa,
      cuentas,
      pagos,
      tarjetas,
      sucursales,
      usuarios,
      scope: contexto.scope ?? {},
    });

    return { estado: 'ok', resultado: ficha.toJSON() };
  }

  // Los adaptadores locales devuelven instancias de Sequelize; el dominio trabaja
  // con objetos planos.
  planos(valor) {
    if (Array.isArray(valor)) return valor.map((item) => this.planos(item));
    return typeof valor?.toJSON === 'function' ? valor.toJSON() : valor;
  }
}
