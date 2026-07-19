import SucursalSalidaPuerto from '../../aplicacion/puertos/salida/SucursalSalidaPuerto.js';
import ModeloSucursal from '../modelos/ModeloSucursal.js';

export class SucursalQueryAdaptador extends SucursalSalidaPuerto {
  async lista() { return { estado: 'ok', resultado: await ModeloSucursal.findAll({ order: [['nombre', 'ASC']] }) }; }
  async buscarPorId(id) { const sucursal = await ModeloSucursal.findByPk(id); return sucursal ? { estado: 'ok', resultado: sucursal } : { estado: 'error', resultado: null }; }
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
