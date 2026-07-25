import MovimientoStockDominioServicio from '../../dominio/servicios/MovimientoStockDominioServicio.js';
import MovimientoStockCommandUsesCase from '../../aplicacion/uses-cases/command/MovimientoStockCommandUsesCase.js';
import MovimientoStockQueryUsesCase from '../../aplicacion/uses-cases/query/MovimientoStockQueryUsesCase.js';
import MovimientoStockControlador from '../adaptador-entrada/MovimientoStockControlador.js';
import MovimientoStockPgsCommandAdaptador from '../adaptador-salida/MovimientoStockPgsCommandAdaptador.js';
import MovimientoStockPgsQueryAdaptador from '../adaptador-salida/MovimientoStockPgsQueryAdaptador.js';
import ProductoStockPorSucursalPgsAdaptador from '../adaptador-salida/ProductoStockPorSucursalPgsAdaptador.js';

export const existenciaStockAdaptador = new ProductoStockPorSucursalPgsAdaptador();
export const movimientoStockCommandAdaptador = new MovimientoStockPgsCommandAdaptador(existenciaStockAdaptador);
export const movimientoStockDominioServicio = new MovimientoStockDominioServicio(movimientoStockCommandAdaptador);

export const movimientoStockControlador = new MovimientoStockControlador(
  new MovimientoStockCommandUsesCase(movimientoStockDominioServicio),
  new MovimientoStockQueryUsesCase(new MovimientoStockPgsQueryAdaptador()),
);
