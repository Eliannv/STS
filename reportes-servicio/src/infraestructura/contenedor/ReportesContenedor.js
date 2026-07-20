import MicroserviciosHttpAdaptador from '../adaptador-salida/MicroserviciosHttpAdaptador.js';
import ReportesDominioServicio from '../../dominio/servicios/ReportesDominioServicio.js';
import ReportesUsesCases from '../../aplicacion/uses-cases/ReportesUsesCases.js';
import ReportesControlador from '../adaptador-entrada/ReportesControlador.js';

export const reportesSalida = new MicroserviciosHttpAdaptador();
const dominio = new ReportesDominioServicio(reportesSalida);
export const reportesControlador = new ReportesControlador(new ReportesUsesCases(dominio));
