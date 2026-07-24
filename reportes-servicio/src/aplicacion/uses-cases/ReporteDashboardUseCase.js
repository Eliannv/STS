// reportes-servicio/src/aplicacion/uses-cases/ReporteDashboardUseCase.js
import ReporteRespuesta from '../../dominio/ReporteRespuesta.js';
import DecimalUtil from '../../infraestructura/util/DecimalUtil.js';
import ReporteUseCaseBase from './ReporteUseCaseBase.js';

const dato = (resultados, indice, extraer) => {
  const respuesta = resultados.find((item) => item.indice === indice)?.valor;
  return respuesta ? extraer(respuesta) : {};
};

const dinero = (valor) => DecimalUtil.sumar(valor ?? 0);

export default class ReporteDashboardUseCase extends ReporteUseCaseBase {
  async ejecutar(filtro, traceId) {
    const contexto = this.preparar('dashboard-indicadores', filtro);
    const cache = this.obtenerCache(contexto.clave);
    if (cache) return cache;

    const paralelo = await this.dominio.aplicarParalelo([
      this.servicios.getFacturasHoy(traceId),
      this.servicios.getSaldoCajas(traceId),
      this.servicios.getCuentasCobrar({
        estado: 'PENDIENTE,PARCIAL',
      }, traceId),
      this.servicios.getCuentasPagar({
        estado: 'PENDIENTE,PARCIAL',
      }, traceId),
      this.servicios.getTarjetas({
        estado: 'PENDIENTE,PARCIALMENTE_ACREDITADA',
      }, traceId),
      this.servicios.getAlertasStock(traceId),
      this.servicios.getValorInventario(traceId),
    ]);
    const extraer = (respuesta) => this.extraerPayload(respuesta);
    const ventas = dato(paralelo.resultados, 0, extraer);
    const caja = dato(paralelo.resultados, 1, extraer);
    const cobrar = dato(paralelo.resultados, 2, extraer);
    const pagar = dato(paralelo.resultados, 3, extraer);
    const tarjetas = dato(paralelo.resultados, 4, extraer);
    const alertas = dato(paralelo.resultados, 5, extraer);
    const inventario = dato(paralelo.resultados, 6, extraer);
    const resumenCobrar = cobrar.summary ?? cobrar.resumen ?? cobrar;
    const resumenPagar = pagar.summary ?? pagar.resumen ?? pagar;
    const resumenTarjetas = tarjetas.summary ?? tarjetas.resumen ?? tarjetas;
    const summary = {
      ventas: {
        total_hoy: dinero(ventas.total ?? ventas.total_hoy),
        cobrado_hoy: dinero(
          ventas.total_cobrado ?? ventas.cobrado_hoy,
        ),
        pendiente_hoy: dinero(
          ventas.total_pendiente ?? ventas.pendiente_hoy,
        ),
        cantidad_facturas: Number(
          ventas.cantidad ?? ventas.cantidad_facturas ?? 0,
        ),
      },
      caja: {
        saldo_banco: dinero(caja.saldo_banco),
        saldo_chica: dinero(caja.saldo_chica),
        ingresos_hoy: dinero(caja.ingresos_hoy),
        egresos_hoy: dinero(caja.egresos_hoy),
        flujo_operativo_hoy: DecimalUtil.restar(
          caja.ingresos_hoy ?? 0,
          caja.egresos_hoy ?? 0,
        ),
      },
      deudas: {
        por_cobrar: dinero(
          resumenCobrar.total_pendiente ?? resumenCobrar.total,
        ),
        vencido_cobrar: dinero(resumenCobrar.total_vencido),
        por_pagar: dinero(
          resumenPagar.total_por_pagar
          ?? resumenPagar.total_pendiente
          ?? resumenPagar.total,
        ),
        vencido_pagar: dinero(resumenPagar.total_vencido),
      },
      tarjetas: {
        pendientes_monto: dinero(
          resumenTarjetas.pendientes_monto
          ?? resumenTarjetas.total_pendiente,
        ),
        acreditadas_mes: dinero(
          resumenTarjetas.acreditadas_mes
          ?? resumenTarjetas.total_monto_neto,
        ),
      },
      inventario: {
        sin_stock: Number(alertas.sin_stock ?? alertas.productos_sin_stock ?? 0),
        stock_bajo: Number(alertas.stock_bajo ?? alertas.productos_stock_bajo ?? 0),
        valor_total: dinero(
          inventario.valor_total ?? inventario.total ?? inventario.valor,
        ),
      },
      advertencias: paralelo.fallidos.map(({ indice, error }) => ({
        seccion: [
          'ventas',
          'caja',
          'cuentas_cobrar',
          'cuentas_pagar',
          'tarjetas',
          'alertas_stock',
          'valor_inventario',
        ][indice],
        mensaje: error,
      })),
    };
    const respuesta = ReporteRespuesta.ok(
      'dashboard-indicadores',
      'Dashboard de Indicadores',
      'Dashboard',
      summary,
      [],
      [],
      this.dominio.construirPaginacion(0, 1, 0),
      contexto.filtros,
    );
    return this.guardarCache(
      contexto.clave,
      respuesta,
      30,
      paralelo.fallidos.length > 0,
    );
  }
}
