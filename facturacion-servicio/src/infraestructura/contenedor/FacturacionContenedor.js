import FacturacionUsesCases from '../../aplicacion/uses-cases/FacturacionUsesCases.js';
import FacturacionAdaptador from '../adaptador-salida/FacturacionAdaptador.js';
import FacturacionControlador from '../adaptador-entrada/FacturacionControlador.js';
const adaptador = new FacturacionAdaptador();
export const facturacionControlador = new FacturacionControlador(new FacturacionUsesCases(adaptador));
