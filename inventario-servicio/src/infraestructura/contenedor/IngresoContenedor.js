// inventario-servicio/src/infraestructura/contenedor/IngresoContenedor.js
import IngresoControlador from '../adaptador-entrada/IngresoControlador.js';
import IngresoPgsCommandAdaptador from '../adaptador-salida/IngresoPgsCommandAdaptador.js';
import IngresoPgsQueryAdaptador from '../adaptador-salida/IngresoPgsQueryAdaptador.js';
import IngresoCommandUsesCase from '../../aplicacion/uses-cases/command/IngresoCommandUsesCase.js';
import IngresoQueryUsesCase from '../../aplicacion/uses-cases/query/IngresoQueryUsesCase.js';
import { movimientoStockDominioServicio } from './MovimientoStockContenedor.js';
import CompraDominioServicio from '../../dominio/servicios/CompraDominioServicio.js';
import OperacionFinancieraInventarioPgsCommandAdaptador from '../adaptador-salida/OperacionFinancieraInventarioPgsCommandAdaptador.js';
import OperacionFinancieraInventarioPgsQueryAdaptador from '../adaptador-salida/OperacionFinancieraInventarioPgsQueryAdaptador.js';
import CajaHttpAdaptador from '../adaptador-salida/CajaHttpAdaptador.js';
import WorkerOperacionesPendientesInventario from '../servicio/WorkerOperacionesPendientesInventario.js';

const compraDominioServicio = new CompraDominioServicio();
const operacionFinancieraCommand =
  new OperacionFinancieraInventarioPgsCommandAdaptador();
const operacionFinancieraQuery =
  new OperacionFinancieraInventarioPgsQueryAdaptador();
const cajaSalida = new CajaHttpAdaptador();
const command = new IngresoPgsCommandAdaptador(
  movimientoStockDominioServicio,
  compraDominioServicio,
  operacionFinancieraCommand,
);
const query = new IngresoPgsQueryAdaptador();
const ingresoCommandUC = new IngresoCommandUsesCase(
  command,
  operacionFinancieraCommand,
  cajaSalida,
);
export const ingresoControlador = new IngresoControlador(
  ingresoCommandUC,
  new IngresoQueryUsesCase(query),
);
export const workerOperacionesPendientesInventario =
  new WorkerOperacionesPendientesInventario(
    operacionFinancieraQuery,
    operacionFinancieraCommand,
    cajaSalida,
  );
