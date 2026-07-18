import CajaUsesCases from '../../aplicacion/uses-cases/CajaUsesCases.js';
import CajaAdaptador from '../adaptador-salida/CajaAdaptador.js';
import CajaControlador from '../adaptador-entrada/CajaControlador.js';
const adaptador = new CajaAdaptador();
export const cajaControlador = new CajaControlador(new CajaUsesCases(adaptador));
