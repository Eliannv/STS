import CobroDeudaControlador from '../adaptador-entrada/CobroDeudaControlador.js';
import CobroDeudaPgsCommandAdaptador from '../adaptador-salida/CobroDeudaPgsCommandAdaptador.js';
import CobroDeudaPgsQueryAdaptador from '../adaptador-salida/CobroDeudaPgsQueryAdaptador.js';
import CobroDeudaCommandUsesCase from '../../aplicacion/uses-cases/command/CobroDeudaCommandUsesCase.js';
import CobroDeudaQueryUsesCase from '../../aplicacion/uses-cases/query/CobroDeudaQueryUsesCase.js';

export const cobroDeudaControlador = new CobroDeudaControlador(new CobroDeudaCommandUsesCase(new CobroDeudaPgsCommandAdaptador()), new CobroDeudaQueryUsesCase(new CobroDeudaPgsQueryAdaptador()));
