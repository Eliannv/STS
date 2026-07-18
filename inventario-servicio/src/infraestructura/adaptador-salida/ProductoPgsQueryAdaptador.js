import { Op } from 'sequelize';
import ProductoSalidaQueryPuerto from '../../aplicacion/puertos/salida/ProductoSalidaQueryPuerto.js';
import { Producto as ProductoModel } from '../modelos/Modelos.js';

export default class ProductoPgsQueryAdaptador extends ProductoSalidaQueryPuerto {
  async lista(buscar, sucursalId, { limit = 20, offset = 0 } = {}) {
    const where = { activo: true };
    if (buscar) {
      where[Op.or] = ['nombre', 'codigo', 'modelo', 'color', 'grupo'].map((campo) => ({ [campo]: { [Op.iLike]: `%${buscar}%` } }));
    }
    const resultado = await ProductoModel.findAll({ where, order: [['id', 'DESC']], limit: Math.min(Number(limit) || 20, 100), offset: Math.max(Number(offset) || 0, 0) });
    return { estado: 'ok', resultado };
  }

  async buscarPorId(id) {
    const resultado = await ProductoModel.findOne({ where: { id, activo: true } });
    return resultado ? { estado: 'ok', resultado } : { estado: 'error', resultado: null };
  }

  async buscarPorModeloColorGrupo(modelo, color, grupo) {
    const where = { modelo, grupo, activo: true };
    if (color) where.color = color;
    const resultado = await ProductoModel.findOne({ where });
    return resultado ? { estado: 'ok', resultado } : { estado: 'error', resultado: null };
  }
}
