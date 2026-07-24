// caja-servicio/src/infraestructura/adaptador-salida/CuentaPgsQueryAdaptador.js
import { Op } from 'sequelize';
import CuentaSalidaQueryPuerto from '../../aplicacion/puertos/salida/CuentaSalidaQueryPuerto.js';
import Cuenta from '../../dominio/entidades/Cuenta.js';
import MovimientoCuenta from '../../dominio/entidades/MovimientoCuenta.js';
import ModeloCuenta from '../modelos/ModeloCuenta.js';
import ModeloMovimientoCuenta from '../modelos/ModeloMovimientoCuenta.js';

const mapearCuenta = (modelo) => (
  modelo ? new Cuenta(modelo.get({ plain: true })) : null
);

const mapearMovimiento = (modelo) => (
  modelo ? new MovimientoCuenta(modelo.get({ plain: true })) : null
);

export default class CuentaPgsQueryAdaptador extends CuentaSalidaQueryPuerto {
  async findById(id) {
    return mapearCuenta(await ModeloCuenta.findByPk(id));
  }

  async findAll(filtro = {}) {
    const get = (metodo, campo) => (
      typeof filtro?.[metodo] === 'function' ? filtro[metodo]() : filtro[campo]
    );
    const where = {};
    const tipo = get('getTipo', 'tipo');
    const estado = get('getEstado', 'estado');
    const terceroId = get('getTerceroId', 'terceroId') ?? filtro.tercero_id;
    const terceroTipo = get('getTerceroTipo', 'terceroTipo') ?? filtro.tercero_tipo;
    const sucursalId = get('getSucursalId', 'sucursalId') ?? filtro.sucursal_id;
    const fechaDesde = get('getFechaDesde', 'fechaDesde') ?? filtro.fecha_desde;
    const fechaHasta = get('getFechaHasta', 'fechaHasta') ?? filtro.fecha_hasta;
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (terceroId) where.tercero_id = terceroId;
    if (terceroTipo) where.tercero_tipo = terceroTipo;
    if (sucursalId) where.sucursal_id = sucursalId;
    if (fechaDesde || fechaHasta) {
      where.fecha_emision = {
        ...(fechaDesde ? { [Op.gte]: fechaDesde } : {}),
        ...(fechaHasta ? { [Op.lte]: fechaHasta } : {}),
      };
    }

    const page = Math.max(Number(get('getPage', 'page')) || 0, 0);
    const limit = Math.min(Math.max(Number(get('getLimit', 'limit')) || 50, 1), 200);
    const resultado = await ModeloCuenta.findAndCountAll({
      where,
      order: [['fecha_emision', 'DESC'], ['id', 'DESC']],
      limit,
      offset: page * limit,
    });
    return {
      rows: resultado.rows.map(mapearCuenta),
      count: resultado.count,
      page,
      limit,
    };
  }

  async findByOperacionId(operacionId) {
    return mapearCuenta(
      await ModeloCuenta.findOne({ where: { operacion_id: operacionId } }),
    );
  }

  async findByIdempotencyKey(key) {
    return mapearCuenta(
      await ModeloCuenta.findOne({ where: { idempotency_key: key } }),
    );
  }

  async findMovimientoByIdempotencyKey(key) {
    return mapearMovimiento(
      await ModeloMovimientoCuenta.findOne({
        where: { idempotency_key: key },
      }),
    );
  }

  async findMovimientosByCuentaId(cuentaId) {
    const modelos = await ModeloMovimientoCuenta.findAll({
      where: { cuenta_id: cuentaId },
      order: [['created_at', 'ASC'], ['id', 'ASC']],
    });
    return modelos.map(mapearMovimiento);
  }

  async lista(filtros = {}) {
    const resultado = await this.findAll({
      ...filtros,
      page: Math.floor(
        Math.max(Number(filtros.offset) || 0, 0)
        / Math.max(Number(filtros.limit) || 20, 1),
      ),
      limit: filtros.limit ?? 20,
    });
    return { estado: 'ok', resultado: resultado.rows };
  }

  async buscarPorId(id) {
    const cuenta = await this.findById(id);
    return cuenta
      ? { estado: 'ok', resultado: cuenta }
      : { estado: 'error', resultado: 'Cuenta no encontrada' };
  }
}
