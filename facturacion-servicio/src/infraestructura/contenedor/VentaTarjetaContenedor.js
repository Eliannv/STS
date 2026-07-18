import VentaTarjetaControlador from '../adaptador-entrada/VentaTarjetaControlador.js';
import VentaTarjetaPgsCommandAdaptador from '../adaptador-salida/VentaTarjetaPgsCommandAdaptador.js';
import VentaTarjetaPgsQueryAdaptador from '../adaptador-salida/VentaTarjetaPgsQueryAdaptador.js';
import VentaTarjetaCommandUsesCase from '../../aplicacion/uses-cases/command/VentaTarjetaCommandUsesCase.js';
import VentaTarjetaQueryUsesCase from '../../aplicacion/uses-cases/query/VentaTarjetaQueryUsesCase.js';

export const ventaTarjetaControlador = new VentaTarjetaControlador(new VentaTarjetaCommandUsesCase(new VentaTarjetaPgsCommandAdaptador()), new VentaTarjetaQueryUsesCase(new VentaTarjetaPgsQueryAdaptador()));
