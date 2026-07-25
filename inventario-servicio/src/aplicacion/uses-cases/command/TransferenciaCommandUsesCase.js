import Transferencia from '../../../dominio/entidades/Transferencia.js';

export default class TransferenciaCommandUsesCase {
  constructor(transferenciaCommand) {
    this.transferenciaCommand = transferenciaCommand;
  }

  crear(datos) {
    const transferencia = new Transferencia(datos);
    const error = transferencia.validar();
    if (error) return Promise.resolve({ estado: 'error', resultado: error });
    return this.transferenciaCommand.crear(transferencia);
  }

  anular(id, datos = {}) {
    if (!id) return Promise.resolve({ estado: 'error', resultado: 'El ID es requerido' });
    if (!datos.motivo) return Promise.resolve({ estado: 'error', resultado: 'El motivo de anulación es requerido' });
    if (!datos.operacionId || !datos.idempotencyKey) {
      return Promise.resolve({ estado: 'error', resultado: 'operacionId e idempotencyKey son requeridos' });
    }
    return this.transferenciaCommand.anular(id, datos);
  }
}
