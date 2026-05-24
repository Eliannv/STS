// src/infraestructura/adaptador-salida/UsuarioPgsQueryAdaptador.js
import UsuarioSalidaQueryPuerto from '../../aplicacion/puertos/salida/UsuarioSalidaQueryPuerto.js';
import postgresql from '../base-dato/Postgresql.js';

export default class UsuarioPgsQueryAdaptador extends UsuarioSalidaQueryPuerto {

  lista = async () => {
    try {
      const result = await postgresql.query(
        `SELECT id, nombre, apellido, email, cedula, fecha_nacimiento,
                rol, activo, sucursal_id, created_at
         FROM usuarios
         ORDER BY nombre ASC`
      );
      return { estado: 'ok', resultado: result.rows };
    } catch (error) {
      console.error('Error al listar usuarios:', error.message);
      return { estado: 'error', resultado: [] };
    }
  }

  buscarPorId = async (id) => {
    try {
      const result = await postgresql.query(
        `SELECT id, nombre, apellido, email, cedula, fecha_nacimiento,
                rol, activo, sucursal_id, created_at
         FROM usuarios
         WHERE id = $1`,
        [id]
      );
      if (result.rowCount === 0) return { estado: 'error', resultado: null };
      return { estado: 'ok', resultado: result.rows[0] };
    } catch (error) {
      console.error('Error al buscar usuario por ID:', error.message);
      return { estado: 'error', resultado: null };
    }
  }
}