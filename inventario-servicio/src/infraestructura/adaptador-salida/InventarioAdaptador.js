// inventario-servicio/src/infraestructura/adaptador-salida/InventarioAdaptador.js
import { Op } from 'sequelize';
import {
  CatalogoItem,
  DetalleIngreso,
  Ingreso,
  MovimientoStock,
  Producto,
  Proveedor,
} from '../modelos/Modelos.js';

const modelos = {
  proveedores: Proveedor,
  productos: Producto,
  catalogo: CatalogoItem,
  ingresos: Ingreso,
  'detalle-ingresos': DetalleIngreso,
  movimientos: MovimientoStock,
};

const camposBusqueda = {
  proveedores: ['nombre', 'ruc', 'codigo'],
  productos: ['nombre', 'codigo', 'modelo', 'color', 'grupo'],
  catalogo: ['nombre', 'categoria'],
};

export default class InventarioAdaptador {
  modelo(recurso) {
    return modelos[recurso];
  }

  async listar(
    recurso,
    {
      buscar = null,
      limit = 20,
      offset = 0,
      productoId = null,
      ingresoId = null,
    } = {},
  ) {
    const Modelo = this.modelo(recurso);
    if (!Modelo) return { estado: 'error', resultado: 'Recurso inválido' };
    const where = {};
    if (Modelo.rawAttributes.activo) where.activo = true;
    const campos = camposBusqueda[recurso] || [];
    if (buscar && campos.length) {
      where[Op.or] = campos.map((campo) => ({
        [campo]: { [Op.iLike]: `%${buscar}%` },
      }));
    }
    if (productoId) where.producto_id = productoId;
    if (ingresoId) where.ingreso_id = ingresoId;
    return {
      estado: 'ok',
      resultado: await Modelo.findAll({
        where,
        order: [['id', 'DESC']],
        limit: Math.min(Number(limit) || 20, 100),
        offset: Math.max(Number(offset) || 0, 0),
      }),
    };
  }

  async obtener(recurso, id) {
    const Modelo = this.modelo(recurso);
    if (!Modelo) return { estado: 'error', resultado: 'Recurso inválido' };
    const item = await Modelo.findByPk(id);
    return item
      ? { estado: 'ok', resultado: item }
      : { estado: 'error', resultado: 'No encontrado' };
  }

  async crear(recurso, datos) {
    const Modelo = this.modelo(recurso);
    if (!Modelo) return { estado: 'error', resultado: 'Recurso inválido' };
    try {
      const ahora = new Date();
      const item = await Modelo.create({
        ...datos,
        created_at: datos.created_at || ahora,
        updated_at: datos.updated_at || ahora,
      });
      return { estado: 'ok', resultado: item };
    } catch (error) {
      return { estado: 'error', resultado: error.message };
    }
  }

  async actualizar(recurso, id, datos) {
    const Modelo = this.modelo(recurso);
    if (!Modelo) return { estado: 'error', resultado: 'Recurso inválido' };
    try {
      const [cantidad] = await Modelo.update(
        { ...datos, updated_at: new Date() },
        { where: { id } },
      );
      return cantidad
        ? { estado: 'ok', resultado: 'Actualizado correctamente' }
        : { estado: 'error', resultado: 'No encontrado' };
    } catch (error) {
      return { estado: 'error', resultado: error.message };
    }
  }

  async eliminar(recurso, id) {
    const Modelo = this.modelo(recurso);
    if (!Modelo) return { estado: 'error', resultado: 'Recurso inválido' };
    if (Modelo.rawAttributes.activo) {
      const [cantidad] = await Modelo.update(
        { activo: false, updated_at: new Date() },
        { where: { id } },
      );
      return cantidad
        ? { estado: 'ok', resultado: 'Desactivado correctamente' }
        : { estado: 'error', resultado: 'No encontrado' };
    }
    const cantidad = await Modelo.destroy({ where: { id } });
    return cantidad
      ? { estado: 'ok', resultado: 'Eliminado correctamente' }
      : { estado: 'error', resultado: 'No encontrado' };
  }
}
