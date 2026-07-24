// inventario-servicio/src/infraestructura/adaptador-salida/OperacionFinancieraInventarioPgsQueryAdaptador.js
import { Op } from 'sequelize';
import OperacionFinancieraInventarioSalidaQueryPuerto from '../../aplicacion/puertos/salida/OperacionFinancieraInventarioSalidaQueryPuerto.js';
import OperacionFinancieraInventario from '../../dominio/entidades/OperacionFinancieraInventario.js';
import ModeloOperacionFinancieraInventario from '../modelos/ModeloOperacionFinancieraInventario.js';

const mapear = (modelo) => (
  modelo
    ? new OperacionFinancieraInventario(modelo.get({ plain: true }))
    : null
);

export default class OperacionFinancieraInventarioPgsQueryAdaptador
  extends OperacionFinancieraInventarioSalidaQueryPuerto {
  async findPendientes(limite = 10) {
    const modelos = await ModeloOperacionFinancieraInventario.findAll({
      where: {
        estado: 'PENDIENTE',
        [Op.or]: [
          { proximo_reintento_en: null },
          { proximo_reintento_en: { [Op.lte]: new Date() } },
        ],
      },
      order: [['created_at', 'ASC'], ['id', 'ASC']],
      limit: Math.min(Math.max(Number(limite) || 10, 1), 100),
    });
    return modelos.map(mapear);
  }

  async findByIdempotencyKey(key) {
    return mapear(await ModeloOperacionFinancieraInventario.findOne({
      where: { idempotency_key: key },
    }));
  }

  async findByOperacionId(id) {
    return mapear(await ModeloOperacionFinancieraInventario.findOne({
      where: { operacion_id: id },
    }));
  }

  async findByIngresoId(ingresoId) {
    const modelos = await ModeloOperacionFinancieraInventario.findAll({
      where: { ingreso_id: ingresoId },
      order: [['created_at', 'ASC'], ['id', 'ASC']],
    });
    return modelos.map(mapear);
  }
}
