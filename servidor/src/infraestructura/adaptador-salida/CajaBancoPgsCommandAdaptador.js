// src/infraestructura/adaptador-salida/CajaBancoPgsCommandAdaptador.js
import CajaBancoSalidaCommandPuerto from '../../aplicacion/puertos/salida/CajaBancoSalidaCommandPuerto.js';
import pool from '../base-dato/Postgresql.js';

export default class CajaBancoPgsCommandAdaptador extends CajaBancoSalidaCommandPuerto {

  /** Crear y abrir una nueva caja banco */
  async abrir(caja) {
    try {
      const { rows: [creada] } = await pool.query(`
        INSERT INTO cajas_banco
          (fecha, saldo_inicial, saldo_actual, estado, usuario_id, usuario_nombre, observacion, activo)
        VALUES ($1, $2, $2, 'ABIERTA', $3, $4, $5, TRUE)
        RETURNING *
      `, [caja.fecha, caja.saldoInicial, caja.usuarioId, caja.usuarioNombre, caja.observacion]);

      return { estado: 'ok', resultado: creada };
    } catch (error) {
      console.error('Error abrir caja banco:', error.message);
      return { estado: 'error', resultado: 'Error al abrir la caja banco' };
    }
  }

  /** Cerrar la caja banco */
  async cerrar(id, datosCierre) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: [actual] } = await client.query(
        `SELECT id, estado FROM cajas_banco WHERE id = $1 AND activo = TRUE`, [id]
      );
      if (!actual)                      { await client.query('ROLLBACK'); return { estado: 'error', resultado: 'Caja banco no encontrada' }; }
      if (actual.estado === 'CERRADA')  { await client.query('ROLLBACK'); return { estado: 'error', resultado: 'La caja banco ya está cerrada' }; }

      const { rows: [cerrada] } = await client.query(`
        UPDATE cajas_banco SET
          estado             = 'CERRADA',
          cerrado_en         = $1,
          cerrado_por_id     = $2,
          cerrado_por_nombre = $3,
          updated_at         = NOW()
        WHERE id = $4
        RETURNING *
      `, [datosCierre.cerradoEn, datosCierre.cerradoPorId, datosCierre.cerradoPorNombre, id]);

      await client.query('COMMIT');
      return { estado: 'ok', resultado: cerrada };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error cerrar caja banco:', error.message);
      return { estado: 'error', resultado: 'Error al cerrar la caja banco' };
    } finally {
      client.release();
    }
  }

  /**
   * Registrar un movimiento (INGRESO/EGRESO) en la caja banco.
   * Transaccional: calcula saldo_anterior, saldo_nuevo, inserta movimiento,
   * actualiza saldo_actual en cajas_banco.
   */
  async registrarMovimiento(dto) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      console.log('🔍 [CajaBancoPgsCommandAdaptador] Buscando caja banco con id:', dto.getCajaBancoId());
      const { rows: [caja] } = await client.query(
        `SELECT id, estado, saldo_actual FROM cajas_banco WHERE id = $1 AND activo = TRUE`,
        [dto.getCajaBancoId()]
      );
      console.log('📦 [CajaBancoPgsCommandAdaptador] Caja encontrada:', caja);
      if (!caja)                     { await client.query('ROLLBACK'); return { estado: 'error', resultado: 'Caja banco no encontrada' }; }
      if (caja.estado === 'CERRADA') { await client.query('ROLLBACK'); return { estado: 'error', resultado: 'No se puede registrar en una caja cerrada' }; }

      const saldoAnterior = parseFloat(caja.saldo_actual);
      const monto = parseFloat(dto.getMonto());
      const nuevoSaldo = dto.getTipo() === 'INGRESO'
        ? saldoAnterior + monto
        : Math.max(0, saldoAnterior - monto);

      console.log('💰 [CajaBancoPgsCommandAdaptador] Cálculo:', { saldoAnterior, monto, nuevoSaldo });

      const { rows: [mov] } = await client.query(`
        INSERT INTO movimientos_cajas_banco
          (caja_banco_id, fecha, tipo, categoria, monto, saldo_anterior, saldo_nuevo,
           descripcion, referencia_id, venta_id, usuario_id, usuario_nombre)
        VALUES ($1, COALESCE($2, NOW()), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        dto.getCajaBancoId(),
        dto.getFecha(),
        dto.getTipo(),
        dto.getCategoria(),
        monto,
        saldoAnterior,
        nuevoSaldo,
        dto.getDescripcion(),
        dto.getReferencia(),
        dto.getVentaId(),
        dto.getUsuarioId(),
        dto.getUsuarioNombre(),
      ]);

      console.log('✅ [CajaBancoPgsCommandAdaptador] Movimiento insertado:', mov.id);

      await client.query(
        `UPDATE cajas_banco SET saldo_actual = $1, updated_at = NOW() WHERE id = $2`,
        [nuevoSaldo, dto.getCajaBancoId()]
      );

      console.log('✅ [CajaBancoPgsCommandAdaptador] Saldo actualizado');

      await client.query('COMMIT');
      console.log('✅ [CajaBancoPgsCommandAdaptador] Transacción completada');
      return { estado: 'ok', resultado: mov };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ [CajaBancoPgsCommandAdaptador] Error:', error.message);
      console.error('   Stack:', error.stack);
      return { estado: 'error', resultado: 'Error al registrar el movimiento' };
    } finally {
      client.release();
    }
  }

  /**
   * Eliminar un movimiento y revertir el saldo.
   */
  async eliminarMovimiento(movimientoId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: [mov] } = await client.query(
        `SELECT * FROM movimientos_cajas_banco WHERE id = $1`, [movimientoId]
      );
      if (!mov) { await client.query('ROLLBACK'); return { estado: 'error', resultado: 'Movimiento no encontrado' }; }

      const { rows: [caja] } = await client.query(
        `SELECT estado, saldo_actual FROM cajas_banco WHERE id = $1`, [mov.caja_banco_id]
      );
      if (!caja || caja.estado === 'CERRADA') {
        await client.query('ROLLBACK');
        return { estado: 'error', resultado: 'No se puede modificar una caja cerrada' };
      }

      const saldoActual = parseFloat(caja.saldo_actual);
      const monto = parseFloat(mov.monto);
      const saldoRevertido = mov.tipo === 'INGRESO'
        ? Math.max(0, saldoActual - monto)
        : saldoActual + monto;

      await client.query(`DELETE FROM movimientos_cajas_banco WHERE id = $1`, [movimientoId]);
      await client.query(
        `UPDATE cajas_banco SET saldo_actual = $1, updated_at = NOW() WHERE id = $2`,
        [saldoRevertido, mov.caja_banco_id]
      );

      await client.query('COMMIT');
      return { estado: 'ok', resultado: { movimientoId, saldoRevertido } };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error eliminar movimiento caja banco:', error.message);
      return { estado: 'error', resultado: 'Error al eliminar el movimiento' };
    } finally {
      client.release();
    }
  }
}
