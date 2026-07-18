import HistorialClinicoSalidaCommandPuerto from '../../aplicacion/puertos/salida/HistorialClinicoSalidaCommandPuerto.js';
import { HistorialCommandAdaptador } from './HistorialAdaptadores.js';

export default class HistorialClinicoPgsCommandAdaptador extends HistorialClinicoSalidaCommandPuerto {
  constructor() {
    super();
    this.adaptador = new HistorialCommandAdaptador();
  }

  guardar(historial) { return this.adaptador.guardar(historial); }
  actualizar(historial) { return this.adaptador.actualizar(historial); }
  eliminar(id) { return this.adaptador.eliminar(id); }
}
