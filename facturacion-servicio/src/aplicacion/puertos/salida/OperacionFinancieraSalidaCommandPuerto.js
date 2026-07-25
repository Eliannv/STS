// facturacion-servicio/src/aplicacion/puertos/salida/OperacionFinancieraSalidaCommandPuerto.js
export default class OperacionFinancieraSalidaCommandPuerto {
  save(operacion) {
    throw new Error('Not implemented');
  }

  marcarAplicado(id, respuesta) {
    throw new Error('Not implemented');
  }

  marcarError(id, error) {
    throw new Error('Not implemented');
  }

  marcarDescartado(id, motivo) {
    throw new Error('Not implemented');
  }

  incrementarIntentos(id) {
    throw new Error('Not implemented');
  }
}
