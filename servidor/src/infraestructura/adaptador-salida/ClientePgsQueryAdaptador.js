// src/infraestructura/adaptador-salida/ClientePgsQueryAdaptador.js
import ClienteSalidaQueryPuerto from '../../aplicacion/puertos/salida/ClienteSalidaQueryPuerto.js';
import postgresql from '../base-dato/Postgresql.js';

export default class ClientePgsQueryAdaptador extends ClienteSalidaQueryPuerto {

    lista = async(buscar, { limit = 20, offset = 0 } = {}) => {
        try {
            let query = `
        SELECT id, nombres, apellidos, cedula, telefono, email,
               fecha_nacimiento, direccion, pais, provincia, ciudad,
               activo, tiene_historial_clinico, tiene_credito,
               tiene_deuda, es_consumidor_final, created_at
        FROM clientes
        WHERE activo = true
      `;
            const params = [];

            if (buscar) {
                params.push(`%${buscar}%`);
                query += ` AND (
          nombres   ILIKE $${params.length} OR
          apellidos ILIKE $${params.length} OR
          cedula    ILIKE $${params.length} OR
          telefono  ILIKE $${params.length}
        )`;
            }

            query += ` ORDER BY apellidos ASC, nombres ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limit + 1, offset);

            const result = await postgresql.query(query, params);
            return { estado: 'ok', resultado: result.rows };
        } catch (error) {
            console.error('Error al listar clientes:', error.message);
            return { estado: 'error', resultado: [] };
        }
    }

    buscarPorId = async(id) => {
        try {
            const result = await postgresql.query(
                `SELECT id, nombres, apellidos, cedula, telefono, email,
                fecha_nacimiento, direccion, pais, provincia, ciudad,
                activo, tiene_historial_clinico, tiene_credito,
                tiene_deuda, es_consumidor_final, created_at
         FROM clientes
         WHERE id = $1`, [id]
            );
            if (result.rowCount === 0) return { estado: 'error', resultado: null };
            return { estado: 'ok', resultado: result.rows[0] };
        } catch (error) {
            console.error('Error al buscar cliente por ID:', error.message);
            return { estado: 'error', resultado: null };
        }
    }
}