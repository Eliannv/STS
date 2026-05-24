// src/infraestructura/contenedor/HistorialClinicoContenedor.js
import HistorialClinicoPgsCommandAdaptador from '../adaptador-salida/HistorialClinicoPgsCommandAdaptador.js';
import HistorialClinicoPgsQueryAdaptador   from '../adaptador-salida/HistorialClinicoPgsQueryAdaptador.js';
import HistorialClinicoCommandUsesCase     from '../../aplicacion/uses-cases/command/HistorialClinicoCommandUsesCase.js';
import HistorialClinicoQueryUsesCase       from '../../aplicacion/uses-cases/query/HistorialClinicoQueryUsesCase.js';
import HistorialClinicoControlador         from '../adaptador-entrada/HistorialClinicoControlador.js';

const commandAdaptador = new HistorialClinicoPgsCommandAdaptador();
const queryAdaptador   = new HistorialClinicoPgsQueryAdaptador();
const commandUC        = new HistorialClinicoCommandUsesCase(commandAdaptador);
const queryUC          = new HistorialClinicoQueryUsesCase(queryAdaptador);

export const historialClinicoControlador = new HistorialClinicoControlador(commandUC, queryUC);
