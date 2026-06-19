// src/infraestructura/adaptador-salida/CobroDeudaPgsQueryAdaptador.js
import CobroDeudaQuerySalidaPuerto from '../../aplicacion/puertos/salida/CobroDeudaQuerySalidaPuerto.js';
import pool from '../base-dato/Postgresql.js';

/**
 * Adaptador de Query para Cobro de Deuda (PostgreSQL)
 * Implementa las consultas de facturas pendientes y abonos
 */
export default class CobroDeudaPgsQueryAdaptador extends CobroDeudaQuerySalidaPuerto {

  /**
   * Obtiene todas las facturas pendientes de pago
   * Filtros: clienteId, buscar, fechaDesde, fechaHasta, estado
   */
  async facturasPendientes(clienteId = null, filtros = {}) {
    try {
      const params = [];
      const where = ["f.estado_pago = 'PENDIENTE'", "f.saldo_pendiente > 0"];

      if (clienteId) {
        params.push(clienteId);
        where.push(`f.cliente_id = $${params.length}`);
      }

      if (filtros.buscar) {
        const term = `%${filtros.buscar}%`;
        params.push(term, term, term);
        const n = params.length;
        where.push(`(f.id_personalizado ILIKE $${n-2} OR (c.nombres||' '||c.apellidos) ILIKE $${n-1} OR c.cedula ILIKE $${n})`);
      }

      if (filtros.fechaDesde) {
        params.push(filtros.fechaDesde);
        where.push(`f.created_at::date >= $${params.length}`);
      }

      if (filtros.fechaHasta) {
        params.push(filtros.fechaHasta);
        where.push(`f.created_at::date <= $${params.length}`);
      }

      const sql = `
        SELECT f.*,
               f.estado_pago AS estado,
               f.tipo_venta AS tipo,
               c.nombres || ' ' || c.apellidos AS cliente_nombre_completo,
               c.cedula,
               c.telefono,
               c.email,
               u.nombre AS usuario_nombre,
               (SELECT COUNT(*) FROM facturas_deudas WHERE factura_id = f.id) AS cantidad_abonos,
               (SELECT COALESCE(SUM(monto_pagado), 0) FROM facturas_deudas WHERE factura_id = f.id) AS total_abonado
        FROM facturas f
        JOIN clientes c ON c.id = f.cliente_id
        LEFT JOIN usuarios u ON u.id = f.usuario_id
        ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
        ORDER BY f.created_at DESC
        LIMIT 500
      `;

      const { rows } = await pool.query(sql, params);
      return { estado: 'ok', resultado: rows };
    } catch (error) {
      console.error('Error facturasPendientes:', error.message);
      return { estado: 'error', resultado: 'Error al obtener facturas pendientes' };
    }
  }

  /**
   * Obtiene todos los abonos de una factura específica
   */
  async abonosPorFactura(facturaId) {
    try {
      const { rows } = await pool.query(
        `SELECT fd.*,
                u.nombre || ' ' || u.apellido AS usuario_nombre,
                f.id_personalizado AS factura_id_personalizado
         FROM facturas_deudas fd
         LEFT JOIN usuarios u ON u.id = fd.usuario_id
         LEFT JOIN facturas f ON f.id = fd.factura_id
         WHERE fd.factura_id = $1
         ORDER BY fd.fecha_pago DESC`,
        [facturaId]
      );
      return { estado: 'ok', resultado: rows };
    } catch (error) {
      console.error('Error abonosPorFactura:', error.message);
      return { estado: 'error', resultado: 'Error al obtener abonos de la factura' };
    }
  }

  /**
   * Obtiene un abono específico
   */
  async abonoPorId(id) {
    try {
      const { rows } = await pool.query(
        `SELECT fd.*,
                u.nombre || ' ' || u.apellido AS usuario_nombre,
                f.id_personalizado AS factura_id_personalizado,
                f.cliente_nombre,
                c.telefono,
                c.email
         FROM facturas_deudas fd
         LEFT JOIN usuarios u ON u.id = fd.usuario_id
         LEFT JOIN facturas f ON f.id = fd.factura_id
         LEFT JOIN clientes c ON c.id = fd.cliente_id
         WHERE fd.id = $1`,
        [id]
      );
      if (rows.length === 0)
        return { estado: 'error', resultado: 'Abono no encontrado' };
      return { estado: 'ok', resultado: rows[0] };
    } catch (error) {
      console.error('Error abonoPorId:', error.message);
      return { estado: 'error', resultado: 'Error al obtener el abono' };
    }
  }

  /**
   * Resumen de deuda de un cliente
   */
  async resumenClienteDeuda(clienteId) {
    try {
      const { rows } = await pool.query(
        `SELECT
           COUNT(CASE WHEN f.estado_pago = 'PENDIENTE' THEN 1 END) AS facturas_pendientes,
           COALESCE(SUM(CASE WHEN f.estado_pago = 'PENDIENTE' THEN f.total ELSE 0 END), 0) AS monto_total_deuda,
           COALESCE(SUM(CASE WHEN f.estado_pago = 'PENDIENTE' THEN f.abonado ELSE 0 END), 0) AS monto_total_pagado,
           COALESCE(SUM(CASE WHEN f.estado_pago = 'PENDIENTE' THEN f.saldo_pendiente ELSE 0 END), 0) AS monto_saldo_pendiente,
           (SELECT COUNT(*) FROM facturas_deudas WHERE cliente_id = $1) AS total_abonos_registrados,
           (SELECT MAX(fecha_pago) FROM facturas_deudas WHERE cliente_id = $1) AS ultimo_abono_fecha,
           (SELECT SUM(monto_pagado) FROM facturas_deudas WHERE cliente_id = $1) AS total_cobrado
         FROM facturas f
         WHERE f.cliente_id = $1`,
        [clienteId]
      );
      return { estado: 'ok', resultado: rows[0] };
    } catch (error) {
      console.error('Error resumenClienteDeuda:', error.message);
      return { estado: 'error', resultado: 'Error al obtener resumen de deuda' };
    }
  }

  /**
   * Lista general de abonos con filtros
   */
  async listaAbonos(filtros = {}) {
    try {
      const params = [];
      const where = [];

      if (filtros.clienteId) {
        params.push(filtros.clienteId);
        where.push(`fd.cliente_id = $${params.length}`);
      }

      if (filtros.fechaDesde) {
        params.push(filtros.fechaDesde);
        where.push(`fd.fecha_pago::date >= $${params.length}`);
      }

      if (filtros.fechaHasta) {
        params.push(filtros.fechaHasta);
        where.push(`fd.fecha_pago::date <= $${params.length}`);
      }

      if (filtros.metodoPago) {
        params.push(filtros.metodoPago);
        where.push(`fd.metodo_pago = $${params.length}`);
      }

      if (filtros.buscar) {
        const term = `%${filtros.buscar}%`;
        params.push(term, term);
        const n = params.length;
        where.push(`(fd.cliente_nombre ILIKE $${n-1} OR f.id_personalizado ILIKE $${n})`);
      }

      const sql = `
        SELECT fd.*,
               u.nombre || ' ' || u.apellido AS usuario_nombre,
               f.id_personalizado AS factura_id_personalizado,
               (SELECT total FROM facturas WHERE id = fd.factura_id) AS factura_total
         FROM facturas_deudas fd
         LEFT JOIN usuarios u ON u.id = fd.usuario_id
         LEFT JOIN facturas f ON f.id = fd.factura_id
         ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
         ORDER BY fd.fecha_pago DESC
         LIMIT 1000
      `;

      const { rows } = await pool.query(sql, params);
      return { estado: 'ok', resultado: rows };
    } catch (error) {
      console.error('Error listaAbonos:', error.message);
      return { estado: 'error', resultado: 'Error al obtener lista de abonos' };
    }
  }

  /**
   * Obtiene facturas pendientes paginadas (ordenadas por fecha DESC)
   * Para carga inicial sin cliente seleccionado en Cobrar Deuda
   */
  async deudasPaginadas(offset = 0, limite = 5) {
    try {
      // Obtener total de facturas pendientes
      const { rows: [{ total_count }] } = await pool.query(`
        SELECT COUNT(*) as total_count
        FROM facturas
        WHERE estado_pago = 'PENDIENTE' AND saldo_pendiente > 0
      `);

      // Obtener facturas paginadas
      const { rows } = await pool.query(`
        SELECT
          f.*,
          c.nombres as cliente_nombres,
          c.apellidos as cliente_apellidos,
          c.telefono as cliente_telefono,
          c.email as cliente_email
        FROM facturas f
        LEFT JOIN clientes c ON c.id = f.cliente_id
        WHERE f.estado_pago = 'PENDIENTE' AND f.saldo_pendiente > 0
        ORDER BY f.fecha DESC, f.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limite, offset]);

      return {
        estado: 'ok',
        resultado: rows,
        total: parseInt(total_count),
        offset,
        limite,
      };
    } catch (error) {
      console.error('Error deudasPaginadas:', error.message);
      return { estado: 'error', resultado: 'Error al obtener deudas paginadas' };
    }
  }
}
