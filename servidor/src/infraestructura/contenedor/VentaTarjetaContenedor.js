// src/infraestructura/contenedor/VentaTarjetaContenedor.js
import VentaTarjetaCommandUsesCase from '../../aplicacion/uses-cases/command/VentaTarjetaCommandUsesCase.js';
import VentaTarjetaQueryUsesCase from '../../aplicacion/uses-cases/query/VentaTarjetaQueryUsesCase.js';
import VentaTarjetaControlador from '../adaptador-entrada/VentaTarjetaControlador.js';
import VentaTarjetaPgsCommandAdaptador from '../adaptador-salida/VentaTarjetaPgsCommandAdaptador.js';
import VentaTarjetaPgsQueryAdaptador from '../adaptador-salida/VentaTarjetaPgsQueryAdaptador.js';

// Adaptadores
const commandAdaptador = new VentaTarjetaPgsCommandAdaptador();
const queryAdaptador = new VentaTarjetaPgsQueryAdaptador();

// Use Cases
const commandUC = new VentaTarjetaCommandUsesCase(commandAdaptador);
const queryUC = new VentaTarjetaQueryUsesCase(queryAdaptador);

// Controlador
export const ventaTarjetaControlador = new VentaTarjetaControlador(commandUC, queryUC);
