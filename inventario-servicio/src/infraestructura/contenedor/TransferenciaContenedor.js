// inventario-servicio/src/infraestructura/contenedor/TransferenciaContenedor.js
import TransferenciaControlador from '../adaptador-entrada/TransferenciaControlador.js';
import TransferenciaPgsCommandAdaptador from '../adaptador-salida/TransferenciaPgsCommandAdaptador.js';
import TransferenciaPgsQueryAdaptador from '../adaptador-salida/TransferenciaPgsQueryAdaptador.js';
import TransferenciaCommandUsesCase from '../../aplicacion/uses-cases/command/TransferenciaCommandUsesCase.js';
import TransferenciaQueryUsesCase from '../../aplicacion/uses-cases/query/TransferenciaQueryUsesCase.js';
import { movimientoStockDominioServicio } from './MovimientoStockContenedor.js';

export const transferenciaControlador = new TransferenciaControlador(
  new TransferenciaCommandUsesCase(new TransferenciaPgsCommandAdaptador(movimientoStockDominioServicio)),
  new TransferenciaQueryUsesCase(new TransferenciaPgsQueryAdaptador()),
);
