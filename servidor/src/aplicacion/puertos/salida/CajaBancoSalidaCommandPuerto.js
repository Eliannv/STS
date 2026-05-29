// src/aplicacion/puertos/salida/CajaBancoSalidaCommandPuerto.js
export default class CajaBancoSalidaCommandPuerto {
  abrir(caja)                        { throw new Error('abrir no implementado') }
  cerrar(id, datosCierre)            { throw new Error('cerrar no implementado') }
  registrarMovimiento(movimiento)    { throw new Error('registrarMovimiento no implementado') }
  eliminarMovimiento(movimientoId)   { throw new Error('eliminarMovimiento no implementado') }
}
