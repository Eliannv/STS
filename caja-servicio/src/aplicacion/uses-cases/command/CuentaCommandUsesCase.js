import Cuenta from '../../../dominio/entidades/Cuenta.js';

export default class CuentaCommandUsesCase {
  constructor(command) { this.command = command; }
  crear(datos) {
    if (!datos.fecha || !datos.tipo || !(Number(datos.montoTotal) > 0) || !datos.observacion) return Promise.resolve({ estado: 'error', resultado: 'Fecha, tipo, monto total y observación son requeridos' });
    return this.command.crear(new Cuenta(null, { ...datos, saldo: Number(datos.montoTotal) - Number(datos.montoAbonado || 0) }));
  }
  actualizar(id, datos) { return id ? this.command.actualizar(id, new Cuenta(id, datos)) : Promise.resolve({ estado: 'error', resultado: 'El id es requerido' }); }
  cancelar(id) { return id ? this.command.cancelar(id) : Promise.resolve({ estado: 'error', resultado: 'El id es requerido' }); }
}
