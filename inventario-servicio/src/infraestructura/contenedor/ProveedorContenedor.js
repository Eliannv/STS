import ProveedorControlador from '../adaptador-entrada/ProveedorControlador.js';
import ProveedorPgsCommandAdaptador from '../adaptador-salida/ProveedorPgsCommandAdaptador.js';
import ProveedorPgsQueryAdaptador from '../adaptador-salida/ProveedorPgsQueryAdaptador.js';
import ProveedorCommandUsesCase from '../../aplicacion/uses-cases/command/ProveedorCommandUsesCase.js';
import ProveedorQueryUsesCase from '../../aplicacion/uses-cases/query/ProveedorQueryUsesCase.js';

export const proveedorControlador = new ProveedorControlador(
  new ProveedorCommandUsesCase(new ProveedorPgsCommandAdaptador()),
  new ProveedorQueryUsesCase(new ProveedorPgsQueryAdaptador())
);
