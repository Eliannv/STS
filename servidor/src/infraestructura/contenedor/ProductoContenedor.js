// src/infraestructura/contenedor/ProductoContenedor.js
import ProductoPgsCommandAdaptador from '../adaptador-salida/ProductoPgsCommandAdaptador.js';
import ProductoPgsQueryAdaptador   from '../adaptador-salida/ProductoPgsQueryAdaptador.js';
import ProductoCommandUsesCase     from '../../aplicacion/uses-cases/command/ProductoCommandUsesCase.js';
import ProductoQueryUsesCase       from '../../aplicacion/uses-cases/query/ProductoQueryUsesCase.js';
import ProductoControlador         from '../adaptador-entrada/ProductoControlador.js';

const commandAdaptador = new ProductoPgsCommandAdaptador();
const queryAdaptador   = new ProductoPgsQueryAdaptador();
const commandUC        = new ProductoCommandUsesCase(commandAdaptador);
const queryUC          = new ProductoQueryUsesCase(queryAdaptador);

export const productoControlador = new ProductoControlador(commandUC, queryUC);
