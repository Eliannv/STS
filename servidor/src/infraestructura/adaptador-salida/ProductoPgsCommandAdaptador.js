// src/infraestructura/adaptador-salida/ProductoPgsCommandAdaptador.js
import ProductoSalidaCommandPuerto from '../../aplicacion/puertos/salida/ProductoSalidaCommandPuerto.js';
import pool from '../base-dato/Postgresql.js';

export default class ProductoPgsCommandAdaptador extends ProductoSalidaCommandPuerto {

  async guardar(producto) {
    const sql = `
      INSERT INTO productos (
        id_interno, codigo, nombre, modelo, color, grupo,
        stock, tipo_control_stock, costo, pvp1, iva, precio_con_iva,
        proveedor_id, ingreso_id, observacion, activo
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *`;
    const valores = [
      producto.idInterno, producto.codigo, producto.nombre,
      producto.modelo,    producto.color,  producto.grupo,
      producto.stock,     producto.tipoControlStock,
      producto.costo,     producto.pvp1,   producto.iva, producto.precioConIva,
      producto.proveedorId, producto.ingresoId, producto.observacion, producto.activo
    ];
    try {
      const { rows } = await pool.query(sql, valores);
      return { estado: 'ok', resultado: rows[0] };
    } catch (error) {
      if (error.code === '23505') {
        return { estado: 'error', resultado: 'Ya existe un producto con ese código o ID interno' };
      }
      console.error('Error guardar producto:', error.message);
      return { estado: 'error', resultado: 'Error al guardar el producto' };
    }
  }

  async actualizar(producto) {
    const sql = `
      UPDATE productos SET
        id_interno = $1, codigo = $2, nombre = $3, modelo = $4, color = $5, grupo = $6,
        stock = $7, tipo_control_stock = $8, costo = $9, pvp1 = $10, iva = $11,
        precio_con_iva = $12, proveedor_id = $13, ingreso_id = $14,
        observacion = $15, activo = $16, updated_at = NOW()
      WHERE id = $17
      RETURNING *`;
    const valores = [
      producto.idInterno, producto.codigo, producto.nombre,
      producto.modelo,    producto.color,  producto.grupo,
      producto.stock,     producto.tipoControlStock,
      producto.costo,     producto.pvp1,   producto.iva, producto.precioConIva,
      producto.proveedorId, producto.ingresoId, producto.observacion,
      producto.activo, producto.id
    ];
    try {
      const { rows } = await pool.query(sql, valores);
      if (rows.length === 0) return { estado: 'error', resultado: 'Producto no encontrado' };
      return { estado: 'ok', resultado: rows[0] };
    } catch (error) {
      if (error.code === '23505') {
        return { estado: 'error', resultado: 'Ya existe un producto con ese código o ID interno' };
      }
      console.error('Error actualizar producto:', error.message);
      return { estado: 'error', resultado: 'Error al actualizar el producto' };
    }
  }

  async eliminar(id) {
    const sql = `
      UPDATE productos SET activo = false, updated_at = NOW()
      WHERE id = $1
      RETURNING id`;
    try {
      const { rows } = await pool.query(sql, [id]);
      if (rows.length === 0) return { estado: 'error', resultado: 'Producto no encontrado' };
      return { estado: 'ok', resultado: 'Producto eliminado correctamente' };
    } catch (error) {
      console.error('Error eliminar producto:', error.message);
      return { estado: 'error', resultado: 'Error al eliminar el producto' };
    }
  }
}
