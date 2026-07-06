// src/aplicacion/puertos/salida/VentaTarjetaSalidaCommandPuerto.js
/**
 * Puerto de salida (Command) para Ventas con Tarjeta
 * Define contrato para operaciones de escritura en BD
 */
export default class VentaTarjetaSalidaCommandPuerto {
  async registrarAbono(abono) {
    throw new Error('registrarAbono() debe ser implementado');
  }
}
