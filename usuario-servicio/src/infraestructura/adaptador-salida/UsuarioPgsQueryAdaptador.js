import UsuarioSalidaQueryPuerto from '../../aplicacion/puertos/salida/UsuarioSalidaQueryPuerto.js';
import { Op } from 'sequelize';
import ModeloUsuario from '../modelos/ModeloUsuario.js';
import ModeloSucursal from '../modelos/ModeloSucursal.js';

const conSucursal = async (usuarios) => {
  const ids = [...new Set(usuarios.map((usuario) => usuario.sucursal_id).filter(Boolean))];
  const sucursales = ids.length
    ? await ModeloSucursal.findAll({ where: { id: { [Op.in]: ids } }, attributes: ['id', 'nombre', 'codigo'], raw: true })
    : [];
  const porId = new Map(sucursales.map((sucursal) => [Number(sucursal.id), sucursal]));
  return usuarios.map((usuario) => {
    const datos = usuario.toJSON();
    const sucursal = porId.get(Number(datos.sucursal_id));
    return { ...datos, sucursal_nombre: sucursal?.nombre ?? null, sucursal_codigo: sucursal?.codigo ?? null };
  });
};

export default class UsuarioPgsQueryAdaptador extends UsuarioSalidaQueryPuerto {
  async lista(buscar, { limit = 20, offset = 0, incluirInactivos = false, sucursalId = null } = {}) {
    const where = incluirInactivos ? {} : { activo: true };
    if (sucursalId) where.sucursal_id = Number(sucursalId);
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
    return { estado: 'ok', resultado: await conSucursal(usuarios) };
  }

  async buscarPorId(id) {
    const usuario = await ModeloUsuario.findOne({
      where: { id, activo: true },
      attributes: { exclude: ['password_hash'] }
    });
    if (!usuario) return { estado: 'error', resultado: null };
    const [conNombre] = await conSucursal([usuario]);
    return { estado: 'ok', resultado: conNombre };
  }
}
