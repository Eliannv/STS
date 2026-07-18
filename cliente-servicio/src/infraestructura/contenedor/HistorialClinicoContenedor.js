import HistorialClinicoControlador from '../adaptador-entrada/HistorialClinicoControlador.js';
import HistorialClinicoPgsCommandAdaptador from '../adaptador-salida/HistorialClinicoPgsCommandAdaptador.js';
import HistorialClinicoPgsQueryAdaptador from '../adaptador-salida/HistorialClinicoPgsQueryAdaptador.js';
import HistorialClinicoCommandUsesCase from '../../aplicacion/uses-cases/command/HistorialClinicoCommandUsesCase.js';
import HistorialClinicoQueryUsesCase from '../../aplicacion/uses-cases/query/HistorialClinicoQueryUsesCase.js';

export const historialClinicoControlador = new HistorialClinicoControlador(
  new HistorialClinicoCommandUsesCase(new HistorialClinicoPgsCommandAdaptador()),
  new HistorialClinicoQueryUsesCase(new HistorialClinicoPgsQueryAdaptador())
);
