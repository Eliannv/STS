// src/infraestructura/contenedor/IngresoContenedor.js
import IngresoPgsCommandAdaptador from '../adaptador-salida/IngresoPgsCommandAdaptador.js';
import IngresoPgsQueryAdaptador   from '../adaptador-salida/IngresoPgsQueryAdaptador.js';
import IngresoCommandUsesCase     from '../../aplicacion/uses-cases/command/IngresoCommandUsesCase.js';
import IngresoQueryUsesCase       from '../../aplicacion/uses-cases/query/IngresoQueryUsesCase.js';
import IngresoControlador         from '../adaptador-entrada/IngresoControlador.js';

const commandAdaptador = new IngresoPgsCommandAdaptador();
const queryAdaptador   = new IngresoPgsQueryAdaptador();
const commandUC        = new IngresoCommandUsesCase(commandAdaptador);
const queryUC          = new IngresoQueryUsesCase(queryAdaptador);

export const ingresoControlador = new IngresoControlador(commandUC, queryUC);
