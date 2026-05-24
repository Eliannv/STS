// src/infraestructura/contenedor/ProveedorContenedor.js
import ProveedorPgsCommandAdaptador from '../adaptador-salida/ProveedorPgsCommandAdaptador.js';
import ProveedorPgsQueryAdaptador   from '../adaptador-salida/ProveedorPgsQueryAdaptador.js';
import ProveedorCommandUsesCase     from '../../aplicacion/uses-cases/command/ProveedorCommandUsesCase.js';
import ProveedorQueryUsesCase       from '../../aplicacion/uses-cases/query/ProveedorQueryUsesCase.js';
import ProveedorControlador         from '../adaptador-entrada/ProveedorControlador.js';

const commandAdaptador = new ProveedorPgsCommandAdaptador();
const queryAdaptador   = new ProveedorPgsQueryAdaptador();
const commandUC        = new ProveedorCommandUsesCase(commandAdaptador);
const queryUC          = new ProveedorQueryUsesCase(queryAdaptador);

export const proveedorControlador = new ProveedorControlador(commandUC, queryUC);
