// src/infraestructura/adaptador-salida/ProveedorPgsQueryAdaptador.js
import ProveedorSalidaQueryPuerto from '../../aplicacion/puertos/salida/ProveedorSalidaQueryPuerto.js';
import pool from '../base-dato/Postgresql.js';

export default class ProveedorPgsQueryAdaptador extends ProveedorSalidaQueryPuerto {

  async lista(buscar) {
    let sql   = 'SELECT * FROM proveedores WHERE activo = true';
    const params = [];

    if (buscar) {
      params.push(`%${buscar}%`);
      sql += ` AND (nombre ILIKE $1 OR ruc ILIKE $1 OR contacto_nombre ILIKE $1)`;
    }

    sql += ' ORDER BY nombre ASC';

    try {
      const { rows } = await pool.query(sql, params);
      return { estado: 'ok', resultado: rows };
    } catch (error) {
      console.error('Error lista proveedores:', error.message);
      return { estado: 'error', resultado: [] };
    }
  }

  async buscarPorId(id) {
    const sql = 'SELECT * FROM proveedores WHERE id = $1 AND activo = true';
    try {
      const { rows } = await pool.query(sql, [id]);
      if (rows.length === 0) return { estado: 'error', resultado: null };
      return { estado: 'ok', resultado: rows[0] };
    } catch (error) {
      console.error('Error buscar proveedor:', error.message);
      return { estado: 'error', resultado: null };
    }
  }
}
