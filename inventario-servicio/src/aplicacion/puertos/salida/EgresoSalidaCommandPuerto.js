// inventario-servicio/src/aplicacion/puertos/salida/EgresoSalidaCommandPuerto.js
export default class EgresoSalidaCommandPuerto {
  enTransaccion(work) { throw new Error('Not implemented'); }
  save(egreso, options) { throw new Error('Not implemented'); }
  update(id, campos, options) { throw new Error('Not implemented'); }
  confirmar(id, datosConfirmacion, options) { throw new Error('Not implemented'); }
  anular(id, datosAnulacion, options) { throw new Error('Not implemented'); }
  descartar(id, datosDescarte, options) { throw new Error('Not implemented'); }
  saveDetalle(detalle, options) { throw new Error('Not implemented'); }
  deleteDetalle(id, egresoId, options) { throw new Error('Not implemented'); }
}
