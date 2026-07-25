// facturacion-servicio/src/infraestructura/adaptador-salida/VentaTarjetaPgsQueryAdaptador.js
import { Op } from 'sequelize';
import VentaTarjetaSalidaQueryPuerto from '../../aplicacion/puertos/salida/VentaTarjetaSalidaQueryPuerto.js';
import VentaTarjetaEntidad from '../../dominio/entidades/VentaTarjeta.js';
import AbonoVentaTarjeta from '../../dominio/entidades/AbonoVentaTarjeta.js';
import { VentaTarjeta, AbonoTarjeta } from '../modelos/Modelos.js';

const mapearVenta = (modelo) => (
  modelo ? new VentaTarjetaEntidad(modelo.get({ plain: true })) : null
);

const mapearAbono = (modelo) => (
  modelo ? new AbonoVentaTarjeta(modelo.get({ plain: true })) : null
);

export default class VentaTarjetaPgsQueryAdaptador
  extends VentaTarjetaSalidaQueryPuerto {
  async findById(id) {
    return mapearVenta(await VentaTarjeta.findByPk(id));
  }

  async findAbonoByIdempotencyKey(key) {
    return mapearAbono(
      await AbonoTarjeta.findOne({ where: { idempotency_key: key } }),
    );
  }

  async listarVentasTarjeta(filtros = {}) {
    const where = {};
    if (filtros.sucursalId) where.sucursal_id = Number(filtros.sucursalId);
    if (filtros.estado) where.estado = filtros.estado;
    if (filtros.clienteId) where.cliente_id = filtros.clienteId;
    if (filtros.banco) where.banco = { [Op.iLike]: `%${filtros.banco}%` };
    if (filtros.fechaDesde || filtros.fechaHasta) {
      const fechaDesde = filtros.fechaDesde
        ? new Date(`${filtros.fechaDesde}T00:00:00`)
        : null;
      const fechaHasta = filtros.fechaHasta
        ? new Date(`${filtros.fechaHasta}T23:59:59.999`)
        : null;
      where.fecha_venta = fechaDesde && fechaHasta
        ? { [Op.between]: [fechaDesde, fechaHasta] }
        : fechaDesde
          ? { [Op.gte]: fechaDesde }
          : { [Op.lte]: fechaHasta };
    }
    if (filtros.buscar) {
      where[Op.or] = [
        { factura_id_personalizado: { [Op.iLike]: `%${filtros.buscar}%` } },
        { cliente_nombre: { [Op.iLike]: `%${filtros.buscar}%` } },
      ];
    }
    const ventas = await VentaTarjeta.findAll({
      where,
      order: [['fecha_venta', 'DESC']],
      limit: 500,
    });
    const resultado = await Promise.all(ventas.map(async (venta) => ({
      ...venta.toJSON(),
      cantidad_abonos: await AbonoTarjeta.count({
        where: { venta_tarjeta_id: venta.id },
      }),
      total_abonado_verificado:
        await AbonoTarjeta.sum('monto_bruto', {
          where: { venta_tarjeta_id: venta.id },
        }) || 0,
    })));
    return { estado: 'ok', resultado };
  }

  async obtenerVentaTarjeta(id) {
    const venta = await VentaTarjeta.findByPk(id);
    if (!venta) {
      return { estado: 'error', resultado: 'Venta tarjeta no encontrada' };
    }
    return {
      estado: 'ok',
      resultado: {
        ...venta.toJSON(),
        cantidad_abonos: await AbonoTarjeta.count({
          where: { venta_tarjeta_id: id },
        }),
        total_abonado_verificado:
          await AbonoTarjeta.sum('monto_bruto', {
            where: { venta_tarjeta_id: id },
          }) || 0,
      },
    };
  }

  async historialAbonos(ventaTarjetaId) {
    const abonos = await AbonoTarjeta.findAll({
      where: { venta_tarjeta_id: ventaTarjetaId },
      order: [['fecha_acreditacion', 'DESC'], ['id', 'DESC']],
    });
    return {
      estado: 'ok',
      resultado: abonos.map((abono) => abono.get({ plain: true })),
    };
  }

  async resumenVentasTarjeta() {
    const ventas = await VentaTarjeta.findAll();
    return {
      estado: 'ok',
      resultado: {
        total_ventas: ventas.length,
        vendidas_pendientes: ventas.filter(
          (venta) => venta.estado === 'PENDIENTE',
        ).length,
        parcialmente_acreditadas: ventas.filter(
          (venta) => venta.estado === 'PARCIALMENTE_ACREDITADA',
        ).length,
        vendidas_acreditadas: ventas.filter(
          (venta) => venta.estado === 'ACREDITADA',
        ).length,
        ventas_legacy: ventas.filter(
          (venta) => venta.estado === 'LEGACY_LIQUIDADA',
        ).length,
        monto_total: ventas.reduce(
          (suma, venta) => suma + Number(venta.monto_total || 0),
          0,
        ),
        monto_bruto_acreditado: ventas.reduce(
          (suma, venta) => suma + Number(venta.monto_bruto_acreditado || 0),
          0,
        ),
        monto_neto_acreditado: ventas.reduce(
          (suma, venta) => suma + Number(venta.monto_neto_acreditado || 0),
          0,
        ),
        comision_acumulada: ventas.reduce(
          (suma, venta) => suma + Number(venta.comision_acumulada || 0),
          0,
        ),
        retencion_acumulada: ventas.reduce(
          (suma, venta) => suma + Number(venta.retencion_acumulada || 0),
          0,
        ),
      },
    };
  }
}
