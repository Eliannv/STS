// caja-servicio/src/infraestructura/adaptador-salida/CajaBancoPgsQueryAdaptador.js
import { Op } from 'sequelize';
import CajaBancoSalidaQueryPuerto from '../../aplicacion/puertos/salida/CajaBancoSalidaQueryPuerto.js';
import CajaBanco from '../../dominio/entidades/CajaBanco.js';
import MovimientoFinanciero from '../../dominio/entidades/MovimientoFinanciero.js';
import ModeloCajaBanco from '../modelos/ModeloCajaBanco.js';
import ModeloMovimientoBanco from '../modelos/ModeloMovimientoBanco.js';

const mapearCaja = (modelo) => (
  modelo ? new CajaBanco(modelo.get({ plain: true })) : null
);

const mapearMovimiento = (modelo) => (
  modelo ? new MovimientoFinanciero(modelo.get({ plain: true })) : null
);

export default class CajaBancoPgsQueryAdaptador extends CajaBancoSalidaQueryPuerto {
  async lista({
    estado,
    fechaDesde,
    fechaHasta,
    limit = 20,
    offset = 0,
  } = {}) {
    const where = { activo: true };
    if (estado) where.estado = estado;
    if (fechaDesde || fechaHasta) {
      where.fecha = {
        ...(fechaDesde ? { [Op.gte]: fechaDesde } : {}),
        ...(fechaHasta ? { [Op.lte]: fechaHasta } : {}),
      };
    }

    const cajas = await ModeloCajaBanco.findAll({
      where,
      order: [['periodo', 'DESC'], ['id', 'DESC']],
      limit: Math.min(Number(limit) || 20, 100),
      offset: Math.max(Number(offset) || 0, 0),
    });
    return { estado: 'ok', resultado: cajas.map(mapearCaja) };
  }

  async buscarPorId(id) {
    const caja = mapearCaja(
      await ModeloCajaBanco.findOne({
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
      : { estado: 'error', resultado: 'Caja Banco no encontrada' };
  }

  async cajaAbierta() {
    return {
      estado: 'ok',
      resultado: mapearCaja(
        await ModeloCajaBanco.findOne({
          where: { estado: 'ABIERTA', activo: true },
          order: [['fecha_apertura', 'DESC']],
        }),
      ),
    };
  }

  async buscarPorMes(mes) {
    const inicio = `${mes}-01`;
    const fechaFin = new Date(`${inicio}T00:00:00.000Z`);
    fechaFin.setUTCMonth(fechaFin.getUTCMonth() + 1);
    const fin = fechaFin.toISOString().slice(0, 10);
    const cajas = await ModeloCajaBanco.findAll({
      where: {
        activo: true,
        periodo: { [Op.gte]: inicio, [Op.lt]: fin },
      },
      order: [['periodo', 'DESC']],
    });
    return { estado: 'ok', resultado: cajas.map(mapearCaja) };
  }

  async listarMovimientos(cajaId) {
    const movimientos = await ModeloMovimientoBanco.findAll({
      where: { caja_banco_id: cajaId },
      order: [['fecha_operacion', 'DESC'], ['id', 'DESC']],
    });
    return {
      estado: 'ok',
      resultado: movimientos.map(mapearMovimiento),
    };
  }

  async buscarMovimientoPorVentaId(ventaId) {
    const movimientos = await ModeloMovimientoBanco.findAll({
      where: { venta_id: ventaId },
      order: [['fecha_operacion', 'DESC'], ['id', 'DESC']],
    });
    return {
      estado: 'ok',
      resultado: movimientos.map(mapearMovimiento),
    };
  }
}
