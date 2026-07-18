import { HistorialModel, ClienteModel } from '../modelos/Modelos.js';
import sequelize from '../base-dato/Postgresql.js';

const campos = ['od_esfera','od_cilindro','od_eje','od_avsc','od_avcc','oi_esfera','oi_cilindro','oi_eje','oi_avsc','oi_avcc','dp','add','de','altura','color','observacion','armazon_h','armazon_v','armazon_dbl'];
const toDb = (h) => Object.fromEntries(campos.map((campo) => [campo, h[campo.replace(/_([a-z])/g, (_, letra) => letra.toUpperCase())] ?? null]));

export class HistorialQueryAdaptador {
  async listaPorCliente(clienteId) { return { estado: 'ok', resultado: await HistorialModel.findAll({ where: { cliente_id: clienteId }, order: [['created_at', 'DESC']] }) }; }
  async buscarPorId(id) { const historial = await HistorialModel.findByPk(id); return historial ? { estado: 'ok', resultado: historial } : { estado: 'error', resultado: null }; }
}

export class HistorialCommandAdaptador {
  async guardar(historial) {
    const transaction = await sequelize.transaction();
    try {
      const cliente = await ClienteModel.findOne({ where: { id: historial.clienteId, activo: true }, transaction, lock: transaction.LOCK.UPDATE });
      if (!cliente) {
        await transaction.rollback();
        return { estado: 'error', resultado: 'Cliente no encontrado' };
      }
      const ahora = new Date();
      const creado = await HistorialModel.create({ cliente_id: historial.clienteId, ...toDb(historial), created_at: ahora, updated_at: ahora }, { transaction });
      await cliente.update({ tiene_historial_clinico: true, updated_at: ahora }, { transaction });
      await transaction.commit();
      return { estado: 'ok', resultado: creado };
    } catch (error) {
      await transaction.rollback();
      return { estado: 'error', resultado: error.message };
    }
  }

  async actualizar(historial) {
    const [count] = await HistorialModel.update({ ...toDb(historial), updated_at: new Date() }, { where: { id: historial.id } });
    return count ? { estado: 'ok', resultado: 'Historial actualizado correctamente' } : { estado: 'error', resultado: 'Historial no encontrado' };
  }

  async eliminar(id) {
    const transaction = await sequelize.transaction();
    try {
      const historial = await HistorialModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!historial) {
        await transaction.rollback();
        return { estado: 'error', resultado: 'Historial no encontrado' };
      }
      const clienteId = historial.cliente_id;
      await historial.destroy({ transaction });
      const restantes = await HistorialModel.count({ where: { cliente_id: clienteId }, transaction });
      if (!restantes) await ClienteModel.update({ tiene_historial_clinico: false, updated_at: new Date() }, { where: { id: clienteId }, transaction });
      await transaction.commit();
      return { estado: 'ok', resultado: 'Historial eliminado correctamente' };
    } catch (error) {
      await transaction.rollback();
      return { estado: 'error', resultado: error.message };
    }
  }
}
