// src/infraestructura/adaptador-salida/CajaChicaPgsQueryAdaptador.js
import CajaChicaSalidaQueryPuerto from '../../aplicacion/puertos/salida/CajaChicaSalidaQueryPuerto.js';
import pool from '../base-dato/Postgresql.js';

export default class CajaChicaPgsQueryAdaptador extends CajaChicaSalidaQueryPuerto {

  /** Lista de cajas chicas con filtros opcionales */
  async lista(filtros = {}) {
    try {
      const condiciones = [`cc.activo = TRUE`];
      const valores = [];

      if (filtros.estado) {
        valores.push(filtros.estado);
        condiciones.push(`cc.estado = $${valores.length}`);
      }
      if (filtros.fechaDesde) {
        valores.push(filtros.fechaDesde);
        condiciones.push(`cc.fecha >= $${valores.length}`);
      }
      if (filtros.fechaHasta) {
        valores.push(filtros.fechaHasta);
        condiciones.push(`cc.fecha <= $${valores.length}`);
      }

      const where = condiciones.join(' AND ');
      const { rows } = await pool.query(`
        SELECT
          cc.*,
          cb.id AS caja_banco_id_ref
        FROM cajas_chicas cc
        LEFT JOIN cajas_banco cb ON cc.caja_banco_id = cb.id
        WHERE ${where}
        ORDER BY cc.created_at DESC
      `, valores);

      return { estado: 'ok', resultado: rows };
    } catch (error) {
      console.error('Error lista cajas chicas:', error.message);
      return { estado: 'error', resultado: 'Error al obtener las cajas chicas' };
    }
  }

  /** Obtiene una caja por id junto con el resumen de movimientos */
  async buscarPorId(id) {
    try {
      const { rows: [caja] } = await pool.query(
        `SELECT * FROM cajas_chicas WHERE id = $1 AND activo = TRUE`, [id]
      );
      if (!caja) return { estado: 'error', resultado: 'Caja chica no encontrada' };

      // Resumen financiero
      const { rows: [resumen] } = await pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN tipo = 'INGRESO' THEN monto ELSE 0 END), 0) AS total_ingresos,
          COALESCE(SUM(CASE WHEN tipo = 'EGRESO'  THEN monto ELSE 0 END), 0) AS total_egresos,
          COUNT(*) AS cantidad_movimientos
        FROM movimientos_cajas_chicas
        WHERE caja_chica_id = $1
      `, [id]);

      return { estado: 'ok', resultado: { ...caja, resumen } };
    } catch (error) {
      console.error('Error buscarPorId caja chica:', error.message);
      return { estado: 'error', resultado: 'Error al obtener la caja chica' };
    }
  }

  /** Retorna la última caja chica con estado ABIERTA, o null */
  async cajaAbierta() {
    try {
      const { rows: [caja] } = await pool.query(`
        SELECT * FROM cajas_chicas
        WHERE estado = 'ABIERTA' AND activo = TRUE
        ORDER BY created_at DESC
        LIMIT 1
      `);
      return { estado: 'ok', resultado: caja || null };
    } catch (error) {
      console.error('Error cajaAbierta caja chica:', error.message);
      return { estado: 'error', resultado: 'Error al buscar la caja abierta' };
    }
  }

  /** Lista movimientos de una caja chica, ordenados del más reciente al más antiguo */
  async listarMovimientos(cajaId) {
    try {
      const { rows } = await pool.query(`
        SELECT * FROM movimientos_cajas_chicas
        WHERE caja_chica_id = $1
        ORDER BY fecha DESC, id DESC
      `, [cajaId]);
      return { estado: 'ok', resultado: rows };
    } catch (error) {
      console.error('Error listarMovimientos caja chica:', error.message);
      return { estado: 'error', resultado: 'Error al obtener los movimientos' };
    }
  }
}
