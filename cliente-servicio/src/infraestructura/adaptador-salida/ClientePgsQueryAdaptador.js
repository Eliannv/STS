import ClienteSalidaQueryPuerto from '../../aplicacion/puertos/salida/ClienteSalidaQueryPuerto.js';
import { ClienteQueryAdaptador } from './ClienteAdaptadores.js';

export default class ClientePgsQueryAdaptador extends ClienteSalidaQueryPuerto {
  constructor() {
    super();
    this.adaptador = new ClienteQueryAdaptador();
  }

  lista(buscar, pag) { return this.adaptador.lista(buscar, pag); }
  buscarPorId(id) { return this.adaptador.buscarPorId(id); }
}
