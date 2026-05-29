// src/infraestructura/contenedor/CajaChicaContenedor.js
import CajaChicaPgsCommandAdaptador from '../adaptador-salida/CajaChicaPgsCommandAdaptador.js';
import CajaChicaPgsQueryAdaptador   from '../adaptador-salida/CajaChicaPgsQueryAdaptador.js';
import CajaChicaCommandUsesCase     from '../../aplicacion/uses-cases/command/CajaChicaCommandUsesCase.js';
import CajaChicaQueryUsesCase       from '../../aplicacion/uses-cases/query/CajaChicaQueryUsesCase.js';
import CajaChicaControlador         from '../adaptador-entrada/CajaChicaControlador.js';

const commandAdaptador = new CajaChicaPgsCommandAdaptador();
const queryAdaptador   = new CajaChicaPgsQueryAdaptador();
const commandUC        = new CajaChicaCommandUsesCase(commandAdaptador);
const queryUC          = new CajaChicaQueryUsesCase(queryAdaptador);

export const cajaChicaControlador = new CajaChicaControlador(commandUC, queryUC);
