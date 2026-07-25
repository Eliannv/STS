// facturacion-servicio/src/infraestructura/contenedor/FacturaContenedor.js
import FacturaControlador from '../adaptador-entrada/FacturaControlador.js';
import FacturaPgsCommandAdaptador from '../adaptador-salida/FacturaPgsCommandAdaptador.js';
import FacturaPgsQueryAdaptador from '../adaptador-salida/FacturaPgsQueryAdaptador.js';
import OperacionFinancieraPgsCommandAdaptador from '../adaptador-salida/OperacionFinancieraPgsCommandAdaptador.js';
import OperacionFinancieraPgsQueryAdaptador from '../adaptador-salida/OperacionFinancieraPgsQueryAdaptador.js';
import CajaHttpAdaptador from '../adaptador-salida/CajaHttpAdaptador.js';
import WorkerOperacionesPendientes from '../servicio/WorkerOperacionesPendientes.js';
import FacturaCommandUsesCase from '../../aplicacion/uses-cases/command/FacturaCommandUsesCase.js';
import FacturaQueryUsesCase from '../../aplicacion/uses-cases/query/FacturaQueryUsesCase.js';
import InventarioStockHttpAdaptador from '../adaptador-salida/InventarioStockHttpAdaptador.js';
import VentaTarjetaPgsCommandAdaptador from '../adaptador-salida/VentaTarjetaPgsCommandAdaptador.js';

const operacionCommand = new OperacionFinancieraPgsCommandAdaptador();
const operacionQuery = new OperacionFinancieraPgsQueryAdaptador();
const cajaHttp = new CajaHttpAdaptador(process.env.CAJA_SERVICIO_URL);
const command = new FacturaPgsCommandAdaptador(operacionCommand);
const query = new FacturaPgsQueryAdaptador();
const queryUsesCase = new FacturaQueryUsesCase(query);
const inventarioStock = new InventarioStockHttpAdaptador(
  process.env.INVENTARIO_SERVICIO_URL,
);
const ventaTarjetaCommand = new VentaTarjetaPgsCommandAdaptador();

export const workerOperacionesPendientes = new WorkerOperacionesPendientes(
  operacionQuery,
  operacionCommand,
  cajaHttp,
  ventaTarjetaCommand,
);

export const facturaControlador = new FacturaControlador(
  new FacturaCommandUsesCase(
    command,
    query,
    inventarioStock,
    operacionCommand,
    cajaHttp,
    operacionQuery,
  ),
  queryUsesCase,
);
