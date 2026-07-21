import IngresoControlador from '../adaptador-entrada/IngresoControlador.js';
import IngresoPgsCommandAdaptador from '../adaptador-salida/IngresoPgsCommandAdaptador.js';
import IngresoPgsQueryAdaptador from '../adaptador-salida/IngresoPgsQueryAdaptador.js';
import IngresoCommandUsesCase from '../../aplicacion/uses-cases/command/IngresoCommandUsesCase.js';
import IngresoQueryUsesCase from '../../aplicacion/uses-cases/query/IngresoQueryUsesCase.js';
import { movimientoStockDominioServicio } from './MovimientoStockContenedor.js';

const command = new IngresoPgsCommandAdaptador(movimientoStockDominioServicio);
const query = new IngresoPgsQueryAdaptador();
export const ingresoControlador = new IngresoControlador(new IngresoCommandUsesCase(command), new IngresoQueryUsesCase(query));
