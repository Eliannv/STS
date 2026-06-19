// src/aplicacion/uses-cases/command/CobroDeudaCommandUsesCase.js
import CobroDeuda from '../../../dominio/entidades/CobroDeuda.js';
import { CobroDeudaDTO } from '../../dto/CobroDeudaDTO.js';

/**
 * Use Case de Comando para Cobro de Deuda
 * Orquesta la lógica de registrar abonos parciales
 */
export default class CobroDeudaCommandUsesCase {
  constructor(cobroDeudaCommandAdaptador) {
    this._adaptador = cobroDeudaCommandAdaptador;
  }

  async registrarAbono(datos) {
    const dto = new CobroDeudaDTO(datos);
    
    // Validaciones
    if (!dto.getFacturaId())
      return { estado: 'error', resultado: 'facturaId es requerido' };
    if (dto.getMontoPagado() <= 0)
      return { estado: 'error', resultado: 'El monto pagado debe ser mayor a 0' };

    const abono = new CobroDeuda(
      null,
      dto.getFacturaId(),
      dto.getFechaPago(),
      dto.getMontoPagado(),
      dto.getMetodoPago(),
      dto.getUsuarioId(),
      dto.getObservacion(),
      dto.getSaldoAnterior(),
      dto.getSaldoNuevo()
    );

    return this._adaptador.registrarAbono(abono);
  }

  async registrarMultipleAbonos(abonos) {
    if (!Array.isArray(abonos) || abonos.length === 0)
      return { estado: 'error', resultado: 'Se requiere al menos un abono' };

    return this._adaptador.registrarMultipleAbonos(abonos);
  }
}
