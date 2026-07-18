import FacturaControlador from '../adaptador-entrada/FacturaControlador.js';
import FacturaPgsCommandAdaptador from '../adaptador-salida/FacturaPgsCommandAdaptador.js';
import FacturaPgsQueryAdaptador from '../adaptador-salida/FacturaPgsQueryAdaptador.js';
import FacturaCommandUsesCase from '../../aplicacion/uses-cases/command/FacturaCommandUsesCase.js';
import FacturaQueryUsesCase from '../../aplicacion/uses-cases/query/FacturaQueryUsesCase.js';

export const facturaControlador = new FacturaControlador(new FacturaCommandUsesCase(new FacturaPgsCommandAdaptador()), new FacturaQueryUsesCase(new FacturaPgsQueryAdaptador()));
