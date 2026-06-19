// src/infraestructura/contenedor/CajaChicaContenedor.js
import CajaChicaPgsCommandAdaptador from '../adaptador-salida/CajaChicaPgsCommandAdaptador.js';
import CajaChicaPgsQueryAdaptador   from '../adaptador-salida/CajaChicaPgsQueryAdaptador.js';
import CajaChicaCommandUsesCase     from '../../aplicacion/uses-cases/command/CajaChicaCommandUsesCase.js';
import CajaChicaQueryUsesCase       from '../../aplicacion/uses-cases/query/CajaChicaQueryUsesCase.js';
import CajaChicaControlador         from '../adaptador-entrada/CajaChicaControlador.js';
import CajaBancoPgsCommandAdaptador from '../adaptador-salida/CajaBancoPgsCommandAdaptador.js';
import CajaBancoPgsQueryAdaptador from '../adaptador-salida/CajaBancoPgsQueryAdaptador.js';
import CajaBancoCommandUsesCase from '../../aplicacion/uses-cases/command/CajaBancoCommandUsesCase.js';
import CajaBancoQueryUsesCase from '../../aplicacion/uses-cases/query/CajaBancoQueryUsesCase.js';

const commandAdaptador = new CajaChicaPgsCommandAdaptador();
const queryAdaptador   = new CajaChicaPgsQueryAdaptador();
const commandUC        = new CajaChicaCommandUsesCase(commandAdaptador, queryAdaptador);
const queryUC          = new CajaChicaQueryUsesCase(queryAdaptador);

// Caja Banco (dependencia)
const cajaBancoCommandUC = new CajaBancoCommandUsesCase(new CajaBancoPgsCommandAdaptador());
const cajaBancoQueryUC   = new CajaBancoQueryUsesCase(new CajaBancoPgsQueryAdaptador());

export const cajaChicaControlador = new CajaChicaControlador(commandUC, queryUC, cajaBancoCommandUC, cajaBancoQueryUC);
