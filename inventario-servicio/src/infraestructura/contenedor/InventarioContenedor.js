// inventario-servicio/src/infraestructura/contenedor/InventarioContenedor.js
import InventarioUsesCases from '../../aplicacion/uses-cases/InventarioUsesCases.js';
import EgresoCommandUsesCase from '../../aplicacion/uses-cases/command/EgresoCommandUsesCase.js';
import EgresoQueryUsesCase from '../../aplicacion/uses-cases/query/EgresoQueryUsesCase.js';
import EgresoDominioServicio from '../../dominio/servicios/EgresoDominioServicio.js';
import InventarioAdaptador from '../adaptador-salida/InventarioAdaptador.js';
import InventarioControlador from '../adaptador-entrada/InventarioControlador.js';
import EgresoMercaderiaControlador from '../adaptador-entrada/EgresoMercaderiaControlador.js';
import EgresoMercaderiaPgsCommandAdaptador from '../adaptador-salida/EgresoMercaderiaPgsCommandAdaptador.js';
import EgresoMercaderiaPgsQueryAdaptador from '../adaptador-salida/EgresoMercaderiaPgsQueryAdaptador.js';
import OperacionFinancieraInventarioPgsCommandAdaptador from '../adaptador-salida/OperacionFinancieraInventarioPgsCommandAdaptador.js';
import OperacionFinancieraInventarioPgsQueryAdaptador from '../adaptador-salida/OperacionFinancieraInventarioPgsQueryAdaptador.js';
import CajaHttpAdaptador from '../adaptador-salida/CajaHttpAdaptador.js';
import {
  existenciaStockAdaptador,
  movimientoStockDominioServicio,
} from './MovimientoStockContenedor.js';

const adaptador = new InventarioAdaptador();
export const inventarioControlador = new InventarioControlador(new InventarioUsesCases(adaptador));

const egresoQuery = new EgresoMercaderiaPgsQueryAdaptador();
const egresoCommand = new EgresoMercaderiaPgsCommandAdaptador();
const operacionFinancieraQuery =
  new OperacionFinancieraInventarioPgsQueryAdaptador();
const operacionFinancieraCommand =
  new OperacionFinancieraInventarioPgsCommandAdaptador();
const egresoCommandUseCase = new EgresoCommandUsesCase({
  egresoQuery,
  egresoCommand,
  existenciaStock: existenciaStockAdaptador,
  movimientoStockServicio: movimientoStockDominioServicio,
  egresoDominioServicio: new EgresoDominioServicio(),
  operacionFinancieraQuery,
  operacionFinancieraCommand,
  cajaSalida: new CajaHttpAdaptador(),
});
const egresoQueryUseCase = new EgresoQueryUsesCase(egresoQuery);

export const egresoMercaderiaControlador = new EgresoMercaderiaControlador(
  egresoCommandUseCase,
  egresoQueryUseCase,
);
