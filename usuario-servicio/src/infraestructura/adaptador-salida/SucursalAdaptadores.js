import SucursalSalidaPuerto from '../../aplicacion/puertos/salida/SucursalSalidaPuerto.js';
import ModeloSucursal from '../modelos/ModeloSucursal.js';
import ModeloUsuario from '../modelos/ModeloUsuario.js';

export class SucursalQueryAdaptador extends SucursalSalidaPuerto {
  async lista({ incluirInactivas = false } = {}) {
    const where = incluirInactivas ? {} : { activo: true };
    return { estado: 'ok', resultado: await ModeloSucursal.findAll({ where, order: [['es_matriz', 'DESC'], ['nombre', 'ASC']] }) };
  }

  async buscarPorId(id) {
    const sucursal = await ModeloSucursal.findByPk(id);
    return sucursal ? { estado: 'ok', resultado: sucursal.get({ plain: true }) } : { estado: 'error', resultado: null };
  }

  contarUsuariosActivos(sucursalId) {
    return ModeloUsuario.count({ where: { sucursal_id: sucursalId, activo: true } });
  }
}

export class SucursalCommandAdaptador extends SucursalSalidaPuerto {
  async guardar(sucursal) {
    try {
      const creada = await ModeloSucursal.create({
        codigo: sucursal.codigo,
        nombre: sucursal.nombre,
        activo: sucursal.activo,
        direccion: sucursal.direccion,
        telefono: sucursal.telefono,
        email: sucursal.email,
        creado_por_id: sucursal.creadoPorId,
        fecha_creacion: new Date()
      });
      return { estado: 'ok', resultado: creada };
    } catch (error) {
      return { estado: 'error', resultado: error.name === 'SequelizeUniqueConstraintError' ? 'El código de sucursal ya existe' : error.message };
    }
  }

  async actualizar(sucursal) {
    try {
      const [count] = await ModeloSucursal.update({
        codigo: sucursal.codigo,
        nombre: sucursal.nombre,
        activo: sucursal.activo,
        direccion: sucursal.direccion,
        telefono: sucursal.telefono,
        email: sucursal.email
      }, { where: { id: sucursal.id } });
      return count ? { estado: 'ok', resultado: 'Sucursal actualizada correctamente' } : { estado: 'error', resultado: 'Sucursal no encontrada' };
    } catch (error) {
      return { estado: 'error', resultado: error.name === 'SequelizeUniqueConstraintError' ? 'El código de sucursal ya existe' : error.message };
    }
  }

  async eliminar(id) {
    const [count] = await ModeloSucursal.update({ activo: false }, { where: { id } });
    return count ? { estado: 'ok', resultado: 'Sucursal desactivada correctamente' } : { estado: 'error', resultado: 'Sucursal no encontrada' };
  }
}
