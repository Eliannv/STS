import { api } from './api';

const lista = (respuesta) => Array.isArray(respuesta?.data?.resultado) ? respuesta.data.resultado : [];
const resultado = (respuesta) => respuesta?.data?.resultado ?? null;
const seguro = (promesa) => promesa.catch(() => ({ ok: false, data: null }));

function resumenMovimientos(movimientos) {
  return movimientos.reduce((resumen, movimiento) => {
    const monto = Number(movimiento.monto || 0);
    resumen.totalMovimientos += 1;
    if (movimiento.tipo === 'INGRESO') resumen.totalIngresos += monto;
    if (movimiento.tipo === 'EGRESO') resumen.totalEgresos += monto;
    return resumen;
  }, { totalMovimientos: 0, totalIngresos: 0, totalEgresos: 0 });
}

async function cargarMovimientos(tipo, caja) {
  if (!caja?.id) return resumenMovimientos([]);
  const respuesta = await seguro(api.get(`/${tipo}/${caja.id}/movimientos`));
  return resumenMovimientos(lista(respuesta));
}

function adaptarCaja(caja, tipo) {
  if (!caja) return null;
  return tipo === 'cajaChica'
    ? { id: caja.id, montoActual: caja.monto_actual ?? caja.montoActual, montoInicial: caja.monto_inicial ?? caja.montoInicial, fecha: caja.fecha, abierta: true }
    : { id: caja.id, saldoActual: caja.saldo_actual ?? caja.saldoActual, saldoInicial: caja.saldo_inicial ?? caja.saldoInicial, fecha: caja.fecha, abierta: true };
}

export async function cargarDashboardResumen() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = ahora.getMonth();
  const inicioMes = `${anio}-${String(mes + 1).padStart(2, '0')}-01`;
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  const finMes = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

  const [facturasResponse, clientesResponse, deudasResponse, ingresosResponse, productosResponse, cajaChicaResponse, cajaBancoResponse] = await Promise.all([
    seguro(api.get('/facturas?limit=100')),
    seguro(api.get('/clientes?limit=100')),
    seguro(api.get('/cobro-deuda/facturas-pendientes')),
    seguro(api.get(`/ingresos?fechaDesde=${inicioMes}&fechaHasta=${finMes}&limit=100`)),
    seguro(api.get('/productos?limit=100')),
    seguro(api.get('/cajas-chicas/abierta')),
    seguro(api.get('/cajas-banco/abierta')),
  ]);

  const facturas = lista(facturasResponse);
  const facturasMes = facturas.filter((factura) => {
    const fecha = new Date(factura.created_at || factura.fecha);
    return !Number.isNaN(fecha.getTime()) && fecha.getFullYear() === anio && fecha.getMonth() === mes;
  });
  const deudas = lista(deudasResponse);
  const ingresos = lista(ingresosResponse);
  const productos = lista(productosResponse);
  const clientes = lista(clientesResponse);
  const cajaChica = adaptarCaja(resultado(cajaChicaResponse), 'cajaChica');
  const cajaBanco = adaptarCaja(resultado(cajaBancoResponse), 'cajaBanco');

  const [cajaChicaStats, cajaBancoStats] = await Promise.all([
    cargarMovimientos('cajas-chicas', cajaChica),
    cargarMovimientos('cajas-banco', cajaBanco),
  ]);

  return {
    ok: true,
    data: {
      resultado: {
        ventas: {
          totalVentasMes: facturasMes.length,
          montoTotalMes: facturasMes.reduce((total, factura) => total + Number(factura.total || 0), 0),
          montoAbonadoMes: facturasMes.reduce((total, factura) => total + Number(factura.abonado || 0), 0),
          ventasPendientes: facturasMes.filter((factura) => factura.estado_pago === 'PENDIENTE').length,
        },
        clientes: {
          totalActivos: clientes.length,
          nuevosMes: clientes.filter((cliente) => {
            const fecha = new Date(cliente.created_at);
            return !Number.isNaN(fecha.getTime()) && fecha.getFullYear() === anio && fecha.getMonth() === mes;
          }).length,
        },
        deudas: {
          facturasConDeuda: deudas.length,
          totalDeuda: deudas.reduce((total, factura) => total + Number(factura.saldo_pendiente || 0), 0),
        },
        ingresos: {
          totalIngresosMes: ingresos.length,
          montoIngresosMes: ingresos.reduce((total, ingreso) => total + Number(ingreso.total || 0), 0),
          borradores: ingresos.filter((ingreso) => ingreso.estado === 'BORRADOR').length,
        },
        productos: {
          totalActivos: productos.length,
          conStock: productos.filter((producto) => Number(producto.stock || 0) > 0).length,
          sinStock: productos.filter((producto) => Number(producto.stock || 0) <= 0).length,
        },
        cajaChica,
        cajaChicaStats,
        cajaBanco,
        cajaBancoStats,
        ventasRecientes: facturas.slice(0, 5),
      },
    },
  };
}
