import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from '../../../dominio/entidades/Usuario.js';

export default class UsuarioCommandUsesCase {
  constructor(adaptadorBDSalidaCommand) {
    this.adaptadorBDSalida = adaptadorBDSalidaCommand;
  }

  async login(dto) {
    if (!dto.getEmail() || !dto.getPassword()) {
      return { estado: 'error', mensaje: 'Email y contraseña son requeridos' };
    }

    const resultado = await this.adaptadorBDSalida.buscarPorEmail(dto.getEmail());
    if (resultado.estado === 'error' || !resultado.resultado) {
      return { estado: 'error', mensaje: 'Credenciales inválidas' };
    }

    const usuario = resultado.resultado;
    if (!usuario.activo || !(await bcrypt.compare(dto.getPassword(), usuario.password_hash))) {
      return { estado: 'error', mensaje: 'Credenciales inválidas' };
    }

    const payload = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol,
      sucursalId: usuario.sucursal_id
    };

    return {
      estado: 'ok',
      resultado: {
        token: jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }),
        usuario: this.usuarioPublico(usuario)
      }
    };
  }

  async crear(dto) {
    if (!dto.getNombre() || !dto.getEmail() || !dto.getPassword()) {
      return { estado: 'error', resultado: 'Nombre, email y contraseña son requeridos' };
    }

    const usuario = new Usuario(
      null,
      dto.getNombre(),
      dto.getApellido(),
      dto.getEmail(),
      await bcrypt.hash(dto.getPassword(), 10),
      dto.getCedula(),
      dto.getFechaNacimiento(),
      dto.getRol(),
      true,
      dto.getSucursalId()
    );

    return this.adaptadorBDSalida.guardar(usuario);
  }

  async editar(dto) {
    if (!dto.getId()) return { estado: 'error', resultado: 'El ID es requerido para actualizar' };
    return this.adaptadorBDSalida.actualizar(new Usuario(
      dto.getId(), dto.getNombre(), dto.getApellido(), dto.getEmail(), null,
      dto.getCedula(), dto.getFechaNacimiento(), dto.getRol(), dto.getActivo(), dto.getSucursalId()
    ));
  }

  async eliminar(dto) {
    if (!dto.getId()) return { estado: 'error', resultado: 'El ID es requerido para eliminar' };
    return this.adaptadorBDSalida.eliminar(dto.getId());
  }

  async cambiarPassword(dto) {
    if (!dto.getId() || !dto.getPassword()) {
      return { estado: 'error', resultado: 'ID y nueva contraseña son requeridos' };
    }
    return this.adaptadorBDSalida.actualizarPassword(dto.getId(), await bcrypt.hash(dto.getPassword(), 10));
  }

  usuarioPublico(usuario) {
    const { password_hash: ignored, ...publico } = usuario;
    return publico;
  }
}
