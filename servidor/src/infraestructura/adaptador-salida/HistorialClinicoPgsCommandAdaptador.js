// src/infraestructura/adaptador-salida/HistorialClinicoPgsCommandAdaptador.js
import HistorialClinicoSalidaCommandPuerto from '../../aplicacion/puertos/salida/HistorialClinicoSalidaCommandPuerto.js';
import pool from '../base-dato/Postgresql.js';

export default class HistorialClinicoPgsCommandAdaptador extends HistorialClinicoSalidaCommandPuerto {

  async guardar(historial) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const sqlInsert = `
        INSERT INTO historial_clinico (
          cliente_id,
          od_esfera, od_cilindro, od_eje, od_avsc, od_avcc,
          oi_esfera, oi_cilindro, oi_eje, oi_avsc, oi_avcc,
          dp, "add", de, altura, color, observacion,
          armazon_h, armazon_v, armazon_dbl, armazon_dm, armazon_tipo,
          doctor, fecha_chequeo, hora_chequeo
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25
        )
        RETURNING *`;

      const valores = [
        historial.clienteId,
        historial.odEsfera,   historial.odCilindro, historial.odEje,      historial.odAvsc,  historial.odAvcc,
        historial.oiEsfera,   historial.oiCilindro, historial.oiEje,      historial.oiAvsc,  historial.oiAvcc,
        historial.dp,         historial.add,
        historial.de,         historial.altura,     historial.color,      historial.observacion,
        historial.armazonH,   historial.armazonV,   historial.armazonDbl, historial.armazonDm, historial.armazonTipo,
        historial.doctor,     historial.fechaChequeo, historial.horaChequeo
      ];

      const { rows } = await client.query(sqlInsert, valores);

      // Actualizar flag del cliente
      await client.query(
        'UPDATE clientes SET tiene_historial_clinico = true, updated_at = NOW() WHERE id = $1',
        [historial.clienteId]
      );

      await client.query('COMMIT');
      return { estado: 'ok', resultado: rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error guardar historial:', error.message);
      return { estado: 'error', resultado: 'Error al guardar el historial clínico' };
    } finally {
      client.release();
    }
  }

  async actualizar(historial) {
    const sql = `
      UPDATE historial_clinico SET
        od_esfera = $1, od_cilindro = $2, od_eje = $3, od_avsc = $4, od_avcc = $5,
        oi_esfera = $6, oi_cilindro = $7, oi_eje = $8, oi_avsc = $9, oi_avcc = $10,
        dp = $11, "add" = $12, de = $13, altura = $14, color = $15,
        observacion = $16, armazon_h = $17, armazon_v = $18, armazon_dbl = $19,
        armazon_dm = $20, armazon_tipo = $21,
        doctor = $22, fecha_chequeo = $23, hora_chequeo = $24,
        updated_at = NOW()
      WHERE id = $25
      RETURNING *`;

    const valores = [
      historial.odEsfera,   historial.odCilindro, historial.odEje,      historial.odAvsc,  historial.odAvcc,
      historial.oiEsfera,   historial.oiCilindro, historial.oiEje,      historial.oiAvsc,  historial.oiAvcc,
      historial.dp,         historial.add,
      historial.de,         historial.altura,     historial.color,      historial.observacion,
      historial.armazonH,   historial.armazonV,   historial.armazonDbl, historial.armazonDm, historial.armazonTipo,
      historial.doctor,     historial.fechaChequeo, historial.horaChequeo,
      historial.id
    ];

    try {
      const { rows } = await pool.query(sql, valores);
      if (rows.length === 0) return { estado: 'error', resultado: 'Historial no encontrado' };
      return { estado: 'ok', resultado: rows[0] };
    } catch (error) {
      console.error('Error actualizar historial:', error.message);
      return { estado: 'error', resultado: 'Error al actualizar el historial clínico' };
    }
  }

  async eliminar(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Obtener cliente_id antes de borrar
      const { rows: prev } = await client.query(
        'SELECT cliente_id FROM historial_clinico WHERE id = $1',
        [id]
      );
      if (prev.length === 0) {
        await client.query('ROLLBACK');
        return { estado: 'error', resultado: 'Historial no encontrado' };
      }
      const clienteId = prev[0].cliente_id;

      await client.query('DELETE FROM historial_clinico WHERE id = $1', [id]);

      // Si no quedan registros para ese cliente, apagar el flag
      const { rows: restantes } = await client.query(
        'SELECT id FROM historial_clinico WHERE cliente_id = $1 LIMIT 1',
        [clienteId]
      );
      if (restantes.length === 0) {
        await client.query(
          'UPDATE clientes SET tiene_historial_clinico = false, updated_at = NOW() WHERE id = $1',
          [clienteId]
        );
      }

      await client.query('COMMIT');
      return { estado: 'ok', resultado: 'Historial eliminado correctamente' };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error eliminar historial:', error.message);
      return { estado: 'error', resultado: 'Error al eliminar el historial clínico' };
    } finally {
      client.release();
    }
  }
}
