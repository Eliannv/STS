import MovimientoStockDominioServicio from '../../dominio/servicios/MovimientoStockDominioServicio.js';
import MovimientoStockCommandUsesCase from '../../aplicacion/uses-cases/command/MovimientoStockCommandUsesCase.js';
import MovimientoStockQueryUsesCase from '../../aplicacion/uses-cases/query/MovimientoStockQueryUsesCase.js';
import MovimientoStockControlador from '../adaptador-entrada/MovimientoStockControlador.js';
import MovimientoStockPgsCommandAdaptador from '../adaptador-salida/MovimientoStockPgsCommandAdaptador.js';
import MovimientoStockPgsQueryAdaptador from '../adaptador-salida/MovimientoStockPgsQueryAdaptador.js';
import ProductoStockGlobalPgsAdaptador from '../adaptador-salida/ProductoStockGlobalPgsAdaptador.js';

export const existenciaStockAdaptador = new ProductoStockGlobalPgsAdaptador();
export const movimientoStockCommandAdaptador = new MovimientoStockPgsCommandAdaptador(existenciaStockAdaptador);
export const movimientoStockDominioServicio = new MovimientoStockDominioServicio(movimientoStockCommandAdaptador);

export const movimientoStockControlador = new MovimientoStockControlador(
  new MovimientoStockCommandUsesCase(movimientoStockDominioServicio),
  new MovimientoStockQueryUsesCase(new MovimientoStockPgsQueryAdaptador()),
);
