// src/aplicacion/uses-cases/command/UsuarioCommandUsesCase.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from '../../../dominio/entidades/Usuario.js';

export default class UsuarioCommandUsesCase {
  constructor(adaptadorBDSalidaCommand) {
    this.adaptadorBDSalida = adaptadorBDSalidaCommand;
  }

  async login(dtoUsuario) {
    const email    = dtoUsuario.getEmail();
    const password = dtoUsuario.getPassword();

    if (!email || !password) {
      return { estado: 'error', mensaje: 'Email y contraseña son requeridos' };
    }

    const resultado = await this.adaptadorBDSalida.buscarPorEmail(email);
    if (resultado.estado === 'error' || !resultado.resultado) {
      return { estado: 'error', mensaje: 'Credenciales inválidas' };
    }

    const usuarioDB = resultado.resultado;

    if (!usuarioDB.activo) {
      return { estado: 'error', mensaje: 'Usuario desactivado, contacte al administrador' };
    }

    const passwordValido = await bcrypt.compare(password, usuarioDB.password_hash);
    if (!passwordValido) {
      return { estado: 'error', mensaje: 'Credenciales inválidas' };
    }

    const payload = {
      id:         usuarioDB.id,
      email:      usuarioDB.email,
      nombre:     usuarioDB.nombre,
      apellido:   usuarioDB.apellido,
      rol:        usuarioDB.rol,
      sucursalId: usuarioDB.sucursal_id
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    });

    return {
      estado: 'ok',
      resultado: {
        token,
        usuario: {
          id:         usuarioDB.id,
          nombre:     usuarioDB.nombre,
          apellido:   usuarioDB.apellido,
          email:      usuarioDB.email,
          rol:        usuarioDB.rol,
          sucursalId: usuarioDB.sucursal_id
        }
      }
    };
  }

  async crear(dtoUsuario) {
    if (!dtoUsuario.getEmail() || !dtoUsuario.getPassword() || !dtoUsuario.getNombre()) {
      return { estado: 'error', resultado: 'Nombre, email y contraseña son requeridos' };
    }

    const passwordHash = await bcrypt.hash(dtoUsuario.getPassword(), 10);

    const usuario = new Usuario(
      null,
      dtoUsuario.getNombre(),
      dtoUsuario.getApellido(),
      dtoUsuario.getEmail(),
      passwordHash,
      dtoUsuario.getCedula(),
      dtoUsuario.getFechaNacimiento(),
      dtoUsuario.getRol(),
      true,
      dtoUsuario.getSucursalId()
    );

    return await this.adaptadorBDSalida.guardar(usuario);
  }

  async editar(dtoUsuario) {
    if (!dtoUsuario.getId()) {
      return { estado: 'error', resultado: 'El ID es requerido para actualizar' };
    }

    const usuario = new Usuario(
      dtoUsuario.getId(),
      dtoUsuario.getNombre(),
      dtoUsuario.getApellido(),
      dtoUsuario.getEmail(),
      null,
      dtoUsuario.getCedula(),
      dtoUsuario.getFechaNacimiento(),
      dtoUsuario.getRol(),
      dtoUsuario.getActivo(),
      dtoUsuario.getSucursalId()
    );

    return await this.adaptadorBDSalida.actualizar(usuario);
  }

  async eliminar(dtoUsuario) {
    if (!dtoUsuario.getId()) {
      return { estado: 'error', resultado: 'El ID es requerido para eliminar' };
    }
    return await this.adaptadorBDSalida.eliminar(dtoUsuario.getId());
  }

  async cambiarPassword(dtoUsuario) {
    if (!dtoUsuario.getId() || !dtoUsuario.getPassword()) {
      return { estado: 'error', resultado: 'ID y nueva contraseña son requeridos' };
    }
    const passwordHash = await bcrypt.hash(dtoUsuario.getPassword(), 10);
    return await this.adaptadorBDSalida.actualizarPassword(dtoUsuario.getId(), passwordHash);
  }
}
