import ProveedorSalidaCommandPuerto from '../../aplicacion/puertos/salida/ProveedorSalidaCommandPuerto.js';
import { Proveedor as ProveedorModel } from '../modelos/Modelos.js';

const aPersistencia = (proveedor) => ({
  codigo: proveedor.codigo,
  nombre: proveedor.nombre,
  representante: proveedor.representante,
  ruc: proveedor.ruc,
  telefono_principal: proveedor.telefonoPrincipal,
  telefono_secundario: proveedor.telefonoSecundario,
  codigo_lugar: proveedor.codigoLugar,
  direccion: proveedor.direccion,
  fecha_ingreso: proveedor.fechaIngreso,
  saldo: proveedor.saldo,
  activo: proveedor.activo,
  updated_at: new Date()
});

export default class ProveedorPgsCommandAdaptador extends ProveedorSalidaCommandPuerto {
  async guardar(proveedor) {
    try {
      const creado = await ProveedorModel.create({ ...aPersistencia(proveedor), created_at: new Date() });
      return { estado: 'ok', resultado: creado };
    } catch (error) {
      return { estado: 'error', resultado: error.message };
    }
  }

  async actualizar(proveedor) {
    try {
      const [cantidad] = await ProveedorModel.update(aPersistencia(proveedor), { where: { id: proveedor.id } });
      return cantidad ? { estado: 'ok', resultado: 'Proveedor actualizado correctamente' } : { estado: 'error', resultado: 'Proveedor no encontrado' };
    } catch (error) {
      return { estado: 'error', resultado: error.message };
    }
  }

  async eliminar(id) {
    const [cantidad] = await ProveedorModel.update({ activo: false, updated_at: new Date() }, { where: { id } });
    return cantidad ? { estado: 'ok', resultado: 'Proveedor desactivado correctamente' } : { estado: 'error', resultado: 'Proveedor no encontrado' };
  }
}
