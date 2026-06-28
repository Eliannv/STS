// src/infraestructura/adaptador-salida/FacturaPgsQueryAdaptador.js
import FacturaSalidaQueryPuerto from '../../aplicacion/puertos/salida/FacturaSalidaQueryPuerto.js';
import pool from '../base-dato/Postgresql.js';

export default class FacturaPgsQueryAdaptador extends FacturaSalidaQueryPuerto {

    async listaPorCliente(clienteId) {
        try {
            const { rows } = await pool.query(`
        SELECT f.*,
               f.estado_pago  AS estado,
               f.tipo_venta   AS tipo,
               u.nombre || ' ' || u.apellido AS usuario_nombre
        FROM facturas f
        LEFT JOIN usuarios u ON u.id = f.usuario_id
        WHERE f.cliente_id = $1 AND f.deleted_at IS NULL
        ORDER BY f.created_at DESC
      `, [clienteId]);
            return { estado: 'ok', resultado: rows };
        } catch (error) {
            console.error('Error listaPorCliente facturas:', error.message);
            return { estado: 'error', resultado: 'Error al obtener facturas del cliente' };
        }
    }

    async buscarPorId(id) {
        try {
            const { rows } = await pool.query(`
        SELECT f.*,
               f.estado_pago  AS estado,
               f.tipo_venta   AS tipo,
               u.nombre || ' ' || u.apellido AS usuario_nombre
        FROM facturas f
        LEFT JOIN usuarios u ON u.id = f.usuario_id
        WHERE f.id = $1 AND f.deleted_at IS NULL
      `, [id]);
            if (rows.length === 0) return { estado: 'error', resultado: 'Factura no encontrada' };
            return { estado: 'ok', resultado: rows[0] };
        } catch (error) {
            console.error('Error buscarPorId factura:', error.message);
            return { estado: 'error', resultado: 'Error al buscar la factura' };
        }
    }

    async resumenPorCliente(clienteId) {
        try {
            const { rows } = await pool.query(`
        SELECT
          COALESCE(SUM(total), 0)                AS total_facturado,
          COALESCE(SUM(abonado), 0)              AS total_pagado,
          COALESCE(SUM(saldo_pendiente), 0)      AS deuda_total,
          COUNT(*)                               AS cantidad_facturas,
          MAX(created_at)                        AS ultima_factura,
          CASE WHEN COUNT(*) > 0 THEN ROUND(AVG(total), 2) ELSE 0 END AS promedio_compra
        FROM facturas
        WHERE cliente_id = $1 AND deleted_at IS NULL
      `, [clienteId]);
            return { estado: 'ok', resultado: rows[0] };
        } catch (error) {
            console.error('Error resumenPorCliente facturas:', error.message);
            return { estado: 'error', resultado: 'Error al obtener resumen financiero' };
        }
    }

    async listaGeneral({ buscar, estado, tipo, fechaDesde, fechaHasta } = {}) {
        try {
            const params = [];
            const where = [];
            if (buscar) {
                const term = `%${buscar}%`;
                params.push(term);
                const n = params.length;
                where.push(`(f.id_personalizado ILIKE $${n} OR (c.nombres||' '||c.apellidos) ILIKE $${n} OR c.cedula ILIKE $${n})`);
            }
            if (estado) { params.push(estado);
                where.push(`f.estado_pago = $${params.length}`); }
            if (tipo) { params.push(tipo);
                where.push(`f.tipo_venta = $${params.length}`); }
            if (fechaDesde) { params.push(fechaDesde);
                where.push(`f.created_at::date >= $${params.length}`); }
            if (fechaHasta) { params.push(fechaHasta);
                where.push(`f.created_at::date <= $${params.length}`); }
            const sql = `
        SELECT f.*,
               f.estado_pago  AS estado,
               f.tipo_venta   AS tipo,
               c.nombres || ' ' || c.apellidos AS cliente_nombre,
               c.cedula,
               u.nombre AS usuario_nombre
        FROM facturas f
        JOIN clientes c ON c.id = f.cliente_id
        LEFT JOIN usuarios u ON u.id = f.usuario_id
        WHERE f.deleted_at IS NULL${where.length ? ' AND ' + where.join(' AND ') : ''}
        ORDER BY f.created_at DESC
        LIMIT 300
      `;
            const { rows } = await pool.query(sql, params);
            return { estado: 'ok', resultado: rows };
        } catch (error) {
            console.error('Error listaGeneral facturas:', error.message);
            return { estado: 'error', resultado: 'Error al obtener lista de facturas' };
        }
    }
}