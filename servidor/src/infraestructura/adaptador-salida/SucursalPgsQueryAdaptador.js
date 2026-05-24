// src/infraestructura/adaptador-salida/SucursalPgsQueryAdaptador.js
import SucursalSalidaQueryPuerto from '../../aplicacion/puertos/salida/SucursalSalidaQueryPuerto.js';
import postgresql from '../base-dato/Postgresql.js';

export default class SucursalPgsQueryAdaptador extends SucursalSalidaQueryPuerto {

  lista = async () => {
    try {
      const result = await postgresql.query(
        `SELECT id, codigo, nombre, activo, direccion, telefono, fecha_creacion
         FROM sucursales
         ORDER BY nombre ASC`
      );
      return { estado: 'ok', resultado: result.rows };
    } catch (error) {
      console.error('Error al listar sucursales:', error.message);
      return { estado: 'error', resultado: [] };
    }
  }

  buscarPorId = async (id) => {
    try {
      const result = await postgresql.query(
        `SELECT id, codigo, nombre, activo, direccion, telefono, fecha_creacion
         FROM sucursales
         WHERE id = $1`,
        [id]
      );
      if (result.rowCount === 0) return { estado: 'error', resultado: null };
      return { estado: 'ok', resultado: result.rows[0] };
    } catch (error) {
      console.error('Error al buscar sucursal por ID:', error.message);
      return { estado: 'error', resultado: null };
    }
  }
}
