import CobroDeuda from '../../../dominio/entidades/CobroDeuda.js';

export default class CobroDeudaCommandUsesCase {
  constructor(adaptador) { this.adaptador = adaptador; }
  registrarAbono(datos) {
    if (!datos.facturaId) return Promise.resolve({ estado: 'error', resultado: 'facturaId es requerido' });
    if (!(Number(datos.montoPagado) > 0)) return Promise.resolve({ estado: 'error', resultado: 'El monto pagado debe ser mayor a 0' });
    return this.adaptador.registrarAbono(new CobroDeuda(null, datos));
  }
  registrarMultipleAbonos(abonos) { return Array.isArray(abonos) && abonos.length ? this.adaptador.registrarMultipleAbonos(abonos) : Promise.resolve({ estado: 'error', resultado: 'Se requiere al menos un abono' }); }
}
