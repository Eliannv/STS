import { Op } from 'sequelize';
import { Factura, DetalleFactura, Deuda, VentaTarjeta, AbonoTarjeta } from '../modelos/Modelos.js';
const modelos = { facturas: Factura, 'detalle-facturas': DetalleFactura, deudas: Deuda, 'ventas-tarjeta': VentaTarjeta, 'abonos-tarjeta': AbonoTarjeta };
export default class FacturacionAdaptador {
  modelo(recurso) { return modelos[recurso]; }
  async listar(recurso, { buscar = null, clienteId = null, facturaId = null, ventaTarjetaId = null, estado = null, limit = 20, offset = 0 } = {}) {
    const Model = this.modelo(recurso); if (!Model) return { estado: 'error', resultado: 'Recurso inválido' };
    const where = {}; if (clienteId && Model.rawAttributes.cliente_id) where.cliente_id = clienteId; if (facturaId && Model.rawAttributes.factura_id) where.factura_id = facturaId; if (ventaTarjetaId && Model.rawAttributes.venta_tarjeta_id) where.venta_tarjeta_id = ventaTarjetaId; if (estado && Model.rawAttributes.estado) where.estado = estado; if (buscar && Model.rawAttributes.cliente_nombre) where.cliente_nombre = { [Op.iLike]: `%${buscar}%` };
    return { estado: 'ok', resultado: await Model.findAll({ where, order: [['id', 'DESC']], limit: Math.min(Number(limit) || 20, 100), offset: Math.max(Number(offset) || 0, 0) }) };
  }
  async obtener(recurso, id) { const Model = this.modelo(recurso); if (!Model) return { estado: 'error', resultado: 'Recurso inválido' }; const item = await Model.findByPk(id); return item ? { estado: 'ok', resultado: item } : { estado: 'error', resultado: 'No encontrado' }; }
  async crear(recurso, datos) { const Model = this.modelo(recurso); if (!Model) return { estado: 'error', resultado: 'Recurso inválido' }; try { const ahora = new Date(); return { estado: 'ok', resultado: await Model.create({ ...datos, created_at: datos.created_at || ahora, updated_at: datos.updated_at || ahora }) }; } catch (error) { return { estado: 'error', resultado: error.message }; } }
  async actualizar(recurso, id, datos) { const Model = this.modelo(recurso); if (!Model) return { estado: 'error', resultado: 'Recurso inválido' }; try { const [count] = await Model.update({ ...datos, updated_at: new Date() }, { where: { id } }); return count ? { estado: 'ok', resultado: 'Actualizado correctamente' } : { estado: 'error', resultado: 'No encontrado' }; } catch (error) { return { estado: 'error', resultado: error.message }; } }
  async eliminar(recurso, id) { const Model = this.modelo(recurso); if (!Model) return { estado: 'error', resultado: 'Recurso inválido' }; if (recurso === 'facturas') { const [count] = await Model.update({ deleted_at: new Date(), estado_pago: 'ANULADA', updated_at: new Date() }, { where: { id } }); return count ? { estado: 'ok', resultado: 'Factura anulada correctamente' } : { estado: 'error', resultado: 'No encontrado' }; } const count = await Model.destroy({ where: { id } }); return count ? { estado: 'ok', resultado: 'Eliminado correctamente' } : { estado: 'error', resultado: 'No encontrado' }; }
}
