// src/infraestructura/adaptador-salida/HistorialClinicoPgsQueryAdaptador.js
import HistorialClinicoSalidaQueryPuerto from '../../aplicacion/puertos/salida/HistorialClinicoSalidaQueryPuerto.js';
import pool from '../base-dato/Postgresql.js';

export default class HistorialClinicoPgsQueryAdaptador extends HistorialClinicoSalidaQueryPuerto {

  async listaPorCliente(clienteId) {
    const sql = `
      SELECT * FROM historial_clinico
      WHERE cliente_id = $1
      ORDER BY created_at DESC`;
    try {
      const { rows } = await pool.query(sql, [clienteId]);
      return { estado: 'ok', resultado: rows };
    } catch (error) {
      console.error('Error lista historial:', error.message);
      return { estado: 'error', resultado: [] };
    }
  }

  async buscarPorId(id) {
    const sql = 'SELECT * FROM historial_clinico WHERE id = $1';
    try {
      const { rows } = await pool.query(sql, [id]);
      if (rows.length === 0) return { estado: 'error', resultado: null };
      return { estado: 'ok', resultado: rows[0] };
    } catch (error) {
      console.error('Error buscar historial:', error.message);
      return { estado: 'error', resultado: null };
    }
  }
}
