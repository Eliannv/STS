import CuentaControlador from '../adaptador-entrada/CuentaControlador.js';
import CuentaPgsCommandAdaptador from '../adaptador-salida/CuentaPgsCommandAdaptador.js';
import CuentaPgsQueryAdaptador from '../adaptador-salida/CuentaPgsQueryAdaptador.js';
import CuentaCommandUsesCase from '../../aplicacion/uses-cases/command/CuentaCommandUsesCase.js';
import CuentaQueryUsesCase from '../../aplicacion/uses-cases/query/CuentaQueryUsesCase.js';

export const cuentaControlador = new CuentaControlador(new CuentaCommandUsesCase(new CuentaPgsCommandAdaptador()), new CuentaQueryUsesCase(new CuentaPgsQueryAdaptador()));
