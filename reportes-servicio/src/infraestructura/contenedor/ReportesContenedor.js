// reportes-servicio/src/infraestructura/contenedor/ReportesContenedor.js
import MicroserviciosHttpAdaptador from '../adaptador-salida/MicroserviciosHttpAdaptador.js';
import ReportesDominioServicio from '../../dominio/servicios/ReportesDominioServicio.js';
import ReportesUsesCases from '../../aplicacion/uses-cases/ReportesUsesCases.js';
import ReportesControlador from '../adaptador-entrada/ReportesControlador.js';
import CacheMemoria from '../cache/CacheMemoria.js';
import HttpCliente from '../http/HttpCliente.js';
import ServiciosCliente from '../http/ServiciosCliente.js';
import ReporteDominioServicio from '../../dominio/servicios/ReporteDominioServicio.js';
import ReporteVentasUseCase from '../../aplicacion/uses-cases/ReporteVentasUseCase.js';
import ReporteCobrosUseCase from '../../aplicacion/uses-cases/ReporteCobrosUseCase.js';
import ReporteFlujoCajaUseCase from '../../aplicacion/uses-cases/ReporteFlujoCajaUseCase.js';
import ReporteCuentasCobrarUseCase from '../../aplicacion/uses-cases/ReporteCuentasCobrarUseCase.js';
import ReporteCuentasPagarUseCase from '../../aplicacion/uses-cases/ReporteCuentasPagarUseCase.js';
import ReporteTarjetasUseCase from '../../aplicacion/uses-cases/ReporteTarjetasUseCase.js';
import ReporteInventarioUseCase from '../../aplicacion/uses-cases/ReporteInventarioUseCase.js';
import ReporteComprasUseCase from '../../aplicacion/uses-cases/ReporteComprasUseCase.js';
import ReporteDashboardUseCase from '../../aplicacion/uses-cases/ReporteDashboardUseCase.js';
import ReporteControlador from '../adaptador-entrada/ReporteControlador.js';

export const reportesSalida = new MicroserviciosHttpAdaptador();
const dominio = new ReportesDominioServicio(reportesSalida);
export const reportesControlador = new ReportesControlador(new ReportesUsesCases(dominio));

const cache = new CacheMemoria();
const http = new HttpCliente();
const servicios = new ServiciosCliente(http);
const dominioSvc = new ReporteDominioServicio();
const ventasUC = new ReporteVentasUseCase(servicios, cache, dominioSvc);
const cobrosUC = new ReporteCobrosUseCase(servicios, cache, dominioSvc);
const flujoCajaUC = new ReporteFlujoCajaUseCase(servicios, cache, dominioSvc);
const cuentasCobrarUC = new ReporteCuentasCobrarUseCase(
  servicios,
  cache,
  dominioSvc,
);
const cuentasPagarUC = new ReporteCuentasPagarUseCase(
  servicios,
  cache,
  dominioSvc,
);
const tarjetasUC = new ReporteTarjetasUseCase(servicios, cache, dominioSvc);
const inventarioUC = new ReporteInventarioUseCase(
  servicios,
  cache,
  dominioSvc,
);
const comprasUC = new ReporteComprasUseCase(servicios, cache, dominioSvc);
const dashboardUC = new ReporteDashboardUseCase(servicios, cache, dominioSvc);

export const ctrl = new ReporteControlador({
  ventasUC,
  cobrosUC,
  flujoCajaUC,
  cuentasCobrarUC,
  cuentasPagarUC,
  tarjetasUC,
  inventarioUC,
  comprasUC,
  dashboardUC,
});
