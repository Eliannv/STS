// src/infraestructura/contenedor/CobroDeudaContenedor.js
import CobroDeudaCommandUsesCase from '../../aplicacion/uses-cases/command/CobroDeudaCommandUsesCase.js';
import CobroDeudaQueryUsesCase from '../../aplicacion/uses-cases/query/CobroDeudaQueryUsesCase.js';
import CobroDeudaControlador from '../adaptador-entrada/CobroDeudaControlador.js';
import CobroDeudaPgsCommandAdaptador from '../adaptador-salida/CobroDeudaPgsCommandAdaptador.js';
import CobroDeudaPgsQueryAdaptador from '../adaptador-salida/CobroDeudaPgsQueryAdaptador.js';
import CajaBancoPgsCommandAdaptador from '../adaptador-salida/CajaBancoPgsCommandAdaptador.js';
import CajaBancoPgsQueryAdaptador from '../adaptador-salida/CajaBancoPgsQueryAdaptador.js';
import CajaBancoCommandUsesCase from '../../aplicacion/uses-cases/command/CajaBancoCommandUsesCase.js';
import CajaBancoQueryUsesCase from '../../aplicacion/uses-cases/query/CajaBancoQueryUsesCase.js';
import CajaChicaPgsCommandAdaptador from '../adaptador-salida/CajaChicaPgsCommandAdaptador.js';
import CajaChicaPgsQueryAdaptador from '../adaptador-salida/CajaChicaPgsQueryAdaptador.js';
import CajaChicaCommandUsesCase from '../../aplicacion/uses-cases/command/CajaChicaCommandUsesCase.js';
import CajaChicaQueryUsesCase from '../../aplicacion/uses-cases/query/CajaChicaQueryUsesCase.js';

// Adaptadores
const commandAdaptador = new CobroDeudaPgsCommandAdaptador();
const queryAdaptador = new CobroDeudaPgsQueryAdaptador();

// Use Cases
const commandUC = new CobroDeudaCommandUsesCase(commandAdaptador);
const queryUC = new CobroDeudaQueryUsesCase(queryAdaptador);

// Caja Banco (dependencia)
const cajaBancoCommandUC = new CajaBancoCommandUsesCase(new CajaBancoPgsCommandAdaptador());
const cajaBancoQueryUC = new CajaBancoQueryUsesCase(new CajaBancoPgsQueryAdaptador());

// Caja Chica (dependencia)
const cajaChicaCommandUC = new CajaChicaCommandUsesCase(new CajaChicaPgsCommandAdaptador());
const cajaChicaQueryUC = new CajaChicaQueryUsesCase(new CajaChicaPgsQueryAdaptador());

// Controlador
export const cobroDeudaControlador = new CobroDeudaControlador(
  commandUC,
  queryUC,
  cajaChicaCommandUC,
  cajaChicaQueryUC
);
