import ProductoControlador from '../adaptador-entrada/ProductoControlador.js';
import ProductoPgsCommandAdaptador from '../adaptador-salida/ProductoPgsCommandAdaptador.js';
import ProductoPgsQueryAdaptador from '../adaptador-salida/ProductoPgsQueryAdaptador.js';
import ProductoCommandUsesCase from '../../aplicacion/uses-cases/command/ProductoCommandUsesCase.js';
import ProductoQueryUsesCase from '../../aplicacion/uses-cases/query/ProductoQueryUsesCase.js';
import { movimientoStockDominioServicio } from './MovimientoStockContenedor.js';

export const productoControlador = new ProductoControlador(
  new ProductoCommandUsesCase(new ProductoPgsCommandAdaptador(movimientoStockDominioServicio)),
  new ProductoQueryUsesCase(new ProductoPgsQueryAdaptador())
);
