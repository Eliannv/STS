// src/infraestructura/adaptador-salida/ClientePgsCommandAdaptador.js
import ClienteSalidaCommandPuerto from '../../aplicacion/puertos/salida/ClienteSalidaCommandPuerto.js';
import postgresql from '../base-dato/Postgresql.js';

export default class ClientePgsCommandAdaptador extends ClienteSalidaCommandPuerto {

  guardar = async (cliente) => {
    try {
      const result = await postgresql.query(
        `INSERT INTO clientes
           (nombres, apellidos, cedula, telefono, email, fecha_nacimiento,
            direccion, pais, provincia, ciudad, activo,
            tiene_historial_clinico, tiene_credito, tiene_deuda,
            es_consumidor_final, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW())
         RETURNING id`,
        [
          cliente.nombres, cliente.apellidos, cliente.cedula,
          cliente.telefono, cliente.email, cliente.fechaNacimiento,
          cliente.direccion, cliente.pais, cliente.provincia, cliente.ciudad,
          cliente.activo, cliente.tieneHistorialClinico,
          cliente.tieneCredito, cliente.tieneDeuda, cliente.esConsumidorFinal
        ]
      );
      const id = result.rows[0].id;
      console.log(`Cliente creado con ID: ${id}`);
      return { estado: 'ok', resultado: `Cliente creado con ID ${id}` };
    } catch (error) {
      console.error('Error al guardar cliente:', error.message);
      if (error.code === '23505') {
        return { estado: 'error', resultado: 'La cédula ya está registrada' };
      }
      return { estado: 'error', resultado: `Error al crear cliente: ${error.message}` };
    }
  }

  actualizar = async (cliente) => {
    try {
      const result = await postgresql.query(
        `UPDATE clientes
         SET nombres=$1, apellidos=$2, cedula=$3, telefono=$4, email=$5,
             fecha_nacimiento=$6, direccion=$7, pais=$8, provincia=$9, ciudad=$10,
             activo=$11, tiene_historial_clinico=$12, tiene_credito=$13,
             tiene_deuda=$14, es_consumidor_final=$15, updated_at=NOW()
         WHERE id=$16 RETURNING id`,
        [
          cliente.nombres, cliente.apellidos, cliente.cedula,
          cliente.telefono, cliente.email, cliente.fechaNacimiento,
          cliente.direccion, cliente.pais, cliente.provincia, cliente.ciudad,
          cliente.activo, cliente.tieneHistorialClinico,
          cliente.tieneCredito, cliente.tieneDeuda, cliente.esConsumidorFinal,
          cliente.id
        ]
      );
      if (result.rowCount === 0) {
        return { estado: 'error', resultado: `No se encontró el cliente con ID ${cliente.id}` };
      }
      return { estado: 'ok', resultado: `Cliente con ID ${cliente.id} actualizado correctamente` };
    } catch (error) {
      console.error('Error al actualizar cliente:', error.message);
      if (error.code === '23505') {
        return { estado: 'error', resultado: 'La cédula ya está registrada' };
      }
      return { estado: 'error', resultado: `Error al actualizar: ${error.message}` };
    }
  }

  eliminar = async (id) => {
    try {
      const result = await postgresql.query(
        'UPDATE clientes SET activo=false, updated_at=NOW() WHERE id=$1 RETURNING id',
        [id]
      );
      if (result.rowCount === 0) {
        return { estado: 'error', resultado: `No se encontró el cliente con ID ${id}` };
      }
      return { estado: 'ok', resultado: `Cliente con ID ${id} desactivado correctamente` };
    } catch (error) {
      console.error('Error al desactivar cliente:', error.message);
      return { estado: 'error', resultado: `Error al eliminar: ${error.message}` };
    }
  }
}
