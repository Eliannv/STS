import UsuarioSalidaQueryPuerto from '../../aplicacion/puertos/salida/UsuarioSalidaQueryPuerto.js';
import { Op } from 'sequelize';
import ModeloUsuario from '../modelos/ModeloUsuario.js';

export default class UsuarioPgsQueryAdaptador extends UsuarioSalidaQueryPuerto {
  async lista(buscar, { limit = 20, offset = 0, incluirInactivos = false } = {}) {
    const where = incluirInactivos ? {} : { activo: true };
    if (buscar) {
      where[Op.or] = [
        { nombre: { [Op.iLike]: `%${buscar}%` } },
        { apellido: { [Op.iLike]: `%${buscar}%` } },
        { email: { [Op.iLike]: `%${buscar}%` } }
      ];
    }
    const usuarios = await ModeloUsuario.findAll({
      where,
      attributes: { exclude: ['password_hash'] },
      order: [['nombre', 'ASC'], ['apellido', 'ASC']],
      limit,
      offset
    });
    return { estado: 'ok', resultado: usuarios };
  }

  async buscarPorId(id) {
    const usuario = await ModeloUsuario.findOne({
      where: { id, activo: true },
      attributes: { exclude: ['password_hash'] }
    });
    return usuario
      ? { estado: 'ok', resultado: usuario }
      : { estado: 'error', resultado: null };
  }
}
