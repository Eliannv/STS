// src/infraestructura/contenedor/CajaBancoContenedor.js
import CajaBancoPgsCommandAdaptador from '../adaptador-salida/CajaBancoPgsCommandAdaptador.js';
import CajaBancoPgsQueryAdaptador   from '../adaptador-salida/CajaBancoPgsQueryAdaptador.js';
import CajaBancoCommandUsesCase     from '../../aplicacion/uses-cases/command/CajaBancoCommandUsesCase.js';
import CajaBancoQueryUsesCase       from '../../aplicacion/uses-cases/query/CajaBancoQueryUsesCase.js';
import CajaBancoControlador         from '../adaptador-entrada/CajaBancoControlador.js';

const commandAdaptador = new CajaBancoPgsCommandAdaptador();
const queryAdaptador   = new CajaBancoPgsQueryAdaptador();
const commandUC        = new CajaBancoCommandUsesCase(commandAdaptador);
const queryUC          = new CajaBancoQueryUsesCase(queryAdaptador);

export const cajaBancoControlador = new CajaBancoControlador(commandUC, queryUC);
