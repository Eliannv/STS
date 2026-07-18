import ClienteSalidaCommandPuerto from '../../aplicacion/puertos/salida/ClienteSalidaCommandPuerto.js';
import { ClienteCommandAdaptador } from './ClienteAdaptadores.js';

export default class ClientePgsCommandAdaptador extends ClienteSalidaCommandPuerto {
  constructor() {
    super();
    this.adaptador = new ClienteCommandAdaptador();
  }

  guardar(cliente) { return this.adaptador.guardar(cliente); }
  actualizar(cliente) { return this.adaptador.actualizar(cliente); }
  eliminar(id) { return this.adaptador.eliminar(id); }
}
