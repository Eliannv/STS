// src/infraestructura/adaptador-salida/CobroDeudaPgsCommandAdaptador.js
import CobroDeudaCommandSalidaPuerto from '../../aplicacion/puertos/salida/CobroDeudaCommandSalidaPuerto.js';
import pool from '../base-dato/Postgresql.js';

/**
 * Adaptador de Comando para Cobro de Deuda (PostgreSQL)
 * Implementa la persistencia de abonos y actualizaciones de facturas
 */
export default class CobroDeudaPgsCommandAdaptador extends CobroDeudaCommandSalidaPuerto {

  /**
   * Registra un abono parcial a una factura
   * Actualiza: facturas_deudas (insert), facturas (abonado, saldo_pendiente, estado_pago), clientes (tiene_deuda)
   */
  async registrarAbono(abono) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Obtener factura actual
      const { rows: facturaRows } = await client.query(
        `SELECT * FROM facturas WHERE id = $1 FOR UPDATE`,
        [abono.facturaId]
      );

      if (facturaRows.length === 0) {
        await client.query('ROLLBACK');
        return { estado: 'error', resultado: 'Factura no encontrada' };
      }

      const factura = facturaRows[0];
      const saldoPendienteActual = parseFloat(factura.saldo_pendiente ?? 0);
      const montoPagado = parseFloat(abono.montoPagado ?? 0);

      // 2. Validar que el monto no exceda el saldo pendiente
      if (montoPagado > saldoPendienteActual) {
        await client.query('ROLLBACK');
        return { 
          estado: 'error', 
          resultado: `Monto ${montoPagado} excede saldo pendiente ${saldoPendienteActual}` 
        };
      }

      // 3. Calcular nuevo saldo
      const nuevoSaldo = Math.max(0, saldoPendienteActual - montoPagado);
      const nuevoAbonado = parseFloat(factura.abonado ?? 0) + montoPagado;
      const nuevoEstado = nuevoSaldo <= 0.01 ? 'PAGADA' : 'PENDIENTE';

      // 4. Registrar abono en facturas_deudas (historial)
      console.log('💾 [CobroDeuda] Insertando en facturas_deudas:');
      console.log('   - monto_pagado:', montoPagado);
      console.log('   - saldo_restante:', nuevoSaldo);
      console.log('   - estado_pago:', nuevoEstado);
      
      const { rows: abonoRows } = await client.query(
        `INSERT INTO facturas_deudas
          (factura_id, factura_id_personalizado, cliente_id, cliente_nombre, 
           metodo_pago, fecha_pago, monto_pagado, total_factura, saldo_restante,
           usuario_id, es_credito, estado_pago)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          abono.facturaId,
          factura.id_personalizado,
          factura.cliente_id,
          factura.cliente_nombre,
          abono.metodoPago,
          abono.fechaPago || new Date(),
          montoPagado,
          factura.total,
          nuevoSaldo,
          abono.usuarioId || null,
          factura.es_credito || false,
          nuevoEstado
        ]
      );
      
      console.log('✅ [CobroDeuda] Abono registrado en facturas_deudas:', abonoRows[0]?.id);

      // 5. Actualizar factura
      const { rows: facturaActualizada } = await client.query(
        `UPDATE facturas 
         SET abonado = $1, 
             saldo_pendiente = $2, 
             estado_pago = $3, 
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [nuevoAbonado, nuevoSaldo, nuevoEstado, abono.facturaId]
      );

      // 6. Recalcular deuda del cliente
      const { rows: deudaResumen } = await client.query(
        `SELECT COALESCE(SUM(saldo_pendiente), 0) AS total
         FROM facturas 
         WHERE cliente_id = $1 AND estado_pago = 'PENDIENTE'`,
        [factura.cliente_id]
      );

      const tieneDeudasActuales = parseFloat(deudaResumen[0]?.total ?? 0) > 0;
      await client.query(
        `UPDATE clientes 
         SET tiene_deuda = $1, ultima_actualizacion_deuda = NOW(), updated_at = NOW() 
         WHERE id = $2`,
        [tieneDeudasActuales, factura.cliente_id]
      );

      await client.query('COMMIT');

      return {
        estado: 'ok',
        resultado: {
          id: abonoRows[0]?.id,
          factura: facturaActualizada[0],
          abono: abonoRows[0],
          facturaCompleta: nuevoEstado === 'PAGADA'
        }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error registrarAbono:', error.message);
      return { estado: 'error', resultado: 'Error al registrar el abono' };
    } finally {
      client.release();
    }
  }

  /**
   * Registra múltiples abonos (para carga masiva)
   */
  async registrarMultipleAbonos(abonos) {
    const resultados = [];
    for (const abono of abonos) {
      const resultado = await this.registrarAbono(abono);
      resultados.push(resultado);
      if (resultado.estado !== 'ok') break; // Detener en primer error
    }
    return { estado: 'ok', resultado: resultados };
  }
}
