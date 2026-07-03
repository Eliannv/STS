// src/infraestructura/contenedor/EmpleadoMetricasContenedor.js
import EmpleadoMetricasPgsQueryAdaptador from '../adaptador-salida/EmpleadoMetricasPgsQueryAdaptador.js';
import EmpleadoMetricasQueryUsesCase from '../../aplicacion/uses-cases/query/EmpleadoMetricasQueryUsesCase.js';
import EmpleadoMetricasControlador from '../adaptador-entrada/EmpleadoMetricasControlador.js';

const adaptador = new EmpleadoMetricasPgsQueryAdaptador();
const queryUC = new EmpleadoMetricasQueryUsesCase(adaptador);
const controlador = new EmpleadoMetricasControlador(queryUC);

export { controlador as empleadoMetricasControlador };