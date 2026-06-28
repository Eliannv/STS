// src/infraestructura/adaptador-salida/CajaBancoPgsQueryAdaptador.js
import CajaBancoSalidaQueryPuerto from '../../aplicacion/puertos/salida/CajaBancoSalidaQueryPuerto.js';
import pool from '../base-dato/Postgresql.js';

export default class CajaBancoPgsQueryAdaptador extends CajaBancoSalidaQueryPuerto {

    /** Lista de cajas banco con filtros opcionales */
    async lista(filtros = {}) {
        try {
            const { estado, fechaDesde, fechaHasta, limit = 20, offset = 0 } = filtros;
            const condiciones = [`cb.activo = TRUE`];
            const valores = [];

            if (estado) {
                valores.push(estado);
                condiciones.push(`cb.estado = $${valores.length}`);
            }
            if (fechaDesde) {
                valores.push(fechaDesde);
                condiciones.push(`cb.fecha >= $${valores.length}`);
            }
            if (fechaHasta) {
                valores.push(fechaHasta);
                condiciones.push(`cb.fecha <= $${valores.length}`);
            }

            valores.push(limit + 1, offset);
            const where = condiciones.join(' AND ');
            const { rows } = await pool.query(`
        SELECT cb.*
        FROM cajas_banco cb
        WHERE ${where}
        ORDER BY cb.created_at DESC
        LIMIT $${valores.length - 1} OFFSET $${valores.length}
      `, valores);

            return { estado: 'ok', resultado: rows };
        } catch (error) {
            console.error('Error lista cajas banco:', error.message);
            return { estado: 'error', resultado: 'Error al obtener las cajas banco' };
        }
    }

    /** Obtiene una caja banco por id con resumen financiero */
    async buscarPorId(id) {
        try {
            const { rows: [caja] } = await pool.query(
                `SELECT * FROM cajas_banco WHERE id = $1 AND activo = TRUE`, [id]
            );
            if (!caja) return { estado: 'error', resultado: 'Caja banco no encontrada' };

            const { rows: [resumen] } = await pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN tipo = 'INGRESO' THEN monto ELSE 0 END), 0) AS total_ingresos,
          COALESCE(SUM(CASE WHEN tipo = 'EGRESO'  THEN monto ELSE 0 END), 0) AS total_egresos,
          COUNT(*) AS cantidad_movimientos
        FROM movimientos_cajas_banco
        WHERE caja_banco_id = $1
      `, [id]);

            return { estado: 'ok', resultado: {...caja, resumen } };
        } catch (error) {
            console.error('Error buscarPorId caja banco:', error.message);
            return { estado: 'error', resultado: 'Error al obtener la caja banco' };
        }
    }

    /** Retorna la última caja banco con estado ABIERTA, o null */
    async cajaAbierta() {
        try {
            const { rows: [caja] } = await pool.query(`
        SELECT * FROM cajas_banco
        WHERE estado = 'ABIERTA' AND activo = TRUE
        ORDER BY created_at DESC
        LIMIT 1
      `);
            return { estado: 'ok', resultado: caja || null };
        } catch (error) {
            console.error('Error cajaAbierta caja banco:', error.message);
            return { estado: 'error', resultado: 'Error al buscar la caja abierta' };
        }
    }

    /** Busca cajas banco por mes (YYYY-MM) — retorna array */
    async buscarPorMes(mes) {
        try {
            const { rows } = await pool.query(`
        SELECT * FROM cajas_banco
        WHERE DATE_TRUNC('month', fecha)::date = DATE_TRUNC('month', $1::date)::date AND activo = TRUE
        ORDER BY created_at DESC
      `, [mes + '-01']);
            return rows;
        } catch (error) {
            console.error('Error buscarPorMes caja banco:', error.message);
            return [];
        }
    }

    /** Lista movimientos de una caja banco, ordenados del más reciente al más antiguo */
    async listarMovimientos(cajaId) {
        try {
            const { rows } = await pool.query(`
        SELECT * FROM movimientos_cajas_banco
        WHERE caja_banco_id = $1
        ORDER BY fecha DESC, id DESC
      `, [cajaId]);
            return { estado: 'ok', resultado: rows };
        } catch (error) {
            console.error('Error listarMovimientos caja banco:', error.message);
            return { estado: 'error', resultado: 'Error al obtener los movimientos' };
        }
    }

    /** Busca movimientos relacionados a una venta por venta_id */
    async buscarMovimientoPorVentaId(ventaId) {
        try {
            const { rows } = await pool.query(`
        SELECT * FROM movimientos_cajas_banco
        WHERE venta_id = $1
        ORDER BY created_at DESC
      `, [ventaId]);
            return { estado: 'ok', resultado: rows };
        } catch (error) {
            console.error('Error buscarMovimientoPorVentaId:', error.message);
            return { estado: 'error', resultado: 'Error al buscar movimientos de la venta' };
        }
    }
}