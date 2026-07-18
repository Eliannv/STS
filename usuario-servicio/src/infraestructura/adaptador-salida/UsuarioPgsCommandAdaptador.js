import UsuarioSalidaCommandPuerto from '../../aplicacion/puertos/salida/UsuarioSalidaCommandPuerto.js';
import ModeloUsuario, { sequelize } from '../modelos/ModeloUsuario.js';

export default class UsuarioPgsCommandAdaptador extends UsuarioSalidaCommandPuerto {
  async buscarPorEmail(email) {
    const usuario = await ModeloUsuario.findOne({ where: { email } });
    return usuario ? { estado: 'ok', resultado: usuario.get({ plain: true }) } : { estado: 'error', resultado: null };
  }

  async guardar(usuario) {
    try {
      const creado = await ModeloUsuario.create({
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        password_hash: usuario.passwordHash,
        cedula: usuario.cedula,
        fecha_nacimiento: usuario.fechaNacimiento,
        rol: usuario.rol,
        activo: usuario.activo,
        sucursal_id: usuario.sucursalId,
        created_at: new Date(),
        updated_at: new Date()
      });
      return { estado: 'ok', resultado: { id: creado.id } };
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') return { estado: 'error', resultado: 'El email ya está registrado' };
      return { estado: 'error', resultado: error.message };
    }
  }

  async actualizar(usuario) {
    const [actualizados] = await ModeloUsuario.update({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      cedula: usuario.cedula,
      fecha_nacimiento: usuario.fechaNacimiento,
      rol: usuario.rol,
      activo: usuario.activo,
      sucursal_id: usuario.sucursalId,
      updated_at: new Date()
    }, { where: { id: usuario.id } });
    return actualizados ? { estado: 'ok', resultado: 'Usuario actualizado correctamente' } : { estado: 'error', resultado: 'Usuario no encontrado' };
  }

  async eliminar(id) {
    const [actualizados] = await ModeloUsuario.update({ activo: false, updated_at: new Date() }, { where: { id } });
    return actualizados ? { estado: 'ok', resultado: 'Usuario desactivado correctamente' } : { estado: 'error', resultado: 'Usuario no encontrado' };
  }

  async actualizarPassword(id, passwordHash) {
    const [actualizados] = await ModeloUsuario.update({ password_hash: passwordHash, updated_at: new Date() }, { where: { id } });
    return actualizados ? { estado: 'ok', resultado: 'Contraseña actualizada correctamente' } : { estado: 'error', resultado: 'Usuario no encontrado' };
  }
}
