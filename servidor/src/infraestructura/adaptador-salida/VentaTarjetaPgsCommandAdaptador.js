// src/infraestructura/adaptador-salida/VentaTarjetaPgsCommandAdaptador.js
import VentaTarjetaSalidaCommandPuerto from '../../aplicacion/puertos/salida/VentaTarjetaSalidaCommandPuerto.js';
import pool from '../base-dato/Postgresql.js';

/**
 * Adaptador de Comando para Ventas con Tarjeta (PostgreSQL)
 * Implementa la persistencia de abonos y actualizaciones de ventas tarjeta
 */
export default class VentaTarjetaPgsCommandAdaptador extends VentaTarjetaSalidaCommandPuerto {

  /**
   * Registra un abono del banco a una venta tarjeta
   * Actualiza: abonos_ventas_tarjeta (insert), ventas_tarjeta (monto_recibido, saldo_pendiente, estado)
   * Integra con Caja Banco (registra ingreso automáticamente)
   */
  async registrarAbono(dto) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Obtener venta tarjeta actual
      const { rows: ventaRows } = await client.query(
        `SELECT * FROM ventas_tarjeta WHERE id = $1 FOR UPDATE`,
        [dto.getVentaTarjetaId()]
      );

      if (ventaRows.length === 0) {
        await client.query('ROLLBACK');
        return { estado: 'error', resultado: 'Venta con tarjeta no encontrada' };
      }

      const ventaTarjeta = ventaRows[0];
      const saldoPendienteActual = parseFloat(ventaTarjeta.saldo_pendiente ?? 0);
      const monto = parseFloat(dto.getMonto() ?? 0);

      // 2. Validar que el monto no sea negativo
      if (monto <= 0) {
        await client.query('ROLLBACK');
        return { estado: 'error', resultado: 'El monto debe ser mayor a 0' };
      }

      // 3. Validar que el monto no exceda el saldo pendiente
      if (monto > saldoPendienteActual) {
        await client.query('ROLLBACK');
        return {
          estado: 'error',
          resultado: `Monto ${monto} excede saldo pendiente ${saldoPendienteActual}`
        };
      }

      // 4. Calcular nuevos saldos
      const nuevoSaldoPendiente = Math.max(0, saldoPendienteActual - monto);
      const nuevoMontoRecibido = parseFloat(ventaTarjeta.monto_recibido ?? 0) + monto;
      const nuevoEstado = nuevoSaldoPendiente <= 0.01 ? 'LIQUIDADA' : 'PENDIENTE';

      console.log('💾 [VentaTarjeta] Registrando abono:');
      console.log('   - monto:', monto);
      console.log('   - saldo_anterior:', saldoPendienteActual);
      console.log('   - saldo_nuevo:', nuevoSaldoPendiente);
      console.log('   - estado:', nuevoEstado);

      // 5. Registrar abono en abonos_ventas_tarjeta (historial)
      const { rows: abonoRows } = await client.query(
        `INSERT INTO abonos_ventas_tarjeta
          (venta_tarjeta_id, fecha, monto, observacion)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          dto.getVentaTarjetaId(),
          dto.getFecha() || new Date(),
          monto,
          dto.getObservacion() || null
        ]
      );

      console.log('✅ [VentaTarjeta] Abono registrado:', abonoRows[0]?.id);

      // 6. Actualizar ventas_tarjeta
      const { rows: ventaActualizada } = await client.query(
        `UPDATE ventas_tarjeta
         SET monto_recibido = $1,
             saldo_pendiente = $2,
             estado = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [nuevoMontoRecibido, nuevoSaldoPendiente, nuevoEstado, dto.getVentaTarjetaId()]
      );

      console.log('✅ [VentaTarjeta] Venta actualizada - Estado:', nuevoEstado);

      // 7. Integración con Caja Banco
      // Registrar movimiento de ingreso en Caja Banco
      try {
        const { rows: cajaAbiertaRows } = await client.query(
          `SELECT * FROM cajas_banco WHERE estado = 'ABIERTA' AND activo = TRUE ORDER BY fecha DESC LIMIT 1`
        );

        if (cajaAbiertaRows.length > 0) {
          const cajaBanco = cajaAbiertaRows[0];
          const saldoAnterior = parseFloat(cajaBanco.saldo_actual ?? 0);
          const saldoNuevo = saldoAnterior + monto;

          // Registrar movimiento
          await client.query(
            `INSERT INTO movimientos_cajas_banco
              (caja_banco_id, tipo, categoria, monto, saldo_anterior, saldo_nuevo, descripcion, referencia_id, venta_id, usuario_id, usuario_nombre, fecha)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
            [
              cajaBanco.id,
              'INGRESO',
              'OTRO_INGRESO',
              monto,
              saldoAnterior,
              saldoNuevo,
              `Abono Tarjeta - Factura #${ventaTarjeta.factura_id_personalizado || ventaTarjeta.factura_id}`,
              abonoRows[0]?.id,
              ventaTarjeta.factura_id,
              dto.getUsuarioId() || null,
              null
            ]
          );

          // Actualizar saldo de caja
          await client.query(
            `UPDATE cajas_banco SET saldo_actual = $1, updated_at = NOW() WHERE id = $2`,
            [saldoNuevo, cajaBanco.id]
          );

          console.log('✅ [VentaTarjeta] Movimiento registrado en Caja Banco');
        } else {
          console.warn('⚠️ [VentaTarjeta] No hay caja banco abierta - abono registrado sin movimiento de caja');
        }
      } catch (e) {
        console.error('❌ [VentaTarjeta] Error integrando con Caja Banco:', e.message);
        // No rollback aquí - el abono ya fue registrado
      }

      await client.query('COMMIT');

      return {
        estado: 'ok',
        resultado: {
          id: abonoRows[0]?.id,
          ventaTarjeta: ventaActualizada[0],
          abono: abonoRows[0],
          ventaCompleta: nuevoEstado === 'LIQUIDADA'
        }
      };

    } catch (error) {
      console.error('Error registrarAbono:', error.message);
      await client.query('ROLLBACK');
      return { estado: 'error', resultado: 'Error al registrar abono' };
    } finally {
      client.release();
    }
  }
}
