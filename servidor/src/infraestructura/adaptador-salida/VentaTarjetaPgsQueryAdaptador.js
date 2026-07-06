// src/infraestructura/adaptador-salida/VentaTarjetaPgsQueryAdaptador.js
import VentaTarjetaSalidaQueryPuerto from '../../aplicacion/puertos/salida/VentaTarjetaSalidaQueryPuerto.js';
import pool from '../base-dato/Postgresql.js';

/**
 * Adaptador de Query para Ventas con Tarjeta (PostgreSQL)
 * Implementa las consultas de ventas tarjeta y abonos
 */
export default class VentaTarjetaPgsQueryAdaptador extends VentaTarjetaSalidaQueryPuerto {

  /**
   * Lista ventas con tarjeta con filtros y ordenamiento
   * Filtros: estado, buscar, fechaDesde, fechaHasta, clienteId, banco
   */
  async listarVentasTarjeta(filtros = {}) {
    try {
      const params = [];
      const where = [];

      if (filtros.estado) {
        params.push(filtros.estado);
        where.push(`vt.estado = $${params.length}`);
      }

      if (filtros.clienteId) {
        params.push(filtros.clienteId);
        where.push(`vt.cliente_id = $${params.length}`);
      }

      if (filtros.buscar) {
        const term = `%${filtros.buscar}%`;
        params.push(term, term, term);
        const n = params.length;
        where.push(`(vt.factura_id_personalizado ILIKE $${n-2} OR vt.cliente_nombre ILIKE $${n-1} OR c.cedula ILIKE $${n})`);
      }

      if (filtros.banco) {
        params.push(filtros.banco);
        where.push(`vt.banco ILIKE $${params.length}`);
      }

      if (filtros.fechaDesde) {
        params.push(filtros.fechaDesde);
        where.push(`vt.fecha_venta::date >= $${params.length}`);
      }

      if (filtros.fechaHasta) {
        params.push(filtros.fechaHasta);
        where.push(`vt.fecha_venta::date <= $${params.length}`);
      }

      // Ordenamiento
      const orden = filtros.orden || 'fecha_venta DESC';

      const sql = `
        SELECT vt.*,
               (SELECT COUNT(*) FROM abonos_ventas_tarjeta WHERE venta_tarjeta_id = vt.id) AS cantidad_abonos,
               (SELECT COALESCE(SUM(monto), 0) FROM abonos_ventas_tarjeta WHERE venta_tarjeta_id = vt.id) AS total_abonado_verificado
        FROM ventas_tarjeta vt
        ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
        ORDER BY vt.${orden}
        LIMIT 500
      `;

      const { rows } = await pool.query(sql, params);
      return { estado: 'ok', resultado: rows };
    } catch (error) {
      console.error('Error listarVentasTarjeta:', error.message);
      return { estado: 'error', resultado: 'Error al obtener ventas tarjeta' };
    }
  }

  /**
   * Obtiene detalle de una venta tarjeta
   */
  async obtenerVentaTarjeta(id) {
    try {
      const { rows } = await pool.query(
        `SELECT vt.*,
                (SELECT COUNT(*) FROM abonos_ventas_tarjeta WHERE venta_tarjeta_id = vt.id) AS cantidad_abonos,
                (SELECT COALESCE(SUM(monto), 0) FROM abonos_ventas_tarjeta WHERE venta_tarjeta_id = vt.id) AS total_abonado_verificado
         FROM ventas_tarjeta vt
         WHERE vt.id = $1`,
        [id]
      );

      if (rows.length === 0)
        return { estado: 'error', resultado: 'Venta tarjeta no encontrada' };

      return { estado: 'ok', resultado: rows[0] };
    } catch (error) {
      console.error('Error obtenerVentaTarjeta:', error.message);
      return { estado: 'error', resultado: 'Error al obtener venta tarjeta' };
    }
  }

  /**
   * Obtiene historial de abonos de una venta tarjeta
   */
  async historialAbonos(ventaTarjetaId) {
    try {
      const { rows } = await pool.query(
        `SELECT avt.*,
                vt.factura_id_personalizado,
                vt.cliente_nombre,
                vt.monto_total,
                vt.monto_recibido,
                vt.saldo_pendiente,
                vt.estado
         FROM abonos_ventas_tarjeta avt
         LEFT JOIN ventas_tarjeta vt ON vt.id = avt.venta_tarjeta_id
         WHERE avt.venta_tarjeta_id = $1
         ORDER BY avt.fecha DESC`,
        [ventaTarjetaId]
      );

      return { estado: 'ok', resultado: rows };
    } catch (error) {
      console.error('Error historialAbonos:', error.message);
      return { estado: 'error', resultado: 'Error al obtener historial de abonos' };
    }
  }

  /**
   * Obtiene resumen de ventas tarjeta (totales, pendientes, liquidadas)
   */
  async resumenVentasTarjeta() {
    try {
      const { rows } = await pool.query(
        `SELECT 
           COUNT(*) AS total_ventas,
           SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) AS vendidas_pendientes,
           SUM(CASE WHEN estado = 'LIQUIDADA' THEN 1 ELSE 0 END) AS vendidas_liquidadas,
           COALESCE(SUM(monto_total), 0) AS monto_total,
           COALESCE(SUM(monto_recibido), 0) AS monto_recibido,
           COALESCE(SUM(saldo_pendiente), 0) AS saldo_pendiente_total
         FROM ventas_tarjeta`
      );

      return { estado: 'ok', resultado: rows[0] };
    } catch (error) {
      console.error('Error resumenVentasTarjeta:', error.message);
      return { estado: 'error', resultado: 'Error al obtener resumen' };
    }
  }
}
