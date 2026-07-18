import ClienteUsesCases from '../../aplicacion/uses-cases/ClienteUsesCases.js';
import HistorialUsesCases from '../../aplicacion/uses-cases/HistorialUsesCases.js';
import { ClienteCommandAdaptador, ClienteQueryAdaptador } from '../adaptador-salida/ClienteAdaptadores.js';
import { HistorialCommandAdaptador, HistorialQueryAdaptador } from '../adaptador-salida/HistorialAdaptadores.js';
import { ClienteControlador, HistorialControlador } from '../adaptador-entrada/Controladores.js';

export const clienteControlador = new ClienteControlador(new ClienteUsesCases(new ClienteCommandAdaptador(), new ClienteQueryAdaptador()));
export const historialControlador = new HistorialControlador(new HistorialUsesCases(new HistorialCommandAdaptador(), new HistorialQueryAdaptador()));
