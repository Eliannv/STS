// src/aplicacion/puertos/salida/CobroDeudaCommandSalidaPuerto.js
/**
 * Puerto de salida (Command) para Cobro de Deuda
 * Define contrato para operaciones de escritura en BD
 */
export default class CobroDeudaCommandSalidaPuerto {
  async registrarAbono(abono) {
    throw new Error('registrarAbono() debe ser implementado');
  }

  async registrarMultipleAbonos(abonos) {
    throw new Error('registrarMultipleAbonos() debe ser implementado');
  }
}
