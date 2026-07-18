import HistorialClinico from '../../../dominio/entidades/HistorialClinico.js';

export default class HistorialClinicoCommandUsesCase {
  constructor(adaptadorBDSalidaCommand) {
    this.adaptadorBDSalida = adaptadorBDSalidaCommand;
  }

  crear(dtoHistorial) {
    return dtoHistorial.clienteId
      ? this.adaptadorBDSalida.guardar(new HistorialClinico(null, dtoHistorial))
      : Promise.resolve({ estado: 'error', resultado: 'El ID del cliente es requerido' });
  }

  editar(dtoHistorial) {
    return dtoHistorial.id
      ? this.adaptadorBDSalida.actualizar(new HistorialClinico(dtoHistorial.id, dtoHistorial))
      : Promise.resolve({ estado: 'error', resultado: 'El ID es requerido para actualizar' });
  }

  eliminar(dtoHistorial) {
    return dtoHistorial.id
      ? this.adaptadorBDSalida.eliminar(dtoHistorial.id)
      : Promise.resolve({ estado: 'error', resultado: 'El ID es requerido para eliminar' });
  }
}
