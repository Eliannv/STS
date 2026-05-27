// src/infraestructura/adaptador-salida/IngresoPgsCommandAdaptador.js
import IngresoSalidaCommandPuerto from '../../aplicacion/puertos/salida/IngresoSalidaCommandPuerto.js';
import pool from '../base-dato/Postgresql.js';

export default class IngresoPgsCommandAdaptador extends IngresoSalidaCommandPuerto {

  // ── Ingreso ──────────────────────────────────────────────────────────────

  async guardar(ingreso, detalles = []) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: [ingresoCreado] } = await client.query(`
        INSERT INTO ingresos
          (proveedor_id, proveedor_nombre, numero_factura, fecha, tipo_compra,
           observacion, descuento, flete, iva, total, estado, usuario_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'BORRADOR',$11)
        RETURNING *`,
        [
          ingreso.proveedorId, ingreso.proveedorNombre, ingreso.numeroFactura,
          ingreso.fecha, ingreso.tipoCompra, ingreso.observacion,
          ingreso.descuento, ingreso.flete, ingreso.iva, ingreso.total,
          ingreso.usuarioId,
        ]
      );

      for (const det of detalles) {
        await client.query(`
          INSERT INTO detalle_ingresos
            (ingreso_id, producto_id, tipo, codigo, nombre, modelo, color, grupo,
             pvp1, observacion, stock_ingresado, costo_unitario, subtotal)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [
            ingresoCreado.id, det.productoId, det.tipo,
            det.codigo, det.nombre, det.modelo, det.color, det.grupo,
            det.pvp1, det.observacion,
            det.stockIngresado, det.costoUnitario, det.subtotal,
          ]
        );
      }

      await client.query('COMMIT');
      return { estado: 'ok', resultado: ingresoCreado };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') {
        return { estado: 'error', resultado: 'Ya existe un ingreso con ese número de factura' };
      }
      console.error('Error guardar ingreso:', error.message);
      return { estado: 'error', resultado: 'Error al guardar el ingreso' };
    } finally {
      client.release();
    }
  }

  async actualizar(ingreso) {
    const sql = `
      UPDATE ingresos SET
        proveedor_id = $1, proveedor_nombre = $2, numero_factura = $3,
        fecha = $4, tipo_compra = $5, observacion = $6,
        descuento = $7, flete = $8, iva = $9, total = $10,
        updated_at = NOW()
      WHERE id = $11 AND estado = 'BORRADOR'
      RETURNING *`;
    try {
      const { rows } = await pool.query(sql, [
        ingreso.proveedorId, ingreso.proveedorNombre, ingreso.numeroFactura,
        ingreso.fecha, ingreso.tipoCompra, ingreso.observacion,
        ingreso.descuento, ingreso.flete, ingreso.iva, ingreso.total,
        ingreso.id,
      ]);
      if (rows.length === 0) {
        return { estado: 'error', resultado: 'Ingreso no encontrado o ya fue finalizado' };
      }
      return { estado: 'ok', resultado: rows[0] };
    } catch (error) {
      if (error.code === '23505') {
        return { estado: 'error', resultado: 'Ya existe un ingreso con ese número de factura' };
      }
      console.error('Error actualizar ingreso:', error.message);
      return { estado: 'error', resultado: 'Error al actualizar el ingreso' };
    }
  }

  async finalizar(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Obtener el ingreso (solo si está en BORRADOR)
      const { rows: ingresos } = await client.query(
        "SELECT * FROM ingresos WHERE id = $1 AND estado = 'BORRADOR'",
        [id]
      );
      if (ingresos.length === 0) {
        await client.query('ROLLBACK');
        return { estado: 'error', resultado: 'Ingreso no encontrado o ya fue finalizado' };
      }
      const ingreso = ingresos[0];

      // 2. Obtener los detalles
      const { rows: detalles } = await client.query(
        'SELECT * FROM detalle_ingresos WHERE ingreso_id = $1 ORDER BY id',
        [id]
      );
      if (detalles.length === 0) {
        await client.query('ROLLBACK');
        return { estado: 'error', resultado: 'El ingreso no tiene productos. Agregue al menos uno antes de finalizar' };
      }

      // 3. Procesar cada detalle
      for (const det of detalles) {
        if (det.tipo === 'EXISTENTE' && det.producto_id) {
          // Actualizar stock y costo del producto existente
          await client.query(`
            UPDATE productos SET
              stock = stock + $1,
              costo = $2,
              updated_at = NOW()
            WHERE id = $3`,
            [det.stock_ingresado, det.costo_unitario, det.producto_id]
          );

        } else if (det.tipo === 'NUEVO') {
          // Crear el nuevo producto con todos los campos capturados
          const pvp1Val = det.pvp1 ?? det.costo_unitario;
          const { rows: [nuevoProducto] } = await client.query(`
            INSERT INTO productos
              (codigo, nombre, modelo, color, grupo, stock, tipo_control_stock,
               costo, pvp1, iva, precio_con_iva, observacion,
               proveedor_id, ingreso_id, activo)
            VALUES ($1,$2,$3,$4,$5,$6,'NORMAL',$7,$8,0,$8,$9,$10,$11,true)
            RETURNING id`,
            [
              det.codigo, det.nombre, det.modelo, det.color, det.grupo,
              det.stock_ingresado, det.costo_unitario, pvp1Val,
              det.observacion, ingreso.proveedor_id, id,
            ]
          );
          // Enlazar detalle con el producto recién creado
          await client.query(
            'UPDATE detalle_ingresos SET producto_id = $1 WHERE id = $2',
            [nuevoProducto.id, det.id]
          );
        }
      }

      // 4. Recalcular total desde los detalles y actualizar estado
      const subtotalSum = detalles.reduce((s, d) => s + parseFloat(d.subtotal || 0), 0);
      const nuevoTotal  = +(subtotalSum + parseFloat(ingreso.flete || 0)
                           - parseFloat(ingreso.descuento || 0)
                           + parseFloat(ingreso.iva || 0)).toFixed(2);

      const { rows: [finalizado] } = await client.query(`
        UPDATE ingresos SET estado = 'FINALIZADO', total = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *`,
        [nuevoTotal, id]
      );

      await client.query('COMMIT');
      return { estado: 'ok', resultado: finalizado };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error finalizar ingreso:', error.message);
      return { estado: 'error', resultado: 'Error al finalizar el ingreso: ' + error.message };
    } finally {
      client.release();
    }
  }

  async eliminar(id) {
    const sql = `
      DELETE FROM ingresos
      WHERE id = $1 AND estado = 'BORRADOR'
      RETURNING id`;
    try {
      const { rows } = await pool.query(sql, [id]);
      if (rows.length === 0) {
        return { estado: 'error', resultado: 'Ingreso no encontrado o ya fue finalizado (no se puede eliminar)' };
      }
      return { estado: 'ok', resultado: 'Ingreso eliminado correctamente' };
    } catch (error) {
      console.error('Error eliminar ingreso:', error.message);
      return { estado: 'error', resultado: 'Error al eliminar el ingreso' };
    }
  }

  // ── Detalle ───────────────────────────────────────────────────────────────

  async guardarDetalle(detalle) {
    const sql = `
      INSERT INTO detalle_ingresos
        (ingreso_id, producto_id, tipo, codigo, nombre, modelo, color, grupo,
         pvp1, observacion, stock_ingresado, costo_unitario, subtotal)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *`;
    try {
      const { rows } = await pool.query(sql, [
        detalle.ingresoId, detalle.productoId, detalle.tipo,
        detalle.codigo, detalle.nombre, detalle.modelo, detalle.color, detalle.grupo,
        detalle.pvp1, detalle.observacion,
        detalle.stockIngresado, detalle.costoUnitario, detalle.subtotal,
      ]);
      return { estado: 'ok', resultado: rows[0] };
    } catch (error) {
      console.error('Error guardar detalle ingreso:', error.message);
      return { estado: 'error', resultado: 'Error al agregar el detalle' };
    }
  }

  async actualizarDetalle(detalle) {
    const sql = `
      UPDATE detalle_ingresos SET
        producto_id = $1, tipo = $2, codigo = $3, nombre = $4,
        modelo = $5, color = $6, grupo = $7,
        pvp1 = $8, observacion = $9,
        stock_ingresado = $10, costo_unitario = $11, subtotal = $12
      WHERE id = $13
      RETURNING *`;
    try {
      const { rows } = await pool.query(sql, [
        detalle.productoId, detalle.tipo, detalle.codigo, detalle.nombre,
        detalle.modelo, detalle.color, detalle.grupo,
        detalle.pvp1, detalle.observacion,
        detalle.stockIngresado, detalle.costoUnitario, detalle.subtotal, detalle.id,
      ]);
      if (rows.length === 0) return { estado: 'error', resultado: 'Detalle no encontrado' };
      return { estado: 'ok', resultado: rows[0] };
    } catch (error) {
      console.error('Error actualizar detalle ingreso:', error.message);
      return { estado: 'error', resultado: 'Error al actualizar el detalle' };
    }
  }

  async eliminarDetalle(id) {
    const sql = `DELETE FROM detalle_ingresos WHERE id = $1 RETURNING id`;
    try {
      const { rows } = await pool.query(sql, [id]);
      if (rows.length === 0) return { estado: 'error', resultado: 'Detalle no encontrado' };
      return { estado: 'ok', resultado: 'Detalle eliminado correctamente' };
    } catch (error) {
      console.error('Error eliminar detalle ingreso:', error.message);
      return { estado: 'error', resultado: 'Error al eliminar el detalle' };
    }
  }
}
