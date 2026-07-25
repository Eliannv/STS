import { Op, QueryTypes } from 'sequelize';
import ProductoSalidaQueryPuerto from '../../aplicacion/puertos/salida/ProductoSalidaQueryPuerto.js';
import { Producto as ProductoModel, Proveedor } from '../modelos/Modelos.js';
import sequelize from '../base-dato/Postgresql.js';

// Con sucursal seleccionada, stock y costo mostrados son los de esa sucursal;
// sin ella se conserva el consolidado que ya trae productos.stock.
const conStockDeSucursal = async (productos, sucursalId) => {
  if (!sucursalId || productos.length === 0) return productos;
  const existencias = await sequelize.query(
    `SELECT producto_id, stock, costo_promedio, stock_minimo
     FROM existencias WHERE sucursal_id = :sucursalId AND producto_id IN (:ids)`,
    { replacements: { sucursalId, ids: productos.map((producto) => producto.id) }, type: QueryTypes.SELECT },
  );
  const porProducto = new Map(existencias.map((fila) => [Number(fila.producto_id), fila]));
  return productos.map((producto) => {
    const existencia = porProducto.get(Number(producto.id));
    return {
      ...producto,
      stock: existencia ? Number(existencia.stock) : 0,
      costo: existencia ? Number(existencia.costo_promedio) : producto.costo,
      stock_minimo: existencia ? Number(existencia.stock_minimo) : 0,
      stock_total: producto.stock,
      sucursal_id: Number(sucursalId),
    };
  });
};

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
      where[Op.or] = ['nombre', 'codigo', 'modelo', 'color', 'grupo'].map((campo) => ({
        [campo]: { [Op.iLike]: `%${buscar}%` }
      }));
    }
    const productos = await ProductoModel.findAll({
      where,
      order: [['id', 'DESC']],
      limit: Math.min(Number(limit) || 20, 5000),
      offset: Math.max(Number(offset) || 0, 0)
    });
    return { estado: 'ok', resultado: await conStockDeSucursal(await conProveedor(productos), sucursalId) };
  }

  async buscarPorId(id, sucursalId = null) {
    const resultado = await ProductoModel.findOne({ where: { id, activo: true } });
    if (!resultado) return { estado: 'error', resultado: null };
    const [conStock] = await conStockDeSucursal([resultado.toJSON()], sucursalId);
    return { estado: 'ok', resultado: conStock };
  }

  // Distribución del stock de un producto entre sucursales: base de la vista
  // consolidada y de la validación previa a una transferencia.
  async existenciasPorProducto(id) {
    const resultado = await sequelize.query(
      `SELECT sucursal_id, stock, costo_promedio, stock_minimo
       FROM existencias WHERE producto_id = :id ORDER BY sucursal_id`,
      { replacements: { id }, type: QueryTypes.SELECT },
    );
    return { estado: 'ok', resultado };
  }

  async buscarPorCodigoBarras(codigo) {
    const resultados = await sequelize.query(
      'SELECT * FROM productos WHERE codigo_barras = $1 AND activo = TRUE LIMIT 1',
      { bind: [codigo], type: QueryTypes.SELECT }
    );
    const resultado = resultados[0] || null;
    return resultado ? { estado: 'ok', resultado } : { estado: 'error', resultado: null };
  }

  async siguienteCodigoBarras() {
    const [resultado] = await sequelize.query(
      'SELECT gen_codigo_barras_producto() AS codigo_barras',
      { type: QueryTypes.SELECT }
    );
    return { estado: 'ok', resultado };
  }

  async buscarPorModeloColorGrupo(modelo, color, grupo) {
    const where = { modelo, grupo, activo: true };
    if (color) where.color = color;
    const resultado = await ProductoModel.findOne({ where });
    return resultado ? { estado: 'ok', resultado } : { estado: 'error', resultado: null };
  }
}
