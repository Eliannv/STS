// caja-servicio/src/infraestructura/adaptador-salida/CajaChicaPgsQueryAdaptador.js
import { Op } from 'sequelize';
import CajaChicaSalidaQueryPuerto from '../../aplicacion/puertos/salida/CajaChicaSalidaQueryPuerto.js';
import CajaChica from '../../dominio/entidades/CajaChica.js';
import MovimientoFinanciero from '../../dominio/entidades/MovimientoFinanciero.js';
import ModeloCajaChica from '../modelos/ModeloCajaChica.js';
import ModeloMovimientoChica from '../modelos/ModeloMovimientoChica.js';

const mapearCaja = (modelo) => (
  modelo ? new CajaChica(modelo.get({ plain: true })) : null
);

const mapearMovimiento = (modelo) => (
  modelo ? new MovimientoFinanciero(modelo.get({ plain: true })) : null
);

export default class CajaChicaPgsQueryAdaptador extends CajaChicaSalidaQueryPuerto {
  async lista({
    estado,
    fechaDesde,
    fechaHasta,
    cajaBancoId,
    sucursalId,
    limit = 20,
    offset = 0,
  } = {}) {
    const where = { activo: true };
    if (estado) where.estado = estado;
    if (cajaBancoId) where.caja_banco_id = cajaBancoId;
    if (sucursalId) where.sucursal_id = sucursalId;
    if (fechaDesde || fechaHasta) {
      where.fecha = {
        ...(fechaDesde ? { [Op.gte]: fechaDesde } : {}),
        ...(fechaHasta ? { [Op.lte]: fechaHasta } : {}),
      };
    }

    const cajas = await ModeloCajaChica.findAll({
      where,
      order: [['created_at', 'DESC'], ['id', 'DESC']],
      limit: Math.min(Number(limit) || 20, 100),
      offset: Math.max(Number(offset) || 0, 0),
    });
    return { estado: 'ok', resultado: cajas.map(mapearCaja) };
  }

  async buscarPorId(id) {
    const caja = mapearCaja(
      await ModeloCajaChica.findOne({
        where: { id, activo: true },
      }),
    );
    if (caja) {
      caja.resumen = {
        total_ingresos: Number(caja.getIngresosAcumulados()),
        total_egresos: Number(caja.getEgresosAcumulados()),
        cantidad_movimientos: Number(caja.getTotalMovimientos()),
      };
    }
    return caja
      ? { estado: 'ok', resultado: caja }
      : { estado: 'error', resultado: 'Caja Chica no encontrada' };
  }

  // Cada sucursal tiene su propia caja chica abierta: sin sucursalId esto
  // devolvería la de cualquier otra y bloquearía la apertura local.
  async cajaAbierta(sucursalId = null) {
    return {
      estado: 'ok',
      resultado: mapearCaja(
        await ModeloCajaChica.findOne({
          where: { estado: 'ABIERTA', activo: true, ...(sucursalId ? { sucursal_id: sucursalId } : {}) },
          order: [['created_at', 'DESC']],
        }),
      ),
    };
  }

  async buscarAbiertaPorCajaBanco(cajaBancoId) {
    return {
      estado: 'ok',
      resultado: mapearCaja(
        await ModeloCajaChica.findOne({
          where: {
            caja_banco_id: cajaBancoId,
            estado: 'ABIERTA',
            activo: true,
          },
        }),
      ),
    };
  }

  async buscarPorFecha(fecha) {
    const cajas = await ModeloCajaChica.findAll({
      where: { fecha, activo: true },
      order: [['created_at', 'DESC']],
    });
    return { estado: 'ok', resultado: cajas.map(mapearCaja) };
  }

  async listarMovimientos(cajaId) {
    const movimientos = await ModeloMovimientoChica.findAll({
      where: { caja_chica_id: cajaId },
      order: [['fecha_operacion', 'DESC'], ['id', 'DESC']],
    });
    return {
      estado: 'ok',
      resultado: movimientos.map(mapearMovimiento),
    };
  }
}
