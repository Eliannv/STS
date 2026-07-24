// caja-servicio/src/infraestructura/contenedor/CajaContenedor.js
import MovimientoFinancieroDominioServicio from '../../dominio/servicios/MovimientoFinancieroDominioServicio.js';
import CuentaDominioServicio from '../../dominio/servicios/CuentaDominioServicio.js';
import CajaBancoCommandUsesCase from '../../aplicacion/uses-cases/command/CajaBancoCommandUsesCase.js';
import CajaChicaCommandUsesCase from '../../aplicacion/uses-cases/command/CajaChicaCommandUsesCase.js';
import OperacionCommandUsesCase from '../../aplicacion/uses-cases/command/OperacionCommandUsesCase.js';
import CajaBancoQueryUsesCase from '../../aplicacion/uses-cases/query/CajaBancoQueryUsesCase.js';
import CajaChicaQueryUsesCase from '../../aplicacion/uses-cases/query/CajaChicaQueryUsesCase.js';
import MovimientoQueryUsesCase from '../../aplicacion/uses-cases/query/MovimientoQueryUsesCase.js';
import CajaBancoPgsCommandAdaptador from '../adaptador-salida/CajaBancoPgsCommandAdaptador.js';
import CajaBancoPgsQueryAdaptador from '../adaptador-salida/CajaBancoPgsQueryAdaptador.js';
import CajaChicaPgsCommandAdaptador from '../adaptador-salida/CajaChicaPgsCommandAdaptador.js';
import CajaChicaPgsQueryAdaptador from '../adaptador-salida/CajaChicaPgsQueryAdaptador.js';
import MovimientoBancoPgsCommandAdaptador from '../adaptador-salida/MovimientoBancoPgsCommandAdaptador.js';
import MovimientoBancoPgsQueryAdaptador from '../adaptador-salida/MovimientoBancoPgsQueryAdaptador.js';
import MovimientoChicaPgsCommandAdaptador from '../adaptador-salida/MovimientoChicaPgsCommandAdaptador.js';
import MovimientoChicaPgsQueryAdaptador from '../adaptador-salida/MovimientoChicaPgsQueryAdaptador.js';
import CuentaPgsCommandAdaptador from '../adaptador-salida/CuentaPgsCommandAdaptador.js';
import CuentaPgsQueryAdaptador from '../adaptador-salida/CuentaPgsQueryAdaptador.js';
import CajaBancoControlador from '../adaptador-entrada/CajaBancoControlador.js';
import CajaChicaControlador from '../adaptador-entrada/CajaChicaControlador.js';
import MovimientoControlador from '../adaptador-entrada/MovimientoControlador.js';
import OperacionControlador from '../adaptador-entrada/OperacionControlador.js';

const dominioServicio = new MovimientoFinancieroDominioServicio();
const cuentaDominioServicio = new CuentaDominioServicio();
const cajaBancoCommandPuerto = new CajaBancoPgsCommandAdaptador();
const cajaBancoQueryPuerto = new CajaBancoPgsQueryAdaptador();
const cajaChicaCommandPuerto = new CajaChicaPgsCommandAdaptador();
const cajaChicaQueryPuerto = new CajaChicaPgsQueryAdaptador();
const movimientoBancoCommandPuerto = new MovimientoBancoPgsCommandAdaptador();
const movimientoBancoQueryPuerto = new MovimientoBancoPgsQueryAdaptador();
const movimientoChicaCommandPuerto = new MovimientoChicaPgsCommandAdaptador();
const movimientoChicaQueryPuerto = new MovimientoChicaPgsQueryAdaptador();
const cuentaCommandPuerto = new CuentaPgsCommandAdaptador();
const cuentaQueryPuerto = new CuentaPgsQueryAdaptador();

const movimientoQueryUC = new MovimientoQueryUsesCase(
  movimientoBancoQueryPuerto,
  movimientoChicaQueryPuerto,
);
const cajaBancoCommandUC = new CajaBancoCommandUsesCase(
  cajaBancoCommandPuerto,
  cajaBancoQueryPuerto,
  movimientoBancoCommandPuerto,
  movimientoBancoQueryPuerto,
  dominioServicio,
  cajaChicaQueryPuerto,
);
const cajaChicaCommandUC = new CajaChicaCommandUsesCase(
  cajaChicaCommandPuerto,
  cajaChicaQueryPuerto,
  cajaBancoCommandPuerto,
  cajaBancoQueryPuerto,
  movimientoBancoCommandPuerto,
  movimientoBancoQueryPuerto,
  movimientoChicaCommandPuerto,
  movimientoChicaQueryPuerto,
  dominioServicio,
);
const cajaBancoQueryUC = new CajaBancoQueryUsesCase(cajaBancoQueryPuerto);
const cajaChicaQueryUC = new CajaChicaQueryUsesCase(cajaChicaQueryPuerto);
const operacionCommandUC = new OperacionCommandUsesCase(
  movimientoBancoQueryPuerto,
  movimientoBancoCommandPuerto,
  movimientoChicaQueryPuerto,
  movimientoChicaCommandPuerto,
  cajaBancoQueryPuerto,
  cajaBancoCommandPuerto,
  cajaChicaQueryPuerto,
  cajaChicaCommandPuerto,
  cuentaQueryPuerto,
  cuentaCommandPuerto,
  dominioServicio,
  cuentaDominioServicio,
);

const cajaBancoControlador = new CajaBancoControlador(
  cajaBancoCommandUC,
  cajaBancoQueryUC,
  movimientoQueryUC,
);
const cajaChicaControlador = new CajaChicaControlador(
  cajaChicaCommandUC,
  cajaChicaQueryUC,
  movimientoQueryUC,
);
const movimientoControlador = new MovimientoControlador(
  movimientoQueryUC,
  cajaBancoCommandUC,
  cajaChicaCommandUC,
);
const operacionControlador = new OperacionControlador(operacionCommandUC);

export {
  cajaBancoControlador,
  cajaChicaControlador,
  movimientoControlador,
  operacionControlador,
  cajaBancoCommandUC,
  cajaChicaCommandUC,
  movimientoQueryUC,
  operacionCommandUC,
};
