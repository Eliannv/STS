import { api } from './api';

const LIMITE = 100;
const lista = (respuesta) => Array.isArray(respuesta?.data?.resultado) ? respuesta.data.resultado : [];

async function cargarPagina(path, offset = 0) {
  return api.get(`${path}${path.includes('?') ? '&' : '?'}limit=${LIMITE}&offset=${offset}`);
}

async function cargarTodas(path) {
  const resultado = [];
  for (let offset = 0; offset < 1000; offset += LIMITE) {
    const respuesta = await cargarPagina(path, offset);
    if (!respuesta.ok) return respuesta;
    const pagina = lista(respuesta);
    resultado.push(...pagina);
    if (pagina.length < LIMITE) break;
  }
  return { ok: true, data: { resultado } };
}

function enPeriodo(fecha, mes, anio) {
  const valor = new Date(fecha);
  return !Number.isNaN(valor.getTime()) && valor.getMonth() + 1 === mes && valor.getFullYear() === anio;
}

async function cargarDatos() {
  const [usuarios, facturas, abonos, cajasBanco, cajasChicas] = await Promise.all([
    cargarTodas('/usuarios?incluirInactivos=true'),
    cargarTodas('/facturas'),
    api.get('/cobro-deuda/lista-abonos'),
    api.get('/cajas-banco?limit=100'),
    api.get('/cajas-chicas?limit=100'),
  ]);
  if (![usuarios, facturas, abonos, cajasBanco, cajasChicas].every((respuesta) => respuesta.ok)) return null;

  const cajas = [
    ...lista(cajasBanco).map((caja) => ({ tipo: 'banco', id: caja.id })),
    ...lista(cajasChicas).map((caja) => ({ tipo: 'chica', id: caja.id })),
  ];
  const movimientos = await Promise.all(cajas.map(async (caja) => {
    const respuesta = await api.get(`/${caja.tipo === 'banco' ? 'cajas-banco' : 'cajas-chicas'}/${caja.id}/movimientos`);
    return respuesta.ok ? lista(respuesta).map((movimiento) => ({ ...movimiento, tipoCaja: caja.tipo })) : [];
  }));

  return { usuarios: lista(usuarios), facturas: lista(facturas), abonos: lista(abonos), movimientos: movimientos.flat() };
}

function metricasDeEmpleado(datos, usuarioId, mes, anio) {
  const facturas = datos.facturas.filter((factura) => Number(factura.usuario_id) === Number(usuarioId) && enPeriodo(factura.created_at || factura.fecha, mes, anio));
  const abonos = datos.abonos.filter((abono) => Number(abono.usuario_id) === Number(usuarioId) && enPeriodo(abono.fecha_pago || abono.created_at, mes, anio));
  const movimientosChica = datos.movimientos.filter((movimiento) => movimiento.tipoCaja === 'chica' && Number(movimiento.usuario_id) === Number(usuarioId) && enPeriodo(movimiento.created_at || movimiento.fecha, mes, anio));
  const movimientosBanco = datos.movimientos.filter((movimiento) => movimiento.tipoCaja === 'banco' && Number(movimiento.usuario_id) === Number(usuarioId) && enPeriodo(movimiento.created_at || movimiento.fecha, mes, anio));

  return {
    ventas: {
      totalVentas: facturas.length,
      montoTotalVendido: facturas.reduce((total, factura) => total + Number(factura.total || 0), 0),
      montoAbonado: facturas.reduce((total, factura) => total + Number(factura.abonado || 0), 0),
      promedioPorVenta: facturas.length ? facturas.reduce((total, factura) => total + Number(factura.total || 0), 0) / facturas.length : 0,
      promedioAbonado: facturas.length ? facturas.reduce((total, factura) => total + Number(factura.abonado || 0), 0) / facturas.length : 0,
    },
    cobros: {
      cantidadCobros: abonos.length,
      montoCobrado: abonos.reduce((total, abono) => total + Number(abono.monto_pagado || 0), 0),
    },
    cajaChica: {
      cantidad: movimientosChica.length,
      montoIngresado: movimientosChica.filter((movimiento) => movimiento.tipo === 'INGRESO').reduce((total, movimiento) => total + Number(movimiento.monto || 0), 0),
    },
    cajaBanco: {
      cantidad: movimientosBanco.length,
      montoIngresado: movimientosBanco.filter((movimiento) => movimiento.tipo === 'INGRESO').reduce((total, movimiento) => total + Number(movimiento.monto || 0), 0),
    },
  };
}

export async function resumenEmpleados(mes, anio) {
  const datos = await cargarDatos();
  if (!datos) return { ok: false, data: { resultado: 'No se pudieron cargar los datos de empleados' } };
  const empleados = datos.usuarios.map((usuario) => {
    const metricas = metricasDeEmpleado(datos, usuario.id, mes, anio);
    return {
      id: usuario.id,
      nombre_completo: `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim(),
      email: usuario.email,
      rol: usuario.rol,
      activo: usuario.activo,
      total_ventas: metricas.ventas.totalVentas,
      monto_total_vendido: metricas.ventas.montoTotalVendido,
      monto_abonado: metricas.ventas.montoAbonado,
      cantidad_cobros: metricas.cobros.cantidadCobros,
      monto_cobrado: metricas.cobros.montoCobrado,
    };
  });
  const rankingVentas = empleados.filter((empleado) => empleado.total_ventas > 0).sort((a, b) => b.total_ventas - a.total_ventas).slice(0, 3).map((empleado, indice) => ({ posicion: indice + 1, empleadoNombre: empleado.nombre_completo, valor: empleado.total_ventas, textoValor: `${empleado.total_ventas} venta${empleado.total_ventas !== 1 ? 's' : ''}` }));
  const rankingMontos = empleados.filter((empleado) => empleado.monto_total_vendido > 0).sort((a, b) => b.monto_total_vendido - a.monto_total_vendido).slice(0, 3).map((empleado, indice) => ({ posicion: indice + 1, empleadoNombre: empleado.nombre_completo, valor: empleado.monto_total_vendido, textoValor: `$${Number(empleado.monto_total_vendido).toFixed(2)}` }));
  return { ok: true, data: { resultado: { empleados, rankingVentas, rankingMontos } } };
}

export async function detalleEmpleado(usuarioId, mes, anio) {
  const datos = await cargarDatos();
  if (!datos) return { ok: false, data: { resultado: null } };
  return { ok: true, data: { resultado: metricasDeEmpleado(datos, usuarioId, mes, anio) } };
}

export async function historialEmpleado(usuarioId, meses = 6) {
  const datos = await cargarDatos();
  if (!datos) return { ok: false, data: { resultado: [] } };
  const ahora = new Date();
  const resultado = [];
  for (let indice = meses - 1; indice >= 0; indice -= 1) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - indice, 1);
    const mes = fecha.getMonth() + 1;
    const anio = fecha.getFullYear();
    const metricas = metricasDeEmpleado(datos, usuarioId, mes, anio);
    resultado.push({ anio, mes, mes_nombre: fecha.toLocaleDateString('es-EC', { month: 'short', year: 'numeric' }), total_ventas: metricas.ventas.totalVentas, monto_total_vendido: metricas.ventas.montoTotalVendido, monto_abonado: metricas.ventas.montoAbonado, total_cobros: metricas.cobros.cantidadCobros, monto_cobrado: metricas.cobros.montoCobrado });
  }
  return { ok: true, data: { resultado } };
}
