// caja-servicio/src/infraestructura/adaptador-salida/MovimientoChicaPgsQueryAdaptador.js
import { Op } from 'sequelize';
import MovimientoSalidaQueryPuerto from '../../aplicacion/puertos/salida/MovimientoSalidaQueryPuerto.js';
import MovimientoFinanciero from '../../dominio/entidades/MovimientoFinanciero.js';
import ModeloMovimientoChica from '../modelos/ModeloMovimientoChica.js';

const mapearEntidad = (modelo) => (
  modelo ? new MovimientoFinanciero(modelo.get({ plain: true })) : null
);

const construirWhere = (cajaId, filtro) => {
  const where = { caja_chica_id: cajaId };
  if (filtro.getTipo()) where.tipo = filtro.getTipo();
  if (filtro.getCategoria()) where.categoria = filtro.getCategoria();
  if (filtro.getOrigen()) where.origen = filtro.getOrigen();
  if (filtro.getReferenciaId()) where.referencia_id = filtro.getReferenciaId();
  if (filtro.getReferenciaTipo()) where.referencia_tipo = filtro.getReferenciaTipo();
  if (filtro.getOperacionId()) where.operacion_id = filtro.getOperacionId();
  if (filtro.getAfectaFlujoOperativo() !== null) {
    where.afecta_flujo_operativo = filtro.getAfectaFlujoOperativo();
  }
  if (filtro.getFechaDesde() || filtro.getFechaHasta()) {
    where.fecha_operacion = {
      ...(filtro.getFechaDesde() ? { [Op.gte]: filtro.getFechaDesde() } : {}),
      ...(filtro.getFechaHasta() ? { [Op.lte]: filtro.getFechaHasta() } : {}),
    };
  }
  return where;
};

export default class MovimientoChicaPgsQueryAdaptador extends MovimientoSalidaQueryPuerto {
  async findByCaja(cajaId, filtro) {
    const page = Math.max(Number(filtro.getPage()) || 0, 0);
    const limit = Math.min(Math.max(Number(filtro.getLimit()) || 50, 1), 200);
    const resultado = await ModeloMovimientoChica.findAndCountAll({
      where: construirWhere(cajaId, filtro),
      order: [['fecha_operacion', 'DESC'], ['id', 'DESC']],
      limit,
      offset: page * limit,
    });

    return {
      rows: resultado.rows.map(mapearEntidad),
      count: resultado.count,
      page,
      limit,
    };
  }

  async findByIdempotencyKey(key) {
    return mapearEntidad(
      await ModeloMovimientoChica.findOne({
        where: { idempotency_key: key },
      }),
    );
  }

  async findById(id) {
    return mapearEntidad(await ModeloMovimientoChica.findByPk(id));
  }

  async findByOperacionId(operacionId) {
    const movimientos = await ModeloMovimientoChica.findAll({
      where: { operacion_id: operacionId },
      order: [['id', 'ASC']],
    });
    return movimientos.map(mapearEntidad);
  }
}
