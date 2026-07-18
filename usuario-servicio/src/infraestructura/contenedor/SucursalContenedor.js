import SucursalUsesCases from '../../aplicacion/uses-cases/SucursalUsesCases.js';
import SucursalControlador from '../adaptador-entrada/SucursalControlador.js';
import { SucursalCommandAdaptador, SucursalQueryAdaptador } from '../adaptador-salida/SucursalAdaptadores.js';

export const sucursalControlador = new SucursalControlador(new SucursalUsesCases(new SucursalCommandAdaptador(), new SucursalQueryAdaptador()));
