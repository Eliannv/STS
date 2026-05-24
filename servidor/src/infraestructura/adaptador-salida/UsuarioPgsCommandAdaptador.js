// src/infraestructura/adaptador-salida/UsuarioPgsCommandAdaptador.js
import UsuarioSalidaCommandPuerto from '../../aplicacion/puertos/salida/UsuarioSalidaCommandPuerto.js';
import postgresql from '../base-dato/Postgresql.js';

export default class UsuarioPgsCommandAdaptador extends UsuarioSalidaCommandPuerto {

  buscarPorEmail = async (email) => {
    try {
      const result = await postgresql.query(
        'SELECT * FROM usuarios WHERE email = $1 LIMIT 1',
        [email]
      );
      if (result.rowCount === 0) return { estado: 'error', resultado: null };
      return { estado: 'ok', resultado: result.rows[0] };
    } catch (error) {
      console.error('Error al buscar usuario por email:', error.message);
      return { estado: 'error', resultado: null };
    }
  }

  guardar = async (usuario) => {
    try {
      const result = await postgresql.query(
        `INSERT INTO usuarios
           (nombre, apellido, email, password_hash, cedula, fecha_nacimiento,
            rol, activo, sucursal_id, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
         RETURNING id`,
        [
          usuario.nombre,
          usuario.apellido,
          usuario.email,
          usuario.passwordHash,
          usuario.cedula,
          usuario.fechaNacimiento,
          usuario.rol,
          usuario.activo,
          usuario.sucursalId
        ]
      );
      const id = result.rows[0].id;
      console.log(`Usuario creado con ID: ${id}`);
      return { estado: 'ok', resultado: `Usuario creado con ID ${id}` };
    } catch (error) {
      console.error('Error al guardar usuario:', error.message);
      if (error.code === '23505') {
        return { estado: 'error', resultado: 'El email ya está registrado' };
      }
      return { estado: 'error', resultado: `Error al crear usuario: ${error.message}` };
    }
  }

  actualizar = async (usuario) => {
    try {
      const result = await postgresql.query(
        `UPDATE usuarios
         SET nombre=$1, apellido=$2, email=$3, cedula=$4,
             fecha_nacimiento=$5, rol=$6, activo=$7, sucursal_id=$8, updated_at=NOW()
         WHERE id=$9 RETURNING id`,
        [
          usuario.nombre,
          usuario.apellido,
          usuario.email,
          usuario.cedula,
          usuario.fechaNacimiento,
          usuario.rol,
          usuario.activo,
          usuario.sucursalId,
          usuario.id
        ]
      );
      if (result.rowCount === 0) {
        return { estado: 'error', resultado: `No se encontró el usuario con ID ${usuario.id}` };
      }
      return { estado: 'ok', resultado: `Usuario con ID ${usuario.id} actualizado correctamente` };
    } catch (error) {
      console.error('Error al actualizar usuario:', error.message);
      return { estado: 'error', resultado: `Error al actualizar: ${error.message}` };
    }
  }

  eliminar = async (id) => {
    try {
      const result = await postgresql.query(
        'UPDATE usuarios SET activo=false, updated_at=NOW() WHERE id=$1 RETURNING id',
        [id]
      );
      if (result.rowCount === 0) {
        return { estado: 'error', resultado: `No se encontró el usuario con ID ${id}` };
      }
      return { estado: 'ok', resultado: `Usuario con ID ${id} desactivado correctamente` };
    } catch (error) {
      console.error('Error al desactivar usuario:', error.message);
      return { estado: 'error', resultado: `Error al eliminar: ${error.message}` };
    }
  }

  actualizarPassword = async (id, passwordHash) => {
    try {
      const result = await postgresql.query(
        'UPDATE usuarios SET password_hash=$1, updated_at=NOW() WHERE id=$2 RETURNING id',
        [passwordHash, id]
      );
      if (result.rowCount === 0) {
        return { estado: 'error', resultado: `No se encontró el usuario con ID ${id}` };
      }
      return { estado: 'ok', resultado: 'Contraseña actualizada correctamente' };
    } catch (error) {
      console.error('Error al actualizar contraseña:', error.message);
      return { estado: 'error', resultado: `Error al actualizar contraseña: ${error.message}` };
    }
  }
}
