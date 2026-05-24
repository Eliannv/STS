// src/infraestructura/adaptador-salida/ProveedorPgsCommandAdaptador.js
import ProveedorSalidaCommandPuerto from '../../aplicacion/puertos/salida/ProveedorSalidaCommandPuerto.js';
import pool from '../base-dato/Postgresql.js';

export default class ProveedorPgsCommandAdaptador extends ProveedorSalidaCommandPuerto {

  async guardar(proveedor) {
    const sql = `
      INSERT INTO proveedores
        (codigo, nombre, representante, ruc, telefono_principal, telefono_secundario,
         codigo_lugar, direccion, fecha_ingreso, saldo, activo)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`;
    const valores = [
      proveedor.codigo, proveedor.nombre, proveedor.representante, proveedor.ruc,
      proveedor.telefonoPrincipal, proveedor.telefonoSecundario, proveedor.codigoLugar,
      proveedor.direccion, proveedor.fechaIngreso || null, proveedor.saldo, proveedor.activo
    ];
    try {
      const { rows } = await pool.query(sql, valores);
      return { estado: 'ok', resultado: rows[0] };
    } catch (error) {
      if (error.code === '23505') {
        return { estado: 'error', resultado: 'Ya existe un proveedor con ese RUC' };
      }
      console.error('Error guardar proveedor:', error.message);
      return { estado: 'error', resultado: 'Error al guardar el proveedor' };
    }
  }

  async actualizar(proveedor) {
    const sql = `
      UPDATE proveedores SET
        codigo = $1, nombre = $2, representante = $3, ruc = $4,
        telefono_principal = $5, telefono_secundario = $6, codigo_lugar = $7,
        direccion = $8, fecha_ingreso = $9, saldo = $10,
        activo = $11, updated_at = NOW()
      WHERE id = $12
      RETURNING *`;
    const valores = [
      proveedor.codigo, proveedor.nombre, proveedor.representante, proveedor.ruc,
      proveedor.telefonoPrincipal, proveedor.telefonoSecundario, proveedor.codigoLugar,
      proveedor.direccion, proveedor.fechaIngreso || null, proveedor.saldo,
      proveedor.activo, proveedor.id
    ];
    try {
      const { rows } = await pool.query(sql, valores);
      if (rows.length === 0) return { estado: 'error', resultado: 'Proveedor no encontrado' };
      return { estado: 'ok', resultado: rows[0] };
    } catch (error) {
      if (error.code === '23505') {
        return { estado: 'error', resultado: 'Ya existe un proveedor con ese RUC' };
      }
      console.error('Error actualizar proveedor:', error.message);
      return { estado: 'error', resultado: 'Error al actualizar el proveedor' };
    }
  }

  async eliminar(id) {
    const sql = `
      UPDATE proveedores SET activo = false, updated_at = NOW()
      WHERE id = $1
      RETURNING id`;
    try {
      const { rows } = await pool.query(sql, [id]);
      if (rows.length === 0) return { estado: 'error', resultado: 'Proveedor no encontrado' };
      return { estado: 'ok', resultado: 'Proveedor eliminado correctamente' };
    } catch (error) {
      console.error('Error eliminar proveedor:', error.message);
      return { estado: 'error', resultado: 'Error al eliminar el proveedor' };
    }
  }
}
