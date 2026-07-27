// cliente-servicio/src/infraestructura/contenedor/FichaClienteContenedor.js
import FichaClienteControlador from '../adaptador-entrada/FichaClienteControlador.js';
import FichaClienteQueryUsesCase from '../../aplicacion/uses-cases/query/FichaClienteQueryUsesCase.js';
import FichaClienteHttpAdaptador from '../adaptador-salida/FichaClienteHttpAdaptador.js';
import ClientePgsQueryAdaptador from '../adaptador-salida/ClientePgsQueryAdaptador.js';
import HistorialClinicoPgsQueryAdaptador from '../adaptador-salida/HistorialClinicoPgsQueryAdaptador.js';
import ClienteQueryUsesCase from '../../aplicacion/uses-cases/query/ClienteQueryUsesCase.js';
import HistorialClinicoQueryUsesCase from '../../aplicacion/uses-cases/query/HistorialClinicoQueryUsesCase.js';

// Cliente e historial se reutilizan por sus casos de uso existentes: la ficha no
// duplica su lógica de consulta.
export const fichaClienteControlador = new FichaClienteControlador(
  new FichaClienteQueryUsesCase(
    new ClienteQueryUsesCase(new ClientePgsQueryAdaptador()),
    new HistorialClinicoQueryUsesCase(new HistorialClinicoPgsQueryAdaptador()),
    new FichaClienteHttpAdaptador(),
  ),
);
