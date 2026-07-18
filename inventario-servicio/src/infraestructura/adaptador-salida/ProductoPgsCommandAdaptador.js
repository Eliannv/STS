import ProductoSalidaCommandPuerto from '../../aplicacion/puertos/salida/ProductoSalidaCommandPuerto.js';
import { Producto as ProductoModel } from '../modelos/Modelos.js';

const aPersistencia = (producto) => ({
  id_interno: producto.idInterno,
  codigo: producto.codigo,
  nombre: producto.nombre,
  modelo: producto.modelo,
  color: producto.color,
  grupo: producto.grupo,
  stock: producto.stock,
  tipo_control_stock: producto.tipoControlStock,
  costo: producto.costo,
  pvp1: producto.pvp1,
  iva: producto.iva,
  precio_con_iva: producto.precioConIva,
  proveedor_id: producto.proveedorId,
  ingreso_id: producto.ingresoId,
  observacion: producto.observacion,
  activo: producto.activo,
  updated_at: new Date()
});

export default class ProductoPgsCommandAdaptador extends ProductoSalidaCommandPuerto {
  async guardar(producto) {
    try {
      const creado = await ProductoModel.create({ ...aPersistencia(producto), created_at: new Date() });
      return { estado: 'ok', resultado: creado };
    } catch (error) {
      return { estado: 'error', resultado: error.message };
    }
  }

  async actualizar(producto) {
    try {
      const [cantidad] = await ProductoModel.update(aPersistencia(producto), { where: { id: producto.id } });
      return cantidad ? { estado: 'ok', resultado: 'Producto actualizado correctamente' } : { estado: 'error', resultado: 'Producto no encontrado' };
    } catch (error) {
      return { estado: 'error', resultado: error.message };
    }
  }

  async eliminar(id) {
    const [cantidad] = await ProductoModel.update({ activo: false, updated_at: new Date() }, { where: { id } });
    return cantidad ? { estado: 'ok', resultado: 'Producto desactivado correctamente' } : { estado: 'error', resultado: 'Producto no encontrado' };
  }
}
