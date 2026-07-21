import FacturaControlador from '../adaptador-entrada/FacturaControlador.js';
import FacturaPgsCommandAdaptador from '../adaptador-salida/FacturaPgsCommandAdaptador.js';
import FacturaPgsQueryAdaptador from '../adaptador-salida/FacturaPgsQueryAdaptador.js';
import FacturaCommandUsesCase from '../../aplicacion/uses-cases/command/FacturaCommandUsesCase.js';
import FacturaQueryUsesCase from '../../aplicacion/uses-cases/query/FacturaQueryUsesCase.js';
import InventarioStockHttpAdaptador from '../adaptador-salida/InventarioStockHttpAdaptador.js';

const command = new FacturaPgsCommandAdaptador();
const query = new FacturaPgsQueryAdaptador();
const queryUsesCase = new FacturaQueryUsesCase(query);
const inventarioStock = new InventarioStockHttpAdaptador(process.env.INVENTARIO_SERVICIO_URL);

export const facturaControlador = new FacturaControlador(
  new FacturaCommandUsesCase(command, query, inventarioStock),
  queryUsesCase,
);
