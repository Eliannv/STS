import { VentaTarjetaAbonoDTO } from '../../dto/VentaTarjetaDTO.js';

export default class VentaTarjetaCommandUsesCase {
  constructor(adaptador) { this.adaptador = adaptador; }
  registrarAbono(datos) {
    const dto = new VentaTarjetaAbonoDTO(datos);
    if (!dto.ventaTarjetaId) return Promise.resolve({ estado: 'error', resultado: 'ventaTarjetaId es requerido' });
    if (!(dto.monto > 0)) return Promise.resolve({ estado: 'error', resultado: 'El monto debe ser mayor a 0' });
    return this.adaptador.registrarAbono(dto);
  }
}
