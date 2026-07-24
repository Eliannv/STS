// facturacion-servicio/src/aplicacion/puertos/salida/VentaTarjetaSalidaCommandPuerto.js
export default class VentaTarjetaSalidaCommandPuerto {
  registrarAcreditacion(ventaTarjetaId, idempotencyKey, construirAcreditacion) {
    throw new Error('Not implemented');
  }

  actualizarEstadoAbono(id, estado) {
    throw new Error('Not implemented');
  }

  registrarAbono(abono) {
    throw new Error('Not implemented');
  }
}
