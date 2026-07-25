// inventario-servicio/src/infraestructura/adaptador-salida/TransferenciaPgsQueryAdaptador.js
import { Op } from 'sequelize';
import TransferenciaSalidaQueryPuerto from '../../aplicacion/puertos/salida/TransferenciaSalidaQueryPuerto.js';
import { Transferencia, DetalleTransferencia } from '../modelos/ModeloTransferencia.js';

export default class TransferenciaPgsQueryAdaptador extends TransferenciaSalidaQueryPuerto {
  async lista({ sucursalId = null, estado = null, limit = 20, offset = 0 } = {}) {
    const where = {};
    // Una sucursal ve los traslados que la involucran, los envíe o los reciba.
    if (sucursalId) {
      where[Op.or] = [{ sucursal_origen_id: sucursalId }, { sucursal_destino_id: sucursalId }];
    }
    if (estado) where.estado = estado;

    const transferencias = await Transferencia.findAll({
      where,
      order: [['fecha', 'DESC'], ['id', 'DESC']],
      limit: Math.min(Number(limit) || 20, 500),
      offset: Math.max(Number(offset) || 0, 0),
    });
    return { estado: 'ok', resultado: transferencias.map((fila) => fila.get({ plain: true })) };
  }

  async buscarPorId(id) {
    const cabecera = await Transferencia.findByPk(id);
    if (!cabecera) return { estado: 'error', resultado: null };
    const detalles = await DetalleTransferencia.findAll({ where: { transferencia_id: id }, raw: true });
    return { estado: 'ok', resultado: { ...cabecera.get({ plain: true }), detalles } };
  }
}
