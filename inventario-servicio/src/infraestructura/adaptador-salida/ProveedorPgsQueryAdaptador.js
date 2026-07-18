import { Op } from 'sequelize';
import ProveedorSalidaQueryPuerto from '../../aplicacion/puertos/salida/ProveedorSalidaQueryPuerto.js';
import { Proveedor as ProveedorModel } from '../modelos/Modelos.js';

export default class ProveedorPgsQueryAdaptador extends ProveedorSalidaQueryPuerto {
  async lista(buscar, { limit = 20, offset = 0 } = {}) {
    const where = { activo: true };
    if (buscar) where[Op.or] = ['nombre', 'ruc', 'codigo'].map((campo) => ({ [campo]: { [Op.iLike]: `%${buscar}%` } }));
    const resultado = await ProveedorModel.findAll({ where, order: [['nombre', 'ASC']], limit: Math.min(Number(limit) || 20, 100), offset: Math.max(Number(offset) || 0, 0) });
    return { estado: 'ok', resultado };
  }

  async buscarPorId(id) {
    const resultado = await ProveedorModel.findOne({ where: { id, activo: true } });
    return resultado ? { estado: 'ok', resultado } : { estado: 'error', resultado: null };
  }
}
