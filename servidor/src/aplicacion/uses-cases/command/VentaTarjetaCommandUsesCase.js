// src/aplicacion/uses-cases/command/VentaTarjetaCommandUsesCase.js
import { VentaTarjetaAbonoDTO } from '../../dto/VentaTarjetaDTO.js';

/**
 * Use Case de Comando para Ventas con Tarjeta
 * Orquesta la lógica de registrar abonos del banco
 */
export default class VentaTarjetaCommandUsesCase {
  constructor(ventaTarjetaCommandAdaptador) {
    this._adaptador = ventaTarjetaCommandAdaptador;
  }

  async registrarAbono(datos) {
    const dto = new VentaTarjetaAbonoDTO(datos);

    // Validaciones
    if (!dto.getVentaTarjetaId())
      return { estado: 'error', resultado: 'ventaTarjetaId es requerido' };

    if (dto.getMonto() <= 0)
      return { estado: 'error', resultado: 'El monto debe ser mayor a 0' };

    return this._adaptador.registrarAbono(dto);
  }
}
