// reportes-servicio/src/aplicacion/uses-cases/ReporteVentasUseCase.js
import ReporteRespuesta from '../../dominio/ReporteRespuesta.js';
import DecimalUtil from '../../infraestructura/util/DecimalUtil.js';
import ReporteUseCaseBase from './ReporteUseCaseBase.js';

const columnasDetalle = [
  { key: 'id_personalizado', label: 'Factura', type: 'text' },
  { key: 'cliente', label: 'Cliente', type: 'text' },
  { key: 'fecha', label: 'Fecha', type: 'date' },
  { key: 'metodo_pago', label: 'Método de pago', type: 'text' },
  { key: 'tipo_venta', label: 'Tipo de venta', type: 'text' },
  { key: 'total', label: 'Total', type: 'currency' },
  { key: 'saldo_pendiente', label: 'Saldo pendiente', type: 'currency' },
  { key: 'estado', label: 'Estado', type: 'badge' },
];

const agruparVentas = (filas, agruparPor) => {
  const configuraciones = {
    dia: ['fecha', 'Día'],
    metodoPago: ['metodo_pago', 'Método de pago'],
    tipoVenta: ['tipo_venta', 'Tipo de venta'],
    usuario: ['usuario', 'Usuario'],
  };
  const configuracion = configuraciones[agruparPor];
  if (!configuracion) return null;
  const [campo, label] = configuracion;
  const grupos = new Map();

  filas.forEach((fila) => {
    const clave = campo === 'fecha'
      ? String(fila.fecha ?? '').slice(0, 10)
      : fila[campo] ?? 'Sin especificar';
    const actual = grupos.get(clave) ?? {
      agrupacion: clave,
      cantidad_facturas: 0,
      total_ventas: 0,
      total_cobrado: 0,
      total_pendiente: 0,
    };
    actual.cantidad_facturas += 1;
    actual.total_ventas = DecimalUtil.sumar(actual.total_ventas, fila.total);
    actual.total_cobrado = DecimalUtil.sumar(
      actual.total_cobrado,
      fila.total_cobrado,
    );
    actual.total_pendiente = DecimalUtil.sumar(
      actual.total_pendiente,
      fila.saldo_pendiente,
    );
    grupos.set(clave, actual);
  });

  return {
    rows: [...grupos.values()],
    columns: [
      { key: 'agrupacion', label, type: campo === 'fecha' ? 'date' : 'text' },
      { key: 'cantidad_facturas', label: 'Facturas', type: 'number' },
      { key: 'total_ventas', label: 'Total vendido', type: 'currency' },
      { key: 'total_cobrado', label: 'Total cobrado', type: 'currency' },
      { key: 'total_pendiente', label: 'Pendiente', type: 'currency' },
    ],
  };
};

export default class ReporteVentasUseCase extends ReporteUseCaseBase {
  async ejecutar(filtro, traceId) {
    const contexto = this.preparar('ventas', filtro);
    const cache = this.obtenerCache(contexto.clave);
    if (cache) return cache;

    const paralelo = await this.dominio.aplicarParalelo([
      this.servicios.getFacturas(contexto.filtros, traceId),
      this.servicios.getCuentasCobrar(contexto.filtros, traceId),
    ]);
    const facturasRespuesta = paralelo.resultados.find(
      ({ indice }) => indice === 0,
    )?.valor;
    if (!facturasRespuesta) {
      return this.errorServicio('el reporte de ventas', paralelo.fallidos[0], traceId);
    }

    const payload = this.extraerPayload(facturasRespuesta);
    const resumenFacturas = payload.summary ?? payload.resumen ?? {};
    const cuentasRespuesta = paralelo.resultados.find(
      ({ indice }) => indice === 1,
    )?.valor;
    const cuentas = cuentasRespuesta
      ? this.extraerItems(this.extraerPayload(cuentasRespuesta))
      : [];
    const resumenCuentas = cuentasRespuesta
      ? (
        this.extraerPayload(cuentasRespuesta).summary
        ?? this.extraerPayload(cuentasRespuesta).resumen
        ?? {}
      )
      : {};
    const saldos = new Map();
    cuentas.forEach((cuenta) => {
      const referencia = cuenta.referencia_id ?? cuenta.factura_id;
      const codigo = cuenta.referencia_codigo ?? cuenta.factura_codigo;
      if (referencia) saldos.set(`id:${referencia}`, cuenta.saldo);
      if (codigo) saldos.set(`codigo:${codigo}`, cuenta.saldo);
    });

    const parcial = !cuentasRespuesta;
    const filas = this.extraerItems(payload)
      .filter((factura) => factura.estado !== 'ANULADA')
      .map((factura) => {
        const saldo = saldos.get(`id:${factura.id}`)
          ?? saldos.get(`codigo:${factura.id_personalizado}`);
        return {
          ...factura,
          cliente: factura.cliente ?? factura.cliente_nombre,
          total: DecimalUtil.sumar(factura.total ?? 0),
          total_cobrado: DecimalUtil.sumar(factura.total_cobrado ?? 0),
          saldo_pendiente: parcial
            ? null
            : DecimalUtil.sumar(saldo ?? 0),
        };
      });
    const totalVentas = DecimalUtil.sumar(
      resumenFacturas.total_ventas
      ?? DecimalUtil.sumar(...filas.map((fila) => fila.total)),
    );
    const totalCobrado = DecimalUtil.sumar(
      resumenFacturas.total_cobrado
      ?? DecimalUtil.sumar(...filas.map((fila) => fila.total_cobrado)),
    );
    const totalPendiente = parcial
      ? null
      : DecimalUtil.sumar(
        resumenCuentas.total_pendiente
        ?? DecimalUtil.sumar(...filas.map((fila) => fila.saldo_pendiente)),
      );
    const agrupado = agruparVentas(filas, contexto.filtros.agruparPor);
    const rows = agrupado?.rows ?? filas;
    const columns = agrupado?.columns ?? columnasDetalle;
    const summary = {
      total_ventas: totalVentas,
      total_facturas: Number(
        resumenFacturas.total_facturas
        ?? payload.totalRows
        ?? filas.length,
      ),
      ticket_promedio: Number(
        resumenFacturas.total_facturas
        ?? payload.totalRows
        ?? filas.length
      )
        ? DecimalUtil.dividir(
          totalVentas,
          resumenFacturas.total_facturas ?? payload.totalRows ?? filas.length,
        )
        : 0,
      total_cobrado: totalCobrado,
      total_pendiente: totalPendiente,
      advertencias: paralelo.fallidos.map(({ error }) => error),
    };
    const pagination = agrupado
      ? this.dominio.construirPaginacion(0, rows.length || 1, rows.length)
      : this.construirPaginacion(
        payload,
        contexto.page,
        contexto.limit,
        rows.length,
      );
    const respuesta = ReporteRespuesta.ok(
      'ventas',
      'Análisis de Ventas',
      'Ventas',
      summary,
      columns,
      rows,
      pagination,
      contexto.filtros,
    );
    return this.guardarCache(
      contexto.clave,
      respuesta,
      contexto.ttl,
      parcial,
    );
  }
}
