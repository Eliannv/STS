// src/infraestructura/adaptador-salida/FacturaPgsCommandAdaptador.js
import FacturaSalidaCommandPuerto from '../../aplicacion/puertos/salida/FacturaSalidaCommandPuerto.js';
import pool from '../base-dato/Postgresql.js';

export default class FacturaPgsCommandAdaptador extends FacturaSalidaCommandPuerto {

  async guardar(venta) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const esCredito = venta.tipo === 'CREDITO';
      const abonado   = Math.max(0, (venta.total ?? 0) - (venta.saldoPendiente ?? 0));

      const { rows: [facturaCreada] } = await client.query(`
        INSERT INTO facturas
          (cliente_id, cliente_nombre, metodo_pago, tipo_venta, estado_pago,
           subtotal, total, saldo_pendiente, abonado, es_credito, observacion, usuario_id,
           historial_clinico_id, fecha_pago, items)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *, estado_pago AS estado, tipo_venta AS tipo
      `, [
        venta.clienteId, venta.nombreCliente, venta.metodoPago || 'EFECTIVO',
        venta.tipo, venta.estado || 'PENDIENTE',
        venta.subtotal, venta.total, venta.saldoPendiente,
        abonado, esCredito, venta.observacion, venta.usuarioId,
        venta.historialClinicoId || null,
        venta.fechaPago || null,
        JSON.stringify(venta.items || []),
      ]);

      // Deducir stock de productos vendidos
      for (const item of (venta.items || [])) {
        if (item.id && !item.esServicio) {
          await client.query(
            `UPDATE productos SET stock = GREATEST(0, stock - $1) WHERE id = $2`,
            [parseInt(item.cantidad) || 1, item.id]
          );
        }
      }

      // Registrar pago inicial en facturas_deudas si hay abonado > 0
      if (abonado > 0 && venta.saldoPendiente >= 0) {
        await client.query(`
          INSERT INTO facturas_deudas
            (factura_id, factura_id_personalizado, cliente_id, cliente_nombre,
             metodo_pago, fecha_pago, monto_pagado, total_factura, saldo_restante,
             usuario_id, es_credito, estado_pago)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          facturaCreada.id,
          facturaCreada.id_personalizado,
          venta.clienteId,
          venta.nombreCliente,
          venta.metodoPago || 'EFECTIVO',
          venta.fechaPago || new Date(),
          abonado,
          venta.total,
          venta.saldoPendiente,
          venta.usuarioId || null,
          esCredito,
          venta.estado || 'PENDIENTE'
        ]);
      }

      // Actualizar flag de deuda en cliente si hay saldo pendiente
      if (venta.saldoPendiente > 0) {
        await client.query(`
          UPDATE clientes SET tiene_deuda = true, ultima_actualizacion_deuda = NOW(), updated_at = NOW() WHERE id = $1
        `, [venta.clienteId]);
      }

      await client.query('COMMIT');
      return { estado: 'ok', resultado: facturaCreada };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error guardar factura:', error.message);
      return { estado: 'error', resultado: 'Error al guardar la factura' };
    } finally {
      client.release();
    }
  }

  async actualizar(venta) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const esCredito = venta.tipo === 'CREDITO';
      const abonado   = Math.max(0, (venta.total ?? 0) - (venta.saldoPendiente ?? 0));

      const { rows } = await client.query(`
        UPDATE facturas SET
          tipo_venta      = $1,
          estado_pago     = $2,
          subtotal        = $3,
          total           = $4,
          saldo_pendiente = $5,
          abonado         = $6,
          es_credito      = $7,
          observacion     = $8,
          updated_at      = NOW()
        WHERE id = $9
        RETURNING *, estado_pago AS estado, tipo_venta AS tipo
      `, [
        venta.tipo, venta.estado,
        venta.subtotal, venta.total,
        venta.saldoPendiente, abonado, esCredito,
        venta.observacion, venta.id,
      ]);

      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return { estado: 'error', resultado: 'Factura no encontrada' };
      }

      // Recalcular deuda del cliente
      const { rows: [deuda] } = await client.query(`
        SELECT COALESCE(SUM(saldo_pendiente), 0) AS total
        FROM facturas WHERE cliente_id = $1 AND estado_pago = 'PENDIENTE'
      `, [venta.clienteId]);
      await client.query(`
        UPDATE clientes SET tiene_deuda = $1, updated_at = NOW() WHERE id = $2
      `, [Number(deuda.total) > 0, venta.clienteId]);

      await client.query('COMMIT');
      return { estado: 'ok', resultado: rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error actualizar factura:', error.message);
      return { estado: 'error', resultado: 'Error al actualizar la factura' };
    } finally {
      client.release();
    }
  }

  async cobrar(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(`
        UPDATE facturas
        SET saldo_pendiente = 0, abonado = total, estado_pago = 'PAGADA', updated_at = NOW()
        WHERE id = $1
        RETURNING *, estado_pago AS estado, tipo_venta AS tipo
      `, [id]);

      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return { estado: 'error', resultado: 'Factura no encontrada' };
      }

      // Recalcular deuda del cliente
      const { rows: [deuda] } = await client.query(`
        SELECT COALESCE(SUM(saldo_pendiente), 0) AS total
        FROM facturas WHERE cliente_id = $1 AND estado_pago = 'PENDIENTE'
      `, [rows[0].cliente_id]);
      await client.query(`
        UPDATE clientes SET tiene_deuda = $1, updated_at = NOW() WHERE id = $2
      `, [Number(deuda.total) > 0, rows[0].cliente_id]);

      await client.query('COMMIT');
      return { estado: 'ok', resultado: rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error cobrar factura:', error.message);
      return { estado: 'error', resultado: 'Error al marcar la factura como pagada' };
    } finally {
      client.release();
    }
  }

  async anular(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(`
        UPDATE facturas
        SET estado_pago = 'ANULADA', saldo_pendiente = 0, updated_at = NOW()
        WHERE id = $1 AND estado_pago != 'ANULADA'
        RETURNING *, estado_pago AS estado, tipo_venta AS tipo
      `, [id]);

      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return { estado: 'error', resultado: 'Factura no encontrada o ya estaba anulada' };
      }

      const factura = rows[0];
      const items   = factura.items || [];
      for (const item of items) {
        if (item.id && !item.esServicio) {
          await client.query(
            'UPDATE productos SET stock = stock + $1 WHERE id = $2',
            [item.cantidad || 1, item.id]
          );
        }
      }

      // Recalcular deuda del cliente
      const { rows: [deuda] } = await client.query(`
        SELECT COALESCE(SUM(saldo_pendiente), 0) AS total
        FROM facturas WHERE cliente_id = $1 AND estado_pago = 'PENDIENTE'
      `, [factura.cliente_id]);
      await client.query(
        'UPDATE clientes SET tiene_deuda = $1, updated_at = NOW() WHERE id = $2',
        [Number(deuda.total) > 0, factura.cliente_id]
      );

      await client.query('COMMIT');
      return { estado: 'ok', resultado: factura };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error anular factura:', error.message);
      return { estado: 'error', resultado: 'Error al anular la factura' };
    } finally {
      client.release();
    }
  }

  async eliminar(id) {
    try {
      const { rows } = await pool.query(`
        DELETE FROM facturas WHERE id = $1 RETURNING *
      `, [id]);
      if (rows.length === 0) return { estado: 'error', resultado: 'Factura no encontrada' };
      return { estado: 'ok', resultado: rows[0] };
    } catch (error) {
      console.error('Error eliminar factura:', error.message);
      return { estado: 'error', resultado: 'Error al eliminar la factura' };
    }
  }
}
