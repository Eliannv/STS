// inventario-servicio/src/infraestructura/adaptador-salida/EgresoMercaderiaPgsQueryAdaptador.js
import { Op } from 'sequelize';
import EgresoSalidaQueryPuerto from '../../aplicacion/puertos/salida/EgresoSalidaQueryPuerto.js';
import DetalleEgreso from '../../dominio/entidades/DetalleEgreso.js';
import EgresoMercaderia from '../../dominio/entidades/EgresoMercaderia.js';
import {
  DetalleIngreso,
  Ingreso,
  MovimientoStock,
} from '../modelos/Modelos.js';
import ModeloDetalleEgreso from '../modelos/ModeloDetalleEgreso.js';
import ModeloEgresoMercaderia from '../modelos/ModeloEgresoMercaderia.js';
import ModeloOperacionFinancieraInventario from '../modelos/ModeloOperacionFinancieraInventario.js';

const mapearEgreso = (modelo) => (
  modelo ? new EgresoMercaderia(modelo.get({ plain: true })) : null
);
const mapearDetalle = (modelo) => (
  modelo ? new DetalleEgreso(modelo.get({ plain: true })) : null
);

export default class EgresoMercaderiaPgsQueryAdaptador
  extends EgresoSalidaQueryPuerto {
  async findAll(filtro) {
    const where = {};
    if (filtro.getTipoEgreso()) where.tipo_egreso = filtro.getTipoEgreso();
    if (filtro.getEstado()) where.estado = filtro.getEstado();
    if (filtro.getEstadoFinanciero()) {
      where.estado_financiero = filtro.getEstadoFinanciero();
    }
    if (filtro.getProveedorId()) {
      where.proveedor_id = Number(filtro.getProveedorId());
    }
    if (filtro.getIngresoOrigenId()) {
      where.ingreso_origen_id = Number(filtro.getIngresoOrigenId());
    }
    if (filtro.getUsuarioId()) where.usuario_id = Number(filtro.getUsuarioId());
    if (filtro.getSucursalId()) {
      where.sucursal_id = Number(filtro.getSucursalId());
    }
    if (filtro.getFechaDesde() || filtro.getFechaHasta()) {
      where.fecha = {
        ...(filtro.getFechaDesde()
          ? { [Op.gte]: new Date(`${filtro.getFechaDesde()}T00:00:00`) }
          : {}),
        ...(filtro.getFechaHasta()
          ? { [Op.lte]: new Date(`${filtro.getFechaHasta()}T23:59:59.999`) }
          : {}),
      };
    }
    const resultado = await ModeloEgresoMercaderia.findAndCountAll({
      where,
      order: [['fecha', 'DESC'], ['id', 'DESC']],
      limit: filtro.getLimit(),
      offset: filtro.getPage() * filtro.getLimit(),
    });
    return {
      count: resultado.count,
      rows: resultado.rows.map(mapearEgreso),
    };
  }

  async findById(id, options = {}) {
    return mapearEgreso(await ModeloEgresoMercaderia.findByPk(id, {
      transaction: options.transaction,
      ...(options.lock && options.transaction
        ? { lock: options.transaction.LOCK.UPDATE }
        : {}),
    }));
  }

  async findDetallesByEgresoId(egresoId, options = {}) {
    const modelos = await ModeloDetalleEgreso.findAll({
      where: { egreso_id: egresoId },
      order: [['id', 'ASC']],
      transaction: options.transaction,
      ...(options.lock && options.transaction
        ? { lock: options.transaction.LOCK.UPDATE }
        : {}),
    });
    return modelos.map(mapearDetalle);
  }

  async findByIdempotencyKey(key) {
    const detalle = await ModeloDetalleEgreso.findOne({
      where: { idempotency_key: key },
    });
    if (detalle) return this.findById(detalle.egreso_id);
    const operacion = await ModeloOperacionFinancieraInventario.findOne({
      where: { idempotency_key: key },
    });
    return operacion?.egreso_id
      ? this.findById(operacion.egreso_id)
      : null;
  }

  async findByOperacionConfirmacionId(id, options = {}) {
    return mapearEgreso(await ModeloEgresoMercaderia.findOne({
      where: { operacion_confirmacion_id: id },
      transaction: options.transaction,
    }));
  }

  async findByOperacionAnulacionId(id, options = {}) {
    return mapearEgreso(await ModeloEgresoMercaderia.findOne({
      where: { operacion_anulacion_id: id },
      transaction: options.transaction,
    }));
  }

  async findIngresoById(id, options = {}) {
    const modelo = await Ingreso.findByPk(id, {
      transaction: options.transaction,
    });
    return modelo?.get({ plain: true }) ?? null;
  }

  async findDetalleIngresoById(id, options = {}) {
    const modelo = await DetalleIngreso.findByPk(id, {
      transaction: options.transaction,
    });
    return modelo?.get({ plain: true }) ?? null;
  }

  async findMovimientosByEgresoId(id, options = {}) {
    const modelos = await MovimientoStock.findAll({
      where: { referencia_tipo: 'EGRESO', referencia_id: id },
      order: [['fecha_operacion', 'ASC'], ['id', 'ASC']],
      transaction: options.transaction,
      ...(options.lock && options.transaction
        ? { lock: options.transaction.LOCK.UPDATE }
        : {}),
    });
    return modelos.map((modelo) => modelo.get({ plain: true }));
  }

  async cantidadDevueltaDetalleIngreso(id, options = {}) {
    const detalles = await ModeloDetalleEgreso.findAll({
      where: { detalle_ingreso_id: id },
      attributes: ['egreso_id', 'cantidad'],
      transaction: options.transaction,
      raw: true,
    });
    if (detalles.length === 0) return 0;
    const egresos = await ModeloEgresoMercaderia.findAll({
      where: {
        id: { [Op.in]: detalles.map((detalle) => detalle.egreso_id) },
        estado: { [Op.in]: ['BORRADOR', 'CONFIRMADO'] },
      },
      attributes: ['id'],
      transaction: options.transaction,
      raw: true,
    });
    const ids = new Set(egresos.map((egreso) => Number(egreso.id)));
    return detalles
      .filter((detalle) => ids.has(Number(detalle.egreso_id)))
      .reduce((total, detalle) => total + Number(detalle.cantidad ?? 0), 0);
  }
}
