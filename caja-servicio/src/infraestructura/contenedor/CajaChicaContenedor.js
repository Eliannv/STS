import CajaChicaControlador from '../adaptador-entrada/CajaChicaControlador.js';
import CajaChicaPgsCommandAdaptador from '../adaptador-salida/CajaChicaPgsCommandAdaptador.js';
import CajaChicaPgsQueryAdaptador from '../adaptador-salida/CajaChicaPgsQueryAdaptador.js';
import CajaChicaCommandUsesCase from '../../aplicacion/uses-cases/command/CajaChicaCommandUsesCase.js';
import CajaChicaQueryUsesCase from '../../aplicacion/uses-cases/query/CajaChicaQueryUsesCase.js';

const query = new CajaChicaPgsQueryAdaptador();
export const cajaChicaControlador = new CajaChicaControlador(new CajaChicaCommandUsesCase(new CajaChicaPgsCommandAdaptador(), query), new CajaChicaQueryUsesCase(query));
