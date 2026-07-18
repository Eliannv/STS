import HistorialClinicoSalidaQueryPuerto from '../../aplicacion/puertos/salida/HistorialClinicoSalidaQueryPuerto.js';
import { HistorialQueryAdaptador } from './HistorialAdaptadores.js';

export default class HistorialClinicoPgsQueryAdaptador extends HistorialClinicoSalidaQueryPuerto {
  constructor() {
    super();
    this.adaptador = new HistorialQueryAdaptador();
  }

  listaPorCliente(clienteId) { return this.adaptador.listaPorCliente(clienteId); }
  buscarPorId(id) { return this.adaptador.buscarPorId(id); }
}
