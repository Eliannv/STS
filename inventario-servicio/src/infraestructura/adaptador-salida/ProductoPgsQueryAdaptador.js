import { Op } from 'sequelize';
import ProductoSalidaQueryPuerto from '../../aplicacion/puertos/salida/ProductoSalidaQueryPuerto.js';
import { Producto as ProductoModel, Proveedor } from '../modelos/Modelos.js';

const conProveedor = async (productos) => {
  const ids = [...new Set(productos.map((producto) => producto.proveedor_id).filter(Boolean))];
  const proveedores = ids.length
    ? await Proveedor.findAll({ where: { id: { [Op.in]: ids } }, attributes: ['id', 'nombre'], raw: true })
    : [];
  const nombres = new Map(proveedores.map((proveedor) => [Number(proveedor.id), proveedor.nombre]));
  return productos.map((producto) => {
    const datos = producto.toJSON();
    return { ...datos, proveedor_nombre: nombres.get(Number(datos.proveedor_id)) || null };
  });
};

export default class ProductoPgsQueryAdaptador extends ProductoSalidaQueryPuerto {
  async lista(buscar, sucursalId, { limit = 20, offset = 0, estado = 'activos' } = {}) {
    const where = {};
    if (estado === 'activos') where.activo = true;
    if (estado === 'inactivos') where.activo = false;
    if (buscar) {
      where[Op.or] = ['nombre', 'codigo', 'modelo', 'color', 'grupo'].map((campo) => ({ [campo]: { [Op.iLike]: `%${buscar}%` } }));
    }
    const productos = await ProductoModel.findAll({ where, order: [['id', 'DESC']], limit: Math.min(Number(limit) || 20, 5000), offset: Math.max(Number(offset) || 0, 0) });
    return { estado: 'ok', resultado: await conProveedor(productos) };
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
