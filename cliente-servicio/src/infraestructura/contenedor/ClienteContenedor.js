import { ClienteControlador } from '../adaptador-entrada/ClienteControlador.js';
import ClientePgsCommandAdaptador from '../adaptador-salida/ClientePgsCommandAdaptador.js';
import ClientePgsQueryAdaptador from '../adaptador-salida/ClientePgsQueryAdaptador.js';
import ClienteCommandUsesCase from '../../aplicacion/uses-cases/command/ClienteCommandUsesCase.js';
import ClienteQueryUsesCase from '../../aplicacion/uses-cases/query/ClienteQueryUsesCase.js';

export const clienteControlador = new ClienteControlador(
  new ClienteCommandUsesCase(new ClientePgsCommandAdaptador()),
  new ClienteQueryUsesCase(new ClientePgsQueryAdaptador())
);
