import BffUsesCases from '../../aplicacion/uses-cases/BffUsesCases.js';
import BffHttpAdaptador from '../adaptador-salida/BffHttpAdaptador.js';
import BffControlador from '../adaptador-entrada/BffControlador.js';

const servicios = {
  usuario: process.env.USUARIO_SERVICIO_URL,
  cliente: process.env.CLIENTE_SERVICIO_URL,
  inventario: process.env.INVENTARIO_SERVICIO_URL,
  facturacion: process.env.FACTURACION_SERVICIO_URL,
  caja: process.env.CAJA_SERVICIO_URL,
  reportes: process.env.REPORTES_SERVICIO_URL
};
const adaptador = new BffHttpAdaptador(servicios);
export const bffControlador = new BffControlador(new BffUsesCases(adaptador));
export { servicios };
