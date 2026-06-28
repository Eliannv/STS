// src/infraestructura/adaptador-salida/IngresoPgsQueryAdaptador.js
import IngresoSalidaQueryPuerto from '../../aplicacion/puertos/salida/IngresoSalidaQueryPuerto.js';
import pool from '../base-dato/Postgresql.js';

export default class IngresoPgsQueryAdaptador extends IngresoSalidaQueryPuerto {

    async lista(buscar, estado, fechaDesde, fechaHasta, { limit = 10, offset = 0 } = {}) {
        let sql = `
      SELECT
        i.*,
        (SELECT COUNT(*)::int FROM detalle_ingresos di WHERE di.ingreso_id = i.id) AS cantidad_detalles,
        (SELECT COALESCE(SUM(di.stock_ingresado), 0)::int FROM detalle_ingresos di WHERE di.ingreso_id = i.id) AS total_items
      FROM ingresos i
      WHERE 1=1`;
        const params = [];

        if (buscar) {
            params.push(`%${buscar}%`);
            sql += ` AND (i.numero_factura ILIKE $${params.length} OR i.proveedor_nombre ILIKE $${params.length} OR i.id_personalizado::text ILIKE $${params.length})`;
        }
        if (estado) {
            params.push(estado);
            sql += ` AND i.estado = $${params.length}`;
        }
        if (fechaDesde) {
            params.push(fechaDesde);
            sql += ` AND i.fecha >= $${params.length}`;
        }
        if (fechaHasta) {
            params.push(fechaHasta);
            sql += ` AND i.fecha <= $${params.length}`;
        }

        sql += ` ORDER BY i.fecha DESC, i.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit + 1, offset);

        try {
            const { rows } = await pool.query(sql, params);
            return { estado: 'ok', resultado: rows };
        } catch (error) {
            console.error('Error lista ingresos:', error.message);
            return { estado: 'error', resultado: [] };
        }
    }

    async buscarPorId(id) {
        try {
            const { rows: ingresos } = await pool.query(
                'SELECT * FROM ingresos WHERE id = $1', [id]
            );
            if (ingresos.length === 0) return { estado: 'error', resultado: null };

            const { rows: detalles } = await pool.query(
                'SELECT * FROM detalle_ingresos WHERE ingreso_id = $1 ORDER BY id', [id]
            );

            return { estado: 'ok', resultado: {...ingresos[0], detalles } };
        } catch (error) {
            console.error('Error buscar ingreso por id:', error.message);
            return { estado: 'error', resultado: null };
        }
    }
}