// src/infraestructura/adaptador-salida/ProductoPgsQueryAdaptador.js
import ProductoSalidaQueryPuerto from '../../aplicacion/puertos/salida/ProductoSalidaQueryPuerto.js';
import pool from '../base-dato/Postgresql.js';

export default class ProductoPgsQueryAdaptador extends ProductoSalidaQueryPuerto {

  async lista(buscar, sucursalId) {
    const params  = [];
    const filtros = ['p.activo = true'];

    if (buscar) {
      params.push(`%${buscar}%`);
      filtros.push(`(p.nombre ILIKE $${params.length} OR p.codigo ILIKE $${params.length} OR p.grupo ILIKE $${params.length})`);
    }

    const whereClause = filtros.join(' AND ');

    const sql = `
      SELECT p.*, pr.nombre AS proveedor_nombre
      FROM productos p
      LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
      WHERE ${whereClause}
      ORDER BY p.codigo ASC NULLS LAST, p.created_at DESC`;

    try {
      const { rows } = await pool.query(sql, params);
      return { estado: 'ok', resultado: rows };
    } catch (error) {
      console.error('Error lista productos:', error.message);
      return { estado: 'error', resultado: [] };
    }
  }

  async buscarPorId(id) {
    const sql = `
      SELECT p.*, pr.nombre AS proveedor_nombre
      FROM productos p
      LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
      WHERE p.id = $1 AND p.activo = true`;
    try {
      const { rows } = await pool.query(sql, [id]);
      if (rows.length === 0) return { estado: 'error', resultado: null };
      return { estado: 'ok', resultado: rows[0] };
    } catch (error) {
      console.error('Error buscar producto:', error.message);
      return { estado: 'error', resultado: null };
    }
  }
}
