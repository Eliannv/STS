// src/infraestructura/adaptador-salida/SucursalPgsCommandAdaptador.js
import SucursalSalidaCommandPuerto from '../../aplicacion/puertos/salida/SucursalSalidaCommandPuerto.js';
import postgresql from '../base-dato/Postgresql.js';

export default class SucursalPgsCommandAdaptador extends SucursalSalidaCommandPuerto {

  guardar = async (sucursal) => {
    try {
      const result = await postgresql.query(
        `INSERT INTO sucursales (codigo, nombre, activo, direccion, telefono, creado_por_id, fecha_creacion)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING id`,
        [sucursal.codigo, sucursal.nombre, sucursal.activo,
         sucursal.direccion, sucursal.telefono, sucursal.creadoPorId]
      );
      const id = result.rows[0].id;
      console.log(`Sucursal creada con ID: ${id}`);
      return { estado: 'ok', resultado: `Sucursal creada con ID ${id}` };
    } catch (error) {
      console.error('Error al guardar sucursal:', error.message);
      if (error.code === '23505') {
        return { estado: 'error', resultado: 'El código de sucursal ya existe' };
      }
      return { estado: 'error', resultado: `Error al crear sucursal: ${error.message}` };
    }
  }

  actualizar = async (sucursal) => {
    try {
      const result = await postgresql.query(
        `UPDATE sucursales
         SET codigo=$1, nombre=$2, activo=$3, direccion=$4, telefono=$5
         WHERE id=$6 RETURNING id`,
        [sucursal.codigo, sucursal.nombre, sucursal.activo,
         sucursal.direccion, sucursal.telefono, sucursal.id]
      );
      if (result.rowCount === 0) {
        return { estado: 'error', resultado: `No se encontró la sucursal con ID ${sucursal.id}` };
      }
      return { estado: 'ok', resultado: `Sucursal con ID ${sucursal.id} actualizada correctamente` };
    } catch (error) {
      console.error('Error al actualizar sucursal:', error.message);
      if (error.code === '23505') {
        return { estado: 'error', resultado: 'El código de sucursal ya existe' };
      }
      return { estado: 'error', resultado: `Error al actualizar: ${error.message}` };
    }
  }

  eliminar = async (id) => {
    try {
      const result = await postgresql.query(
        'UPDATE sucursales SET activo=false WHERE id=$1 RETURNING id',
        [id]
      );
      if (result.rowCount === 0) {
        return { estado: 'error', resultado: `No se encontró la sucursal con ID ${id}` };
      }
      return { estado: 'ok', resultado: `Sucursal con ID ${id} desactivada correctamente` };
    } catch (error) {
      console.error('Error al desactivar sucursal:', error.message);
      return { estado: 'error', resultado: `Error al eliminar: ${error.message}` };
    }
  }
}
