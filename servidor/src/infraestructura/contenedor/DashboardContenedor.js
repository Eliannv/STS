// src/infraestructura/contenedor/DashboardContenedor.js
import DashboardPgsQueryAdaptador from '../adaptador-salida/DashboardPgsQueryAdaptador.js';
import DashboardQueryUsesCase from '../../aplicacion/uses-cases/query/DashboardQueryUsesCase.js';
import DashboardControlador from '../adaptador-entrada/DashboardControlador.js';

const adaptador = new DashboardPgsQueryAdaptador();
const queryUC = new DashboardQueryUsesCase(adaptador);
const controlador = new DashboardControlador(queryUC);

export { controlador as dashboardControlador };