import { Op } from 'sequelize';
import { Proveedor, Producto, CatalogoItem, Ingreso, DetalleIngreso, Egreso, DetalleEgreso, MovimientoStock } from '../modelos/Modelos.js';

const modelos = { proveedores: Proveedor, productos: Producto, catalogo: CatalogoItem, ingresos: Ingreso, 'detalle-ingresos': DetalleIngreso, egresos: Egreso, 'detalle-egresos': DetalleEgreso, movimientos: MovimientoStock };
const camposBusqueda = { proveedores: ['nombre','ruc','codigo'], productos: ['nombre','codigo','modelo','color','grupo'], catalogo: ['nombre','categoria'] };

export default class InventarioAdaptador {
  modelo(recurso) { return modelos[recurso]; }
  async listar(recurso, { buscar = null, limit = 20, offset = 0, productoId = null, ingresoId = null, egresoId = null } = {}) {
    const Model = this.modelo(recurso); if (!Model) return { estado: 'error', resultado: 'Recurso inválido' };
    const where = {};
    if (Model.rawAttributes.activo) where.activo = true;
    const campos = camposBusqueda[recurso] || [];
    if (buscar && campos.length) where[Op.or] = campos.map((campo) => ({ [campo]: { [Op.iLike]: `%${buscar}%` } }));
    if (productoId) where.producto_id = productoId;
    if (ingresoId) where.ingreso_id = ingresoId;
    if (egresoId) where.egreso_id = egresoId;
    return { estado: 'ok', resultado: await Model.findAll({ where, order: [['id', 'DESC']], limit: Math.min(Number(limit) || 20, 100), offset: Math.max(Number(offset) || 0, 0) }) };
  }
  async obtener(recurso, id) { const Model = this.modelo(recurso); if (!Model) return { estado: 'error', resultado: 'Recurso inválido' }; const item = await Model.findByPk(id); return item ? { estado: 'ok', resultado: item } : { estado: 'error', resultado: 'No encontrado' }; }
  async crear(recurso, datos) { const Model = this.modelo(recurso); if (!Model) return { estado: 'error', resultado: 'Recurso inválido' }; try { const ahora = new Date(); const item = await Model.create({ ...datos, created_at: datos.created_at || ahora, updated_at: datos.updated_at || ahora }); return { estado: 'ok', resultado: item }; } catch (error) { return { estado: 'error', resultado: error.message }; } }
  async actualizar(recurso, id, datos) { const Model = this.modelo(recurso); if (!Model) return { estado: 'error', resultado: 'Recurso inválido' }; try { const [count] = await Model.update({ ...datos, updated_at: new Date() }, { where: { id } }); return count ? { estado: 'ok', resultado: 'Actualizado correctamente' } : { estado: 'error', resultado: 'No encontrado' }; } catch (error) { return { estado: 'error', resultado: error.message }; } }
  async eliminar(recurso, id) { const Model = this.modelo(recurso); if (!Model) return { estado: 'error', resultado: 'Recurso inválido' }; if (Model.rawAttributes.activo) { const [count] = await Model.update({ activo: false, updated_at: new Date() }, { where: { id } }); return count ? { estado: 'ok', resultado: 'Desactivado correctamente' } : { estado: 'error', resultado: 'No encontrado' }; } const count = await Model.destroy({ where: { id } }); return count ? { estado: 'ok', resultado: 'Eliminado correctamente' } : { estado: 'error', resultado: 'No encontrado' }; }
}
