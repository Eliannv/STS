// src/infraestructura/adaptador-salida/UsuarioPgsQueryAdaptador.js
import UsuarioSalidaQueryPuerto from '../../aplicacion/puertos/salida/UsuarioSalidaQueryPuerto.js';
import postgresql from '../base-dato/Postgresql.js';

export default class UsuarioPgsQueryAdaptador extends UsuarioSalidaQueryPuerto {

    lista = async(buscar, { limit = 20, offset = 0 } = {}) => {
        try {
            const params = [];
            let where = 'WHERE 1=1';
            if (buscar) {
                params.push(`%${buscar}%`);
                where += ` AND (nombre ILIKE $${params.length} OR apellido ILIKE $${params.length} OR email ILIKE $${params.length})`;
            }
            params.push(limit + 1, offset);
            const result = await postgresql.query(
                `SELECT id, nombre, apellido, email, cedula, fecha_nacimiento,
                rol, activo, sucursal_id, created_at
         FROM usuarios
         ${where}
         ORDER BY nombre ASC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
                params
            );
            return { estado: 'ok', resultado: result.rows };
        } catch (error) {
            console.error('Error al listar usuarios:', error.message);
            return { estado: 'error', resultado: [] };
        }
    }

    buscarPorId = async(id) => {
        try {
            const result = await postgresql.query(
                `SELECT id, nombre, apellido, email, cedula, fecha_nacimiento,
                rol, activo, sucursal_id, created_at
         FROM usuarios
         WHERE id = $1`, [id]
            );
            if (result.rowCount === 0) return { estado: 'error', resultado: null };
            return { estado: 'ok', resultado: result.rows[0] };
        } catch (error) {
            console.error('Error al buscar usuario por ID:', error.message);
            return { estado: 'error', resultado: null };
        }
    }
}