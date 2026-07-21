import Factura from '../../../dominio/entidades/Factura.js';

export default class FacturaCommandUsesCase {
  constructor(adaptador, query, inventarioStock) {
    this.adaptador = adaptador;
    this.query = query;
    this.inventarioStock = inventarioStock;
  }

  async crear(datos) {
    if (datos.total == null) return Promise.resolve({ estado: 'error', resultado: 'total es requerido' });
    if (!datos.clienteId && !datos.nombreCliente) return Promise.resolve({ estado: 'error', resultado: 'Se requiere cliente o nombre de cliente' });
    const venta = new Factura(null, datos);
    const guardado = await this.adaptador.guardar(venta);
    if (guardado.estado !== 'ok') return guardado;

    const factura = guardado.resultado;
    const inventario = await this.inventarioStock.aplicarVenta({ factura, items: venta.items, contexto: venta });
    if (inventario.estado !== 'ok') {
      await this.adaptador.actualizarEstadoInventario(factura.id, 'ERROR');
      return { estado: 'error', resultado: `La factura ${factura.id_personalizado || factura.id} fue creada, pero inventario no pudo confirmarla: ${inventario.resultado}`, facturaId: factura.id };
    }

    const estadoInventario = inventario.noAplica ? 'NO_APLICA' : 'APLICADO';
    await this.adaptador.actualizarEstadoInventario(factura.id, estadoInventario);
    factura.setDataValue?.('estado_inventario', estadoInventario);
    return { estado: 'ok', resultado: factura };
  }

  editar(datos) {
    if (!datos.id) return Promise.resolve({ estado: 'error', resultado: 'id es requerido' });
    if (!datos.clienteId) return Promise.resolve({ estado: 'error', resultado: 'clienteId es requerido' });
    return this.adaptador.actualizar(new Factura(datos.id, datos));
  }

  cobrar(id) { return id ? this.adaptador.cobrar(id) : Promise.resolve({ estado: 'error', resultado: 'id es requerido' }); }
  async anular(id, contexto = {}) {
    if (!id) return { estado: 'error', resultado: 'id es requerido' };
    const consulta = await this.query.buscarPorId(id);
    if (consulta.estado !== 'ok') return consulta;
    const factura = consulta.resultado;
    if (factura.estado_pago === 'ANULADA') return { estado: 'error', resultado: 'Factura no encontrada o ya estaba anulada' };

    if (factura.estado_inventario !== 'NO_APLICA') {
      await this.adaptador.actualizarEstadoInventario(id, 'REVERSA_PENDIENTE');
      const reversa = await this.inventarioStock.revertirVenta({ factura, contexto });
      if (reversa.estado !== 'ok') {
        await this.adaptador.actualizarEstadoInventario(id, 'ERROR_REVERSA');
        return { estado: 'error', resultado: `No se anuló la factura porque inventario no pudo devolver el stock: ${reversa.resultado}` };
      }
    }

    return this.adaptador.anular(id, factura.estado_inventario === 'NO_APLICA' ? 'NO_APLICA' : 'REVERSADO');
  }

  eliminar(id, contexto = {}) { return this.anular(id, { ...contexto, motivo: contexto.motivo || 'Eliminación lógica de factura' }); }
}
