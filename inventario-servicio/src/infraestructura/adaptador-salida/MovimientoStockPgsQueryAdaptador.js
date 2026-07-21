import { Op } from 'sequelize';
import MovimientoStockSalidaQueryPuerto from '../../aplicacion/puertos/salida/MovimientoStockSalidaQueryPuerto.js';
import { MovimientoStock, Producto } from '../modelos/Modelos.js';

export default class MovimientoStockPgsQueryAdaptador extends MovimientoStockSalidaQueryPuerto {
  async listar({ productoId, codigo, grupo, proveedorId, usuarioId, sucursalId, naturaleza, tipoMovimiento, origen, referenciaTipo, referenciaId, fechaDesde, fechaHasta, limit = 100, offset = 0 } = {}) {
    const where = {};
    if (productoId) where.producto_id = Number(productoId);
    if (codigo) where.producto_codigo = codigo;
    if (grupo) where.grupo_producto = grupo;
    if (proveedorId) {
      const productos = await Producto.findAll({ where: { proveedor_id: Number(proveedorId) }, attributes: ['id'], raw: true });
      where.producto_id = { [Op.in]: productos.map((producto) => producto.id) };
    }
    if (usuarioId) where.usuario_id = Number(usuarioId);
    if (sucursalId) where.sucursal_id = Number(sucursalId);
    if (naturaleza) where.naturaleza = naturaleza;
    if (tipoMovimiento) where.tipo_movimiento = tipoMovimiento;
    if (origen) where.origen = origen;
    if (referenciaTipo) where.referencia_tipo = referenciaTipo;
    if (referenciaId) where.referencia_id = Number(referenciaId);
    if (fechaDesde || fechaHasta) {
      where.fecha_operacion = {
        ...(fechaDesde ? { [Op.gte]: new Date(`${fechaDesde}T00:00:00`) } : {}),
        ...(fechaHasta ? { [Op.lte]: new Date(`${fechaHasta}T23:59:59.999`) } : {}),
      };
    }
    const resultado = await MovimientoStock.findAll({ where, order: [['fecha_operacion', 'DESC'], ['id', 'DESC']], limit: Math.min(Number(limit) || 100, 5000), offset: Math.max(Number(offset) || 0, 0) });
    return { estado: 'ok', resultado };
  }

  async buscarPorId(id) {
    const resultado = await MovimientoStock.findByPk(id);
    return resultado ? { estado: 'ok', resultado } : { estado: 'error', resultado: 'Movimiento no encontrado' };
  }
}
