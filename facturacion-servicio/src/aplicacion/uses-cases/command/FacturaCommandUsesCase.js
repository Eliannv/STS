import Factura from '../../../dominio/entidades/Factura.js';

export default class FacturaCommandUsesCase {
  constructor(adaptador) { this.adaptador = adaptador; }

  crear(datos) {
    if (datos.total == null) return Promise.resolve({ estado: 'error', resultado: 'total es requerido' });
    if (!datos.clienteId && !datos.nombreCliente) return Promise.resolve({ estado: 'error', resultado: 'Se requiere cliente o nombre de cliente' });
    return this.adaptador.guardar(new Factura(null, datos));
  }

  editar(datos) {
    if (!datos.id) return Promise.resolve({ estado: 'error', resultado: 'id es requerido' });
    if (!datos.clienteId) return Promise.resolve({ estado: 'error', resultado: 'clienteId es requerido' });
    return this.adaptador.actualizar(new Factura(datos.id, datos));
  }

  cobrar(id) { return id ? this.adaptador.cobrar(id) : Promise.resolve({ estado: 'error', resultado: 'id es requerido' }); }
  anular(id) { return id ? this.adaptador.anular(id) : Promise.resolve({ estado: 'error', resultado: 'id es requerido' }); }
  eliminar(id) { return id ? this.adaptador.eliminar(id) : Promise.resolve({ estado: 'error', resultado: 'id es requerido' }); }
}
