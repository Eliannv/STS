import InventarioUsesCases from '../../aplicacion/uses-cases/InventarioUsesCases.js';
import InventarioAdaptador from '../adaptador-salida/InventarioAdaptador.js';
import InventarioControlador from '../adaptador-entrada/InventarioControlador.js';
import { movimientoStockDominioServicio } from './MovimientoStockContenedor.js';
const adaptador = new InventarioAdaptador(movimientoStockDominioServicio);
export const inventarioControlador = new InventarioControlador(new InventarioUsesCases(adaptador));
