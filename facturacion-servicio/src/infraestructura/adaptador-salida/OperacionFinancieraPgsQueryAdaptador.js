// facturacion-servicio/src/infraestructura/adaptador-salida/OperacionFinancieraPgsQueryAdaptador.js
import { Op } from 'sequelize';
import OperacionFinancieraSalidaQueryPuerto from '../../aplicacion/puertos/salida/OperacionFinancieraSalidaQueryPuerto.js';
import OperacionFinanciera from '../../dominio/entidades/OperacionFinanciera.js';
import ModeloOperacionFinanciera from '../modelos/ModeloOperacionFinanciera.js';

const mapearEntidad = (modelo) => (
  modelo ? new OperacionFinanciera(modelo.get({ plain: true })) : null
);

export default class OperacionFinancieraPgsQueryAdaptador
  extends OperacionFinancieraSalidaQueryPuerto {
  async findPendientes(limite = 10) {
    const operaciones = await ModeloOperacionFinanciera.findAll({
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
    return operaciones.map(mapearEntidad);
  }

  async findByIdempotencyKey(key) {
    return mapearEntidad(
      await ModeloOperacionFinanciera.findOne({
        where: { idempotency_key: key },
      }),
    );
  }

  async findByOperacionId(id) {
    return mapearEntidad(
      await ModeloOperacionFinanciera.findOne({
        where: { operacion_id: id },
      }),
    );
  }

  async findByFacturaId(facturaId) {
    const operaciones = await ModeloOperacionFinanciera.findAll({
      where: { factura_id: facturaId },
      order: [['created_at', 'ASC'], ['id', 'ASC']],
    });
    return operaciones.map(mapearEntidad);
  }
}
