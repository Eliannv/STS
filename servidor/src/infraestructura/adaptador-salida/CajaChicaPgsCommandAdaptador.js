// src/infraestructura/adaptador-salida/CajaChicaPgsCommandAdaptador.js
import CajaChicaSalidaCommandPuerto from '../../aplicacion/puertos/salida/CajaChicaSalidaCommandPuerto.js';
import pool from '../base-dato/Postgresql.js';

export default class CajaChicaPgsCommandAdaptador extends CajaChicaSalidaCommandPuerto {

  /** Crear y abrir una nueva caja chica */
  async abrir(caja) {
    try {
      const { rows: [creada] } = await pool.query(`
        INSERT INTO cajas_chicas
          (fecha, monto_inicial, monto_actual, estado, usuario_id, usuario_nombre, observacion, activo)
        VALUES ($1, $2, $2, 'ABIERTA', $3, $4, $5, TRUE)
        RETURNING *
      `, [caja.fecha, caja.montoInicial, caja.usuarioId, caja.usuarioNombre, caja.observacion]);

      return { estado: 'ok', resultado: creada };
    } catch (error) {
      console.error('Error abrir caja chica:', error.message);
      return { estado: 'error', resultado: 'Error al abrir la caja chica' };
    }
  }

  /** Cerrar la caja chica: valida que esté abierta, actualiza estado y timestamps */
  async cerrar(id, datosCierre) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: [actual] } = await client.query(
        `SELECT id, estado FROM cajas_chicas WHERE id = $1 AND activo = TRUE`, [id]
      );
      if (!actual)                       { await client.query('ROLLBACK'); return { estado: 'error', resultado: 'Caja chica no encontrada' }; }
      if (actual.estado === 'CERRADA')   { await client.query('ROLLBACK'); return { estado: 'error', resultado: 'La caja chica ya está cerrada' }; }

      const { rows: [cerrada] } = await client.query(`
        UPDATE cajas_chicas SET
          estado             = 'CERRADA',
          cerrado_en         = $1,
          cerrado_por_id     = $2,
          cerrado_por_nombre = $3,
          caja_banco_id      = $4,
          updated_at         = NOW()
        WHERE id = $5
        RETURNING *
      `, [datosCierre.cerradoEn, datosCierre.cerradoPorId, datosCierre.cerradoPorNombre, datosCierre.cajaBancoId, id]);

      await client.query('COMMIT');
      return { estado: 'ok', resultado: cerrada };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error cerrar caja chica:', error.message);
      return { estado: 'error', resultado: 'Error al cerrar la caja chica' };
    } finally {
      client.release();
    }
  }

  /**
   * Registrar un movimiento de INGRESO o EGRESO.
   * Dentro de una transacción:
   *  1. Obtiene el monto_actual de la caja
   *  2. Calcula nuevo saldo (INGRESO suma, EGRESO resta sin bajar de 0)
   *  3. Inserta el movimiento con saldo_anterior y saldo_nuevo
   *  4. Actualiza monto_actual en cajas_chicas
   */
  async registrarMovimiento(dto) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1) Verificar que la caja exista, esté abierta y obtener saldo actual
      const { rows: [caja] } = await client.query(
        `SELECT id, estado, monto_actual FROM cajas_chicas WHERE id = $1 AND activo = TRUE`,
        [dto.getCajaChicaId()]
      );
      if (!caja)                      { await client.query('ROLLBACK'); return { estado: 'error', resultado: 'Caja chica no encontrada' }; }
      if (caja.estado === 'CERRADA')  { await client.query('ROLLBACK'); return { estado: 'error', resultado: 'No se puede registrar en una caja cerrada' }; }

      const saldoAnterior = parseFloat(caja.monto_actual);
      const monto = parseFloat(dto.getMonto());
      let nuevoSaldo = dto.getTipo() === 'INGRESO'
        ? saldoAnterior + monto
        : Math.max(0, saldoAnterior - monto);

      // 2) Insertar movimiento
      const { rows: [mov] } = await client.query(`
        INSERT INTO movimientos_cajas_chicas
          (caja_chica_id, fecha, tipo, descripcion, monto, saldo_anterior, saldo_nuevo,
           usuario_id, usuario_nombre, referencia)
        VALUES ($1, COALESCE($2, NOW()), $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        dto.getCajaChicaId(),
        dto.getFecha(),
        dto.getTipo(),
        dto.getDescripcion(),
        monto,
        saldoAnterior,
        nuevoSaldo,
        dto.getUsuarioId(),
        dto.getUsuarioNombre(),
        dto.getReferencia(),
      ]);

      // 3) Actualizar saldo en caja
      await client.query(
        `UPDATE cajas_chicas SET monto_actual = $1, updated_at = NOW() WHERE id = $2`,
        [nuevoSaldo, dto.getCajaChicaId()]
      );

      await client.query('COMMIT');
      return { estado: 'ok', resultado: mov };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error registrar movimiento caja chica:', error.message);
      return { estado: 'error', resultado: 'Error al registrar el movimiento' };
    } finally {
      client.release();
    }
  }

  /**
   * Eliminar un movimiento y revertir el saldo.
   * Dentro de una transacción:
   *  1. Obtiene el movimiento
   *  2. Recalcula el saldo (invirtiendo el efecto)
   *  3. Elimina el movimiento
   *  4. Actualiza monto_actual
   */
  async eliminarMovimiento(movimientoId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: [mov] } = await client.query(
        `SELECT * FROM movimientos_cajas_chicas WHERE id = $1`, [movimientoId]
      );
      if (!mov) { await client.query('ROLLBACK'); return { estado: 'error', resultado: 'Movimiento no encontrado' }; }

      // Verificar que la caja esté abierta
      const { rows: [caja] } = await client.query(
        `SELECT estado, monto_actual FROM cajas_chicas WHERE id = $1`, [mov.caja_chica_id]
      );
      if (!caja || caja.estado === 'CERRADA') {
        await client.query('ROLLBACK');
        return { estado: 'error', resultado: 'No se puede modificar una caja cerrada' };
      }

      // Revertir: si era INGRESO, restar; si era EGRESO, sumar
      const saldoActual = parseFloat(caja.monto_actual);
      const monto = parseFloat(mov.monto);
      const saldoRevertido = mov.tipo === 'INGRESO'
        ? Math.max(0, saldoActual - monto)
        : saldoActual + monto;

      await client.query(`DELETE FROM movimientos_cajas_chicas WHERE id = $1`, [movimientoId]);
      await client.query(
        `UPDATE cajas_chicas SET monto_actual = $1, updated_at = NOW() WHERE id = $2`,
        [saldoRevertido, mov.caja_chica_id]
      );

      await client.query('COMMIT');
      return { estado: 'ok', resultado: { movimientoId, saldoRevertido } };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error eliminar movimiento caja chica:', error.message);
      return { estado: 'error', resultado: 'Error al eliminar el movimiento' };
    } finally {
      client.release();
    }
  }
}
