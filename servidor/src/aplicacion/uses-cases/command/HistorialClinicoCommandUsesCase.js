// src/aplicacion/uses-cases/command/HistorialClinicoCommandUsesCase.js
import HistorialClinico from '../../../dominio/entidades/HistorialClinico.js';

export default class HistorialClinicoCommandUsesCase {
  constructor(adaptadorBDSalidaCommand) {
    this.adaptadorBDSalida = adaptadorBDSalidaCommand;
  }

  async crear(dtoHistorial) {
    if (!dtoHistorial.getClienteId()) {
      return { estado: 'error', resultado: 'El ID del cliente es requerido' };
    }

    const historial = new HistorialClinico(
      null,
      dtoHistorial.getClienteId(),
      dtoHistorial.getOdEsfera(),   dtoHistorial.getOdCilindro(),
      dtoHistorial.getOdEje(),      dtoHistorial.getOdAvsc(),     dtoHistorial.getOdAvcc(),
      dtoHistorial.getOiEsfera(),   dtoHistorial.getOiCilindro(),
      dtoHistorial.getOiEje(),      dtoHistorial.getOiAvsc(),     dtoHistorial.getOiAvcc(),
      dtoHistorial.getDp(),         dtoHistorial.getAdd(),
      dtoHistorial.getDe(),         dtoHistorial.getAltura(),
      dtoHistorial.getColor(),      dtoHistorial.getObservacion(),
      dtoHistorial.getArmazonH(),   dtoHistorial.getArmazonV(),   dtoHistorial.getArmazonDbl(),
      dtoHistorial.getArmazonDm(),  dtoHistorial.getArmazonTipo(),
      dtoHistorial.getDoctor(),     dtoHistorial.getFechaChequeo(), dtoHistorial.getHoraChequeo()
    );

    return await this.adaptadorBDSalida.guardar(historial);
  }

  async editar(dtoHistorial) {
    if (!dtoHistorial.getId()) {
      return { estado: 'error', resultado: 'El ID es requerido para actualizar' };
    }

    const historial = new HistorialClinico(
      dtoHistorial.getId(),
      dtoHistorial.getClienteId(),
      dtoHistorial.getOdEsfera(),   dtoHistorial.getOdCilindro(),
      dtoHistorial.getOdEje(),      dtoHistorial.getOdAvsc(),     dtoHistorial.getOdAvcc(),
      dtoHistorial.getOiEsfera(),   dtoHistorial.getOiCilindro(),
      dtoHistorial.getOiEje(),      dtoHistorial.getOiAvsc(),     dtoHistorial.getOiAvcc(),
      dtoHistorial.getDp(),         dtoHistorial.getAdd(),
      dtoHistorial.getDe(),         dtoHistorial.getAltura(),
      dtoHistorial.getColor(),      dtoHistorial.getObservacion(),
      dtoHistorial.getArmazonH(),   dtoHistorial.getArmazonV(),   dtoHistorial.getArmazonDbl(),
      dtoHistorial.getArmazonDm(),  dtoHistorial.getArmazonTipo(),
      dtoHistorial.getDoctor(),     dtoHistorial.getFechaChequeo(), dtoHistorial.getHoraChequeo()
    );

    return await this.adaptadorBDSalida.actualizar(historial);
  }

  async eliminar(dtoHistorial) {
    if (!dtoHistorial.getId()) {
      return { estado: 'error', resultado: 'El ID es requerido para eliminar' };
    }
    return await this.adaptadorBDSalida.eliminar(dtoHistorial.getId());
  }
}
