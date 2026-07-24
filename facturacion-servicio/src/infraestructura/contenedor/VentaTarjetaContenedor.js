// facturacion-servicio/src/infraestructura/contenedor/VentaTarjetaContenedor.js
import AcreditacionTarjetaDominioServicio from '../../dominio/servicios/AcreditacionTarjetaDominioServicio.js';
import VentaTarjetaControlador from '../adaptador-entrada/VentaTarjetaControlador.js';
import VentaTarjetaPgsCommandAdaptador from '../adaptador-salida/VentaTarjetaPgsCommandAdaptador.js';
import VentaTarjetaPgsQueryAdaptador from '../adaptador-salida/VentaTarjetaPgsQueryAdaptador.js';
import OperacionFinancieraPgsCommandAdaptador from '../adaptador-salida/OperacionFinancieraPgsCommandAdaptador.js';
import CajaHttpAdaptador from '../adaptador-salida/CajaHttpAdaptador.js';
import VentaTarjetaCommandUsesCase from '../../aplicacion/uses-cases/command/VentaTarjetaCommandUsesCase.js';
import VentaTarjetaQueryUsesCase from '../../aplicacion/uses-cases/query/VentaTarjetaQueryUsesCase.js';

const command = new VentaTarjetaPgsCommandAdaptador();
const query = new VentaTarjetaPgsQueryAdaptador();
const operacionCommand = new OperacionFinancieraPgsCommandAdaptador();
const cajaHttp = new CajaHttpAdaptador(process.env.CAJA_SERVICIO_URL);
const dominioServicio = new AcreditacionTarjetaDominioServicio();

export const ventaTarjetaControlador = new VentaTarjetaControlador(
  new VentaTarjetaCommandUsesCase(
    command,
    operacionCommand,
    cajaHttp,
    dominioServicio,
  ),
  new VentaTarjetaQueryUsesCase(query),
);
