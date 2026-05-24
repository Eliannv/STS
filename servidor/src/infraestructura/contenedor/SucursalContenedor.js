// src/infraestructura/contenedor/SucursalContenedor.js
import { SucursalControlador }        from '../adaptador-entrada/SucursalControlador.js';
import SucursalCommandAdaptadorSalida from '../adaptador-salida/SucursalPgsCommandAdaptador.js';
import SucursalQueryAdaptadorSalida   from '../adaptador-salida/SucursalPgsQueryAdaptador.js';
import SCommandCaso                   from '../../aplicacion/uses-cases/command/SucursalCommandUsesCase.js';
import SQueryCaso                     from '../../aplicacion/uses-cases/query/SucursalQueryUsesCase.js';

// Adaptadores de salida (PostgreSQL)
const sucursalCommandBDSalida = new SucursalCommandAdaptadorSalida();
const sucursalQueryBDSalida   = new SucursalQueryAdaptadorSalida();

// Casos de uso
const casoUsoCommandSucursal = new SCommandCaso(sucursalCommandBDSalida);
const casoUsoQuerySucursal   = new SQueryCaso(sucursalQueryBDSalida);

// Controlador (adaptador de entrada)
const sucursalControlador = new SucursalControlador(casoUsoCommandSucursal, casoUsoQuerySucursal);

export { sucursalControlador };
