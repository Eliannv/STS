import { Op } from 'sequelize';
import { ClienteModel } from '../modelos/Modelos.js';

const toDb = (c) => ({ nombres: c.nombres, apellidos: c.apellidos, cedula: c.cedula, telefono: c.telefono, email: c.email, fecha_nacimiento: c.fechaNacimiento, direccion: c.direccion, pais: c.pais, provincia: c.provincia, ciudad: c.ciudad, activo: c.activo, tiene_historial_clinico: c.tieneHistorialClinico, tiene_credito: c.tieneCredito, tiene_deuda: c.tieneDeuda, es_consumidor_final: c.esConsumidorFinal, updated_at: new Date() });

export class ClienteQueryAdaptador {
  async lista(buscar, { limit = 20, offset = 0, estado = 'activos' } = {}) {
    const where = {};
    if (estado === 'activos') where.activo = true;
    if (estado === 'inactivos') where.activo = false;
    if (buscar) where[Op.or] = [{ nombres: { [Op.iLike]: `%${buscar}%` } }, { apellidos: { [Op.iLike]: `%${buscar}%` } }, { cedula: { [Op.iLike]: `%${buscar}%` } }, { telefono: { [Op.iLike]: `%${buscar}%` } }];
    return { estado: 'ok', resultado: await ClienteModel.findAll({ where, order: [['apellidos', 'ASC'], ['nombres', 'ASC']], limit, offset }) };
  }
  async buscarPorId(id) { const cliente = await ClienteModel.findOne({ where: { id, activo: true } }); return cliente ? { estado: 'ok', resultado: cliente } : { estado: 'error', resultado: null }; }
}

export class ClienteCommandAdaptador {
  async guardar(cliente) { try { const creado = await ClienteModel.create({ ...toDb(cliente), created_at: new Date() }); return { estado: 'ok', resultado: creado }; } catch (error) { return { estado: 'error', resultado: error.name === 'SequelizeUniqueConstraintError' ? 'La cédula ya está registrada' : error.message }; } }
  async actualizar(cliente) { try { const [count] = await ClienteModel.update(toDb(cliente), { where: { id: cliente.id } }); return count ? { estado: 'ok', resultado: 'Cliente actualizado correctamente' } : { estado: 'error', resultado: 'Cliente no encontrado' }; } catch (error) { return { estado: 'error', resultado: error.name === 'SequelizeUniqueConstraintError' ? 'La cédula ya está registrada' : error.message }; } }
  async eliminar(id) { const [count] = await ClienteModel.update({ activo: false, updated_at: new Date() }, { where: { id } }); return count ? { estado: 'ok', resultado: 'Cliente desactivado correctamente' } : { estado: 'error', resultado: 'Cliente no encontrado' }; }
}
