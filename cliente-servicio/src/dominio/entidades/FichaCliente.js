// Ficha del Cliente: ensambla en un solo documento la información que el
// empleado necesita para atenderlo, respetando qué es global y qué pertenece
// a la sucursal en curso.
//
//   GLOBAL          cliente, historial clínico
//   POR SUCURSAL    compras, cuentas por cobrar, pagos, tarjetas, actividad
//
// El "Total comprado (Empresa)" es la única cifra consolidada que ve un operador:
// es un agregado, nunca detalle operativo de otra sucursal.

const numero = (valor) => Number(valor ?? 0) || 0;
const fecha = (valor) => (valor ? new Date(valor) : null);
const iso = (valor) => (valor instanceof Date && !Number.isNaN(valor.getTime()) ? valor.toISOString() : null);

// Intervalo entre controles visuales. En óptica varía según paciente y graduación
// (6, 12 o 24 meses), así que se parametriza: cuando exista configuración del
// sistema bastará con cambiar el valor, sin tocar este código.
const DIAS_REVISION_RECOMENDADA = Number(process.env.DIAS_REVISION_RECOMENDADA) || 365;

// Umbrales de los indicadores de estado comercial del cliente.
const COMPRAS_PARA_FRECUENTE = Number(process.env.COMPRAS_PARA_FRECUENTE) || 3;
const DIAS_SIN_COMPRAS_RECIENTES = Number(process.env.DIAS_SIN_COMPRAS_RECIENTES) || 365;
const DIAS_CLIENTE_NUEVO = Number(process.env.DIAS_CLIENTE_NUEVO) || 90;

const diasEntre = (desde, hasta = new Date()) => {
  if (!desde) return null;
  const inicio = new Date(desde);
  if (Number.isNaN(inicio.getTime())) return null;
  return Math.floor((hasta - inicio) / 86400000);
};

const sumarDias = (base, dias) => {
  const resultado = new Date(base);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
};

export default class FichaCliente {
  constructor({ cliente, historiales, facturas, resumenSucursal, resumenEmpresa, cuentas, pagos, tarjetas, sucursales, usuarios, scope }) {
    this.cliente = cliente;
    this.historiales = historiales ?? [];
    this.facturas = facturas ?? [];
    this.resumenSucursal = resumenSucursal ?? null;
    this.resumenEmpresa = resumenEmpresa ?? null;
    this.cuentas = cuentas ?? [];
    this.pagos = pagos ?? [];
    this.tarjetas = tarjetas ?? [];
    this.sucursales = sucursales ?? [];
    this.usuarios = usuarios ?? [];
    this.scope = scope ?? {};
  }

  // Nombre del empleado que emitió el documento; el frontend ya no necesita
  // consultar usuarios para mostrarlo.
  nombreUsuario(id) {
    if (id == null) return null;
    const usuario = this.usuarios.find((registro) => Number(registro.id) === Number(id));
    if (!usuario) return null;
    return `${usuario.nombre ?? ''} ${usuario.apellido ?? ''}`.trim() || null;
  }

  nombreSucursal(id) {
    if (id == null) return null;
    const encontrada = this.sucursales.find((sucursal) => Number(sucursal.id) === Number(id));
    return encontrada?.nombre ?? null;
  }

  // Bloque `alcance`: la UI necesita saber si las cifras son de una sucursal o
  // consolidadas, y disponer del catálogo para rotular la columna "Sucursal".
  construirAlcance() {
    const consolidado = this.scope.filtroLectura == null;
    return {
      consolidado,
      sucursalId: this.scope.filtroLectura ?? null,
      sucursalNombre: this.nombreSucursal(this.scope.filtroLectura),
      puedeVerTodas: Boolean(this.scope.puedeVerTodas),
      // Con varias sucursales en juego las tablas deben mostrar la columna.
      mostrarColumnaSucursal: consolidado,
      sucursales: this.sucursales.map((sucursal) => ({ id: sucursal.id, nombre: sucursal.nombre, codigo: sucursal.codigo })),
    };
  }

  construirResumen() {
    const sucursal = this.resumenSucursal ?? {};
    const empresa = this.resumenEmpresa ?? {};
    const saldoCuentas = this.cuentas.reduce((suma, cuenta) => suma + numero(cuenta.saldo), 0);

    return {
      // Dos métricas separadas y rotuladas: nunca se suman entre sí.
      totalCompradoSucursal: numero(sucursal.total_facturado),
      totalCompradoEmpresa: numero(empresa.total_facturado),
      totalPagadoSucursal: numero(sucursal.total_pagado),
      deudaSucursal: numero(sucursal.deuda_total),
      deudaEnCuentas: Number(saldoCuentas.toFixed(2)),
      comprasSucursal: numero(sucursal.cantidad_facturas),
      comprasEmpresa: numero(empresa.cantidad_facturas),
      promedioCompraSucursal: numero(sucursal.promedio_compra),
      ultimaCompra: sucursal.ultima_factura ?? null,
      // El crédito disponible aún no tiene un límite configurable por cliente;
      // se expone la clave para no cambiar el contrato cuando exista.
      creditoDisponible: null,
      limiteCredito: null,
      tieneDeuda: numero(sucursal.deuda_total) > 0 || saldoCuentas > 0,
    };
  }

  construirCompras() {
    const tarjetaPorFactura = new Map(
      this.tarjetas.map((tarjeta) => [Number(tarjeta.facturaId ?? tarjeta.factura_id), tarjeta]),
    );

    return this.facturas.map((factura) => {
      const tarjeta = tarjetaPorFactura.get(Number(factura.id));
      return {
        id: factura.id,
        numero: factura.id_personalizado,
        fecha: factura.fecha ?? factura.created_at,
        sucursalId: factura.sucursal_id ?? null,
        sucursalNombre: factura.sucursal_nombre ?? this.nombreSucursal(factura.sucursal_id),
        usuarioId: factura.usuario_id ?? null,
        usuarioNombre: this.nombreUsuario(factura.usuario_id),
        total: numero(factura.total),
        pagado: numero(factura.abonado),
        saldoPendiente: numero(factura.saldo_pendiente),
        estadoPago: factura.estado_pago,
        tipoVenta: factura.tipo_venta,
        metodoPago: factura.metodo_pago,
        estadoInventario: factura.estado_inventario,
        detalles: factura.detalles ?? [],
        tarjeta: tarjeta ? { estado: tarjeta.estado, banco: tarjeta.banco, saldoPendiente: numero(tarjeta.saldoPendiente ?? tarjeta.saldo_pendiente) } : null,
      };
    });
  }

  construirCuentas() {
    return this.cuentas.map((cuenta) => ({
      id: cuenta.id,
      fecha: cuenta.fecha ?? cuenta.fechaEmision ?? null,
      fechaVencimiento: cuenta.fechaVencimiento ?? cuenta.fecha_vencimiento ?? null,
      montoTotal: numero(cuenta.montoTotal ?? cuenta.monto_total),
      montoAbonado: numero(cuenta.montoAbonado ?? cuenta.monto_abonado),
      saldo: numero(cuenta.saldo),
      estado: cuenta.estado,
      sucursalId: cuenta.sucursalId ?? cuenta.sucursal_id ?? null,
      sucursalNombre: this.nombreSucursal(cuenta.sucursalId ?? cuenta.sucursal_id),
      referenciaTipo: cuenta.referenciaTipo ?? cuenta.referencia_tipo ?? null,
      referenciaCodigo: cuenta.referenciaCodigo ?? cuenta.referencia_codigo ?? null,
    }));
  }

  // Línea de tiempo construida con la información ya consultada: no añade
  // ninguna consulta ni tabla nueva.
  construirActividad() {
    const eventos = [];

    this.historiales.forEach((historial) => {
      const cuando = fecha(historial.fecha_chequeo ?? historial.created_at);
      if (cuando) eventos.push({ tipo: 'HISTORIAL_CLINICO', fecha: iso(cuando), titulo: 'Examen visual', referenciaId: historial.id, sucursalId: null, detalle: historial.observacion ?? null });
    });

    this.facturas.forEach((factura) => {
      const cuando = fecha(factura.fecha ?? factura.created_at);
      if (!cuando) return;
      const anulada = factura.estado_pago === 'ANULADA';
      eventos.push({
        tipo: anulada ? 'VENTA_ANULADA' : 'VENTA',
        fecha: iso(cuando),
        titulo: anulada ? `Venta anulada ${factura.id_personalizado}` : `Venta ${factura.id_personalizado}`,
        referenciaId: factura.id,
        sucursalId: factura.sucursal_id ?? null,
        sucursalNombre: factura.sucursal_nombre ?? this.nombreSucursal(factura.sucursal_id),
        monto: numero(factura.total),
      });
    });

    this.pagos.forEach((pago) => {
      const cuando = fecha(pago.fecha_pago ?? pago.created_at);
      if (!cuando) return;
      eventos.push({
        tipo: 'ABONO',
        fecha: iso(cuando),
        titulo: `Abono a ${pago.factura_id_personalizado ?? 'factura'}`,
        referenciaId: pago.factura_id ?? null,
        sucursalId: pago.sucursal_id ?? null,
        sucursalNombre: this.nombreSucursal(pago.sucursal_id),
        monto: numero(pago.monto_pagado),
        metodoPago: pago.metodo_pago ?? null,
      });
    });

    return eventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  construirEstadisticas() {
    const fechasExamen = this.historiales
      .map((historial) => fecha(historial.fecha_chequeo ?? historial.created_at))
      .filter((valor) => valor && !Number.isNaN(valor.getTime()))
      .sort((a, b) => b - a);

    const ultimoExamen = fechasExamen[0] ?? null;
    const proximoControl = ultimoExamen ? sumarDias(ultimoExamen, DIAS_REVISION_RECOMENDADA) : null;

    const creacion = fecha(this.cliente?.created_at);

    return {
      clienteDesde: iso(creacion),
      totalHistoriales: this.historiales.length,
      ultimoExamen: iso(ultimoExamen),
      proximoControlRecomendado: iso(proximoControl),
      controlVencido: Boolean(proximoControl && proximoControl < new Date()),
      ultimaCompra: this.construirResumen().ultimaCompra,
      totalPagosRegistrados: this.pagos.length,
      comprasConTarjeta: this.tarjetas.length,
      cuentasAbiertas: this.cuentas.filter((cuenta) => numero(cuenta.saldo) > 0).length,
      diasDesdeUltimoExamen: diasEntre(iso(ultimoExamen)),
      diasRevisionRecomendada: DIAS_REVISION_RECOMENDADA,
      // Se calculan desde las facturas ya consultadas: ninguna consulta extra.
      compraMayor: this.facturas.reduce((mayor, factura) => Math.max(mayor, numero(factura.total)), 0),
      ticketPromedio: this.facturas.length
        ? Number((this.facturas.reduce((suma, factura) => suma + numero(factura.total), 0) / this.facturas.length).toFixed(2))
        : 0,
      totalAbonado: Number(this.pagos.reduce((suma, pago) => suma + numero(pago.monto_pagado), 0).toFixed(2)),
    };
  }

  // Estado comercial y clínico del cliente, derivado de la información ya
  // consultada. La UI solo pinta: no recalcula umbrales ni reglas.
  construirEstados() {
    const estadisticas = this.construirEstadisticas();
    const resumen = this.construirResumen();

    const diasDesdeUltimaCompra = diasEntre(resumen.ultimaCompra);
    const diasDesdeAlta = diasEntre(estadisticas.clienteDesde);
    const sinCompras = resumen.comprasEmpresa === 0;

    return [
      { clave: 'INACTIVO',        activo: this.cliente?.activo === false,                                            etiqueta: 'Cliente inactivo',      tono: 'neutro' },
      { clave: 'NUEVO',           activo: diasDesdeAlta != null && diasDesdeAlta <= DIAS_CLIENTE_NUEVO,              etiqueta: 'Cliente nuevo',         tono: 'info' },
      { clave: 'FRECUENTE',       activo: resumen.comprasEmpresa >= COMPRAS_PARA_FRECUENTE,                          etiqueta: 'Cliente frecuente',     tono: 'exito' },
      { clave: 'CON_DEUDA',       activo: resumen.tieneDeuda,                                                        etiqueta: 'Tiene deuda',           tono: 'peligro' },
      { clave: 'REVISION_PENDIENTE', activo: estadisticas.controlVencido,                                            etiqueta: 'Revisión pendiente',    tono: 'alerta' },
      // Sin compras nunca no es lo mismo que llevar tiempo sin comprar.
      { clave: 'SIN_COMPRAS_RECIENTES', activo: !sinCompras && diasDesdeUltimaCompra != null && diasDesdeUltimaCompra > DIAS_SIN_COMPRAS_RECIENTES, etiqueta: 'Sin compras recientes', tono: 'alerta' },
    ].filter((estado) => estado.activo).map(({ clave, etiqueta, tono }) => ({ clave, etiqueta, tono }));
  }

  // Qué puede hacer la UI. Garantías y devoluciones se declaran como no
  // disponibles para que la Fase 3 pinte la pestaña sin inventar reglas.
  construirAcciones() {
    const resumen = this.construirResumen();
    return {
      nuevaVenta: true,
      nuevoHistorial: true,
      registrarAbono: resumen.tieneDeuda,
      verCuentaPorCobrar: resumen.tieneDeuda || this.cuentas.length > 0,
      imprimirUltimaFactura: this.facturas.length > 0,
      whatsapp: Boolean(this.cliente?.whatsapp || this.cliente?.telefono),
      garantias: { disponible: false, motivo: 'Módulo no implementado' },
      devoluciones: { disponible: false, motivo: 'Módulo no implementado' },
      documentos: { disponible: false, motivo: 'Almacenamiento no implementado' },
    };
  }

  // Contrato definitivo. Los bloques se mantienen aunque estén vacíos para que
  // las fases siguientes no tengan que modificarlo.
  toJSON() {
    return {
      cliente: this.cliente,
      alcance: this.construirAlcance(),
      resumen: this.construirResumen(),
      historialClinico: this.historiales,
      compras: this.construirCompras(),
      cuentasPorCobrar: this.construirCuentas(),
      actividad: this.construirActividad(),
      estadisticas: this.construirEstadisticas(),
      estados: this.construirEstados(),
      accionesDisponibles: this.construirAcciones(),
      garantias: [],
      documentos: [],
    };
  }
}
