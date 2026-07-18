import ProductoControlador from '../adaptador-entrada/ProductoControlador.js';
import ProductoPgsCommandAdaptador from '../adaptador-salida/ProductoPgsCommandAdaptador.js';
import ProductoPgsQueryAdaptador from '../adaptador-salida/ProductoPgsQueryAdaptador.js';
import ProductoCommandUsesCase from '../../aplicacion/uses-cases/command/ProductoCommandUsesCase.js';
import ProductoQueryUsesCase from '../../aplicacion/uses-cases/query/ProductoQueryUsesCase.js';

export const productoControlador = new ProductoControlador(
  new ProductoCommandUsesCase(new ProductoPgsCommandAdaptador()),
  new ProductoQueryUsesCase(new ProductoPgsQueryAdaptador())
);
