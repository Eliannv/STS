// inventario-servicio/src/aplicacion/puertos/salida/OperacionFinancieraInventarioSalidaCommandPuerto.js
export default class OperacionFinancieraInventarioSalidaCommandPuerto {
  save(operacion, options) { throw new Error('Not implemented'); }
  marcarAplicada(id, respuesta) { throw new Error('Not implemented'); }
  registrarFallo(id, error, proximoReintentoEn) { throw new Error('Not implemented'); }
  marcarDescartada(id, motivo) { throw new Error('Not implemented'); }
  vincularCuentaPagar(id, cuentaPagarId) { throw new Error('Not implemented'); }
}
