import { Op } from 'sequelize';
import CuentaSalidaQueryPuerto from '../../aplicacion/puertos/salida/CuentaSalidaQueryPuerto.js';
import { Cuenta } from '../modelos/Modelos.js';

export default class CuentaPgsQueryAdaptador extends CuentaSalidaQueryPuerto {
  async lista({ estado, tipo, terceroId, limit = 20, offset = 0 } = {}) {
    const where = {};
    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;
    if (terceroId) where.tercero_id = terceroId;
    return { estado: 'ok', resultado: await Cuenta.findAll({ where, order: [['fecha', 'DESC'], ['id', 'DESC']], limit: Math.min(Number(limit) || 20, 100), offset: Math.max(Number(offset) || 0, 0) }) };
  }
  async buscarPorId(id) { const resultado = await Cuenta.findByPk(id); return resultado ? { estado: 'ok', resultado } : { estado: 'error', resultado: 'Cuenta no encontrada' }; }
}
