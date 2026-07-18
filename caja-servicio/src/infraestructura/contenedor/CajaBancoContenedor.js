import CajaBancoControlador from '../adaptador-entrada/CajaBancoControlador.js';
import CajaBancoPgsCommandAdaptador from '../adaptador-salida/CajaBancoPgsCommandAdaptador.js';
import CajaBancoPgsQueryAdaptador from '../adaptador-salida/CajaBancoPgsQueryAdaptador.js';
import CajaBancoCommandUsesCase from '../../aplicacion/uses-cases/command/CajaBancoCommandUsesCase.js';
import CajaBancoQueryUsesCase from '../../aplicacion/uses-cases/query/CajaBancoQueryUsesCase.js';

const query = new CajaBancoPgsQueryAdaptador();
export const cajaBancoControlador = new CajaBancoControlador(new CajaBancoCommandUsesCase(new CajaBancoPgsCommandAdaptador(), query), new CajaBancoQueryUsesCase(query));
