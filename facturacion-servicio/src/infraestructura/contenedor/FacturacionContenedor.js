import FacturacionUsesCases from '../../aplicacion/uses-cases/FacturacionUsesCases.js';
import FacturacionAdaptador from '../adaptador-salida/FacturacionAdaptador.js';
import FacturacionControlador from '../adaptador-entrada/FacturacionControlador.js';
import InventarioStockHttpAdaptador from '../adaptador-salida/InventarioStockHttpAdaptador.js';
const adaptador = new FacturacionAdaptador();
const inventarioStock = new InventarioStockHttpAdaptador(process.env.INVENTARIO_SERVICIO_URL);
export const facturacionControlador = new FacturacionControlador(new FacturacionUsesCases(adaptador, inventarioStock));
