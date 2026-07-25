// reportes-servicio/src/infraestructura/contenedor/ReportesContenedor.js
//
// Flujo canónico de reportes:
//   Rutas.js → ReportesControlador → ReportesUsesCases → ReportesDominioServicio
//            → MicroserviciosHttpAdaptador (reenvía Authorization y X-Sucursal-Id)
//
// Existía un segundo stack paralelo (ReporteControlador + ServiciosCliente + los
// nueve Reporte*UseCase) montado sobre las mismas rutas. Se eliminó porque:
//   1. Ningún endpoint del frontend lo consumía, salvo por colisión de ruta.
//   2. Capturaba /dashboard/indicadores y devolvía una forma distinta
//      (summary/snake_case) a la que el Dashboard espera (data/camelCase),
//      por lo que la pantalla se renderizaba en ceros.
//   3. Llamaba a los endpoints internos sin Authorization, de modo que ninguna
//      regla de sucursal podía aplicarse.
import MicroserviciosHttpAdaptador from '../adaptador-salida/MicroserviciosHttpAdaptador.js';
import ReportesDominioServicio from '../../dominio/servicios/ReportesDominioServicio.js';
import ReportesUsesCases from '../../aplicacion/uses-cases/ReportesUsesCases.js';
import ReportesControlador from '../adaptador-entrada/ReportesControlador.js';

export const reportesSalida = new MicroserviciosHttpAdaptador();
const dominio = new ReportesDominioServicio(reportesSalida);
export const reportesControlador = new ReportesControlador(new ReportesUsesCases(dominio));
