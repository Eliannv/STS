import ReporteDTO from '../../aplicacion/dto/ReporteDTO.js';

const numero = (valor) => Number(valor || 0);
const lista = (respuesta) => Array.isArray(respuesta?.resultado) ? respuesta.resultado : [];
const resultado = (respuesta) => respuesta?.resultado ?? null;
const fechaRegistro = (registro) => registro.created_at || registro.fecha || registro.fecha_pago || registro.fecha_venta || registro.fecha_emision;
const dentroDeRango = (valor, desde, hasta) => {
  if (!desde && !hasta) return true;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return false;
  if (desde && fecha < new Date(`${desde}T00:00:00`)) return false;
  if (hasta && fecha > new Date(`${hasta}T23:59:59.999`)) return false;
  return true;
};
const filtrarRango = (registros, filtros = {}) => registros.filter((registro) => dentroDeRango(fechaRegistro(registro), filtros.fechaDesde, filtros.fechaHasta));
const texto = (valor) => String(valor || '').trim().toLocaleLowerCase('es');
const coincideTexto = (valor, filtro) => !filtro || texto(valor).includes(texto(filtro));
const normalizarMetodoPago = (valor, esCredito = false) => {
  if (esCredito) return 'CREDITO';
  return String(valor || 'EFECTIVO').trim().toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};
const resumirTransacciones = (filas) => {
  const ventas = filas.filter(item => item.tipoTransaccion === 'VENTA' && item.estado !== 'ANULADA');
  const cobros = filas.filter(item => item.tipoTransaccion === 'COBRO' && item.estado !== 'ANULADA');
  const montoVentas = ventas.reduce((suma, item) => suma + numero(item.total), 0);
  return {
    transacciones: filas.length,
    ventas: ventas.length,
    cobros: cobros.length,
    montoVentas: Number(montoVentas.toFixed(2)),
    montoCobrado: Number(filas.reduce((suma, item) => suma + numero(item.montoCobrado), 0).toFixed(2)),
    saldoPendiente: Number(ventas.reduce((suma, item) => suma + numero(item.saldoPendiente), 0).toFixed(2)),
    costo: Number(ventas.reduce((suma, item) => suma + numero(item.costo), 0).toFixed(2)),
    utilidad: Number(ventas.reduce((suma, item) => suma + numero(item.utilidad), 0).toFixed(2)),
  };
};
const periodoMes = (filtros = {}) => {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = ahora.getMonth();
  const fechaDesde = filtros.fechaDesde || `${anio}-${String(mes + 1).padStart(2, '0')}-01`;
  const fechaHasta = filtros.fechaHasta || `${anio}-${String(mes + 1).padStart(2, '0')}-${String(new Date(anio, mes + 1, 0).getDate()).padStart(2, '0')}`;
  return { fechaDesde, fechaHasta };
};
const columnas = (...nombres) => nombres.map(([clave, etiqueta]) => ({ clave, etiqueta }));
const columna = (key, label, type = 'text') => ({ key, label, type });
const columnasPorReporte = {
  'productos-sin-stock': [columna('codigo', 'Código'), columna('nombre', 'Producto'), columna('grupo', 'Grupo'), columna('stock', 'Stock', 'number'), columna('costo', 'Costo', 'currency'), columna('pvp1', 'Precio venta', 'currency')],
  'productos-stock-minimo': [columna('codigo', 'Código'), columna('nombre', 'Producto'), columna('grupo', 'Grupo'), columna('stock', 'Stock', 'number'), columna('costo', 'Costo', 'currency'), columna('pvp1', 'Precio venta', 'currency')],
  'ventas-mas-vendidos': [columna('codigo', 'Código'), columna('nombre', 'Producto'), columna('cantidad_vendida', 'Cantidad vendida', 'number'), columna('total_vendido', 'Total vendido', 'currency'), columna('stock_actual', 'Stock actual', 'number')],
  'ventas-menos-vendidos': [columna('codigo', 'Código'), columna('nombre', 'Producto'), columna('cantidad_vendida', 'Cantidad vendida', 'number'), columna('total_vendido', 'Total vendido', 'currency'), columna('stock_actual', 'Stock actual', 'number')],
  'compras-proveedor': [columna('proveedor_nombre', 'Proveedor'), columna('compras', 'Compras', 'number'), columna('total_comprado', 'Total comprado', 'currency')],
  'ingresos-mercaderia': [columna('id_personalizado', 'Código'), columna('numero_factura', 'Factura'), columna('proveedor_nombre', 'Proveedor'), columna('fecha', 'Fecha', 'date'), columna('estado', 'Estado'), columna('total', 'Total', 'currency')],
  'egresos-mercaderia': [columna('fecha', 'Fecha', 'date'), columna('motivo', 'Motivo'), columna('descripcion', 'Descripción'), columna('usuario_nombre', 'Usuario'), columna('sucursal_nombre', 'Sucursal'), columna('costo_total', 'Costo total', 'currency')],
  'ventas-sucursal': [columna('sucursal_nombre', 'Sucursal'), columna('ventas', 'Ventas', 'number'), columna('total', 'Total', 'currency'), columna('abonado', 'Abonado', 'currency'), columna('saldo_pendiente', 'Saldo pendiente', 'currency')],
  'ventas-usuario': [columna('usuario_nombre', 'Usuario'), columna('ventas', 'Ventas', 'number'), columna('total', 'Total', 'currency'), columna('abonado', 'Abonado', 'currency'), columna('saldo_pendiente', 'Saldo pendiente', 'currency')],
  'ventas-cliente': [columna('cliente_nombre', 'Cliente'), columna('ventas', 'Ventas', 'number'), columna('total', 'Total', 'currency'), columna('abonado', 'Abonado', 'currency'), columna('saldo_pendiente', 'Saldo pendiente', 'currency')],
  'utilidad-ventas': [columna('id_personalizado', 'Factura'), columna('fecha', 'Fecha', 'date'), columna('venta', 'Venta', 'currency'), columna('costo', 'Costo', 'currency'), columna('utilidad', 'Utilidad', 'currency')],
  'flujo-caja': [columna('fecha', 'Fecha', 'date'), columna('tipo_caja', 'Caja'), columna('tipo', 'Tipo'), columna('descripcion', 'Descripción'), columna('usuario_nombre', 'Usuario'), columna('monto', 'Monto', 'currency')],
  'cuentas-cobrar': [columna('factura_id_personalizado', 'Factura'), columna('cliente_nombre', 'Cliente'), columna('total', 'Total', 'currency'), columna('abonado', 'Abonado', 'currency'), columna('saldo_pendiente', 'Saldo pendiente', 'currency'), columna('fecha', 'Fecha', 'date')],
};
const shortTitles = {
  kardex: 'Kardex', 'kardex-producto': 'Kardex producto', 'kardex-fecha': 'Kardex fechas', 'inventario-actual': 'Inventario', 'inventario-valorizado': 'Valorizado',
  'productos-sin-stock': 'Sin stock', 'productos-stock-minimo': 'Stock mínimo', 'ventas-mas-vendidos': 'Más vendidos', 'ventas-menos-vendidos': 'Menos vendidos',
  'compras-proveedor': 'Por proveedor', 'ingresos-mercaderia': 'Ingresos', 'egresos-mercaderia': 'Egresos', 'ventas-generales': 'Ventas',
  'ventas-fecha': 'Ventas por fecha', 'ventas-sucursal': 'Por sucursal', 'ventas-usuario': 'Por usuario', 'ventas-cliente': 'Por cliente',
  'utilidad-ventas': 'Utilidad', 'flujo-caja': 'Flujo de caja', 'cuentas-cobrar': 'Cuentas por cobrar', 'dashboard-indicadores': 'Indicadores',
};
columnasPorReporte['productos-mas-vendidos'] = columnasPorReporte['ventas-mas-vendidos'];
columnasPorReporte['productos-menos-vendidos'] = columnasPorReporte['ventas-menos-vendidos'];
columnasPorReporte['estado-cuentas-cobrar'] = columnasPorReporte['cuentas-cobrar'];
shortTitles['productos-mas-vendidos'] = shortTitles['ventas-mas-vendidos'];
shortTitles['productos-menos-vendidos'] = shortTitles['ventas-menos-vendidos'];
shortTitles['estado-cuentas-cobrar'] = shortTitles['cuentas-cobrar'];
const reporte = (codigo, titulo, filtros, filas, resumen = {}, datos = null, campos = [], opciones = {}) => new ReporteDTO({
  codigo,
  titulo,
  shortTitle: opciones.shortTitle || shortTitles[codigo] || titulo,
  filtros,
  filas,
  resumen,
  datos,
  columnas: opciones.columnas || columnasPorReporte[codigo] || columnas(...campos),
  pagination: opciones.pagination,
});
const ordenar = (filas, clave, ascendente = false) => [...filas].sort((a, b) => ascendente ? numero(a[clave]) - numero(b[clave]) : numero(b[clave]) - numero(a[clave]));

export default class ReportesDominioServicio {
  constructor(salida) { this.salida = salida; }

  async productos(contexto) { return this.salida.listarTodos('inventario', 'productos', {}, contexto); }
  async movimientos(contexto, query = {}) { return this.salida.listarTodos('inventario', 'movimientos', query, contexto); }
  async facturas(contexto) { return this.salida.listarTodos('facturacion', 'facturas', {}, contexto); }
  async detallesFacturas(contexto) { return this.salida.listarTodos('facturacion', 'detalle-facturas', {}, contexto); }
  async abonos(contexto) { return this.salida.listarTodos('facturacion', 'deudas', {}, contexto); }

  async catalogoSeguro(servicio, ruta, contexto, query = {}) {
    try {
      return await this.salida.listarTodos(servicio, ruta, query, contexto);
    } catch (error) {
      if ([401, 403, 404].includes(error.status)) return [];
      throw error;
    }
  }

  async catalogosVentas(contexto) {
    const [usuarios, sucursales, clientes] = await Promise.all([
      this.catalogoSeguro('usuario', 'usuarios', contexto, { incluirInactivos: true }),
      this.catalogoSeguro('usuario', 'sucursales', contexto),
      this.catalogoSeguro('cliente', 'clientes', contexto),
    ]);
    const nombrePersona = item => item.nombre_completo
      || [item.nombres || item.nombre, item.apellidos || item.apellido].filter(Boolean).join(' ')
      || item.razon_social
      || null;
    return {
      usuarios: new Map(usuarios.map(item => [Number(item.id), nombrePersona(item)])),
      sucursales: new Map(sucursales.map(item => [Number(item.id), item.nombre || item.nombre_comercial || item.codigo])),
      clientes: new Map(clientes.map(item => [Number(item.id), nombrePersona(item)])),
    };
  }

  async kardexProducto(filtros, contexto) {
    return this.kardexFecha(filtros, contexto);
  }

  async kardexFecha(filtros, contexto) {
    const base = (await this.movimientos(contexto, {
      codigo: filtros.codigo,
      grupo: filtros.grupo,
      proveedorId: filtros.proveedorId,
      usuarioId: filtros.usuarioId,
      sucursalId: filtros.sucursalId,
      tipoMovimiento: filtros.tipoMovimiento,
      fechaDesde: filtros.fechaDesde,
      fechaHasta: filtros.fechaHasta,
    })).sort((a, b) => new Date(fechaRegistro(a)) - new Date(fechaRegistro(b)));
    const movimientos = base.map((movimiento) => ({
      id: movimiento.id,
      fecha: movimiento.fecha_operacion || fechaRegistro(movimiento),
      created_at: movimiento.fecha_operacion || fechaRegistro(movimiento),
      producto_id: movimiento.producto_id,
      producto_codigo: movimiento.producto_codigo,
      producto_nombre: movimiento.producto_nombre,
      grupo_producto: movimiento.grupo_producto,
      tipo: movimiento.tipo,
      naturaleza: movimiento.naturaleza,
      tipo_movimiento: movimiento.tipo_movimiento,
      referencia: movimiento.referencia_id,
      referencia_tipo: movimiento.referencia_tipo,
      referencia_codigo: movimiento.referencia_codigo,
      origen: movimiento.origen,
      usuario_id: movimiento.usuario_id,
      usuario_nombre: movimiento.usuario_nombre,
      sucursal_id: movimiento.sucursal_id,
      sucursal_nombre: movimiento.sucursal_nombre,
      cantidad: movimiento.cantidad,
      entrada: movimiento.naturaleza === 'ENTRADA' ? movimiento.cantidad : 0,
      salida: movimiento.naturaleza === 'SALIDA' ? movimiento.cantidad : 0,
      stock_anterior: movimiento.stock_anterior,
      stock_nuevo: movimiento.stock_nuevo,
      costo_unitario: movimiento.costo_unitario,
      costo_promedio_anterior: movimiento.costo_promedio_anterior,
      costo_promedio_nuevo: movimiento.costo_promedio_nuevo,
      saldo: numero(movimiento.stock_nuevo) * numero(movimiento.costo_promedio_nuevo ?? movimiento.costo_unitario),
      motivo: movimiento.motivo,
      observacion: movimiento.observacion,
    }));
    const ultimo = filtros.codigo && base.length ? base.at(-1) : null;
    const producto = ultimo ? {
      id: ultimo.producto_id,
      codigo: ultimo.producto_codigo,
      nombre: ultimo.producto_nombre,
      grupo: ultimo.grupo_producto,
      stock: numero(ultimo.stock_nuevo),
      costo: numero(ultimo.costo_promedio_nuevo ?? ultimo.costo_unitario),
    } : null;
    return reporte('kardex', 'Kardex', filtros, movimientos, {
      producto,
      movimientos: movimientos.length,
      stock_actual: producto?.stock ?? null,
      entradas: movimientos.reduce((suma, item) => suma + numero(item.entrada), 0),
      salidas: movimientos.reduce((suma, item) => suma + numero(item.salida), 0),
      costo_promedio: producto?.costo ?? null,
      valor_inventario: producto ? producto.stock * producto.costo : null,
      ultimo_movimiento: ultimo ? fechaRegistro(ultimo) : null,
    }, null,
    [['fecha', 'Fecha'], ['producto_codigo', 'Código'], ['producto_nombre', 'Producto'], ['tipo_movimiento', 'Movimiento'], ['referencia_codigo', 'Documento'], ['origen', 'Origen'], ['usuario_nombre', 'Usuario'], ['entrada', 'Entrada'], ['salida', 'Salida'], ['stock_anterior', 'Stock anterior'], ['stock_nuevo', 'Stock'], ['costo_unitario', 'Costo'], ['saldo', 'Saldo'], ['observacion', 'Observación']]);
  }

  async inventarioActual(filtros, contexto) {
    const productos = await this.productos(contexto);
    const filas = productos.map((producto) => ({ id: producto.id, codigo: producto.codigo, nombre: producto.nombre, grupo: producto.grupo, stock: numero(producto.stock), costo: numero(producto.costo), pvp1: numero(producto.pvp1), tipo_control_stock: producto.tipo_control_stock }));
    return reporte('inventario-actual', 'Inventario actual', filtros, filas, { productos: filas.length, unidades: filas.reduce((suma, item) => suma + item.stock, 0) }, null,
      [['codigo', 'Código'], ['nombre', 'Producto'], ['grupo', 'Grupo'], ['stock', 'Stock'], ['costo', 'Costo'], ['pvp1', 'Precio venta'], ['tipo_control_stock', 'Control de stock']]);
  }

  async inventarioValorizado(filtros, contexto) {
    const base = await this.inventarioActual(filtros, contexto);
    const filas = base.filas.map((producto) => ({ ...producto, valor_costo: Number((producto.stock * producto.costo).toFixed(2)), valor_venta: Number((producto.stock * producto.pvp1).toFixed(2)) }));
    return reporte('inventario-valorizado', 'Inventario valorizado', filtros, filas, { valor_costo: filas.reduce((suma, item) => suma + item.valor_costo, 0), valor_venta: filas.reduce((suma, item) => suma + item.valor_venta, 0) }, null,
      [['codigo', 'Código'], ['nombre', 'Producto'], ['stock', 'Stock'], ['costo', 'Costo unitario'], ['valor_costo', 'Valor a costo'], ['pvp1', 'Precio venta'], ['valor_venta', 'Valor a precio venta']]);
  }

  async productosSinStock(filtros, contexto) {
    const base = await this.inventarioActual(filtros, contexto);
    const filas = base.filas.filter((producto) => producto.stock <= 0 && producto.tipo_control_stock !== 'ILIMITADO');
    return reporte('productos-sin-stock', 'Productos sin stock', filtros, filas, { productos: filas.length });
  }

  async productosStockMinimo(filtros, contexto) {
    const minimo = numero(filtros.stockMinimo) || 5;
    const base = await this.inventarioActual({ ...filtros, stockMinimo: minimo }, contexto);
    const filas = base.filas.filter((producto) => producto.stock <= minimo && producto.tipo_control_stock !== 'ILIMITADO');
    return reporte('productos-stock-minimo', 'Productos con stock mínimo', { ...filtros, stockMinimo: minimo }, filas, { productos: filas.length, stock_minimo: minimo });
  }

  async contextoVentas(filtros, contexto, incluirProductos = false) {
    const consultas = [this.facturas(contexto), this.detallesFacturas(contexto)];
    if (incluirProductos) consultas.push(this.productos(contexto));
    const [facturas, detalles, productos = []] = await Promise.all(consultas);
    const coincide = (valor, filtro) => !filtro || String(valor) === String(filtro);
    const vigentes = filtrarRango(facturas.filter((factura) => factura.estado_pago !== 'ANULADA'), filtros)
      .filter((factura) => coincide(factura.sucursal_id, filtros.sucursalId))
      .filter((factura) => coincide(factura.usuario_id, filtros.usuarioId))
      .filter((factura) => coincide(factura.cliente_id, filtros.clienteId))
      .filter((factura) => coincide(factura.estado_pago, filtros.estado));
    const ids = new Set(vigentes.map((factura) => Number(factura.id)));
    return { facturas: vigentes, detalles: detalles.filter((detalle) => ids.has(Number(detalle.factura_id))), productos };
  }

  async productosVendidos(filtros, contexto, ascendente) {
    const { facturas, detalles, productos } = await this.contextoVentas(filtros, contexto, true);
    const productosPorId = new Map(productos.map((producto) => [Number(producto.id), producto]));
    const acumulado = new Map();
    detalles.filter((detalle) => detalle.producto_id).forEach((detalle) => {
      const id = Number(detalle.producto_id);
      const actual = acumulado.get(id) || { producto_id: id, codigo: detalle.codigo, nombre: detalle.nombre, cantidad_vendida: 0, total_vendido: 0 };
      actual.cantidad_vendida += numero(detalle.cantidad);
      actual.total_vendido += numero(detalle.total);
      acumulado.set(id, actual);
    });
    const filas = [...acumulado.values()].map((fila) => ({ ...fila, stock_actual: numero(productosPorId.get(fila.producto_id)?.stock) }));
    return reporte(ascendente ? 'productos-menos-vendidos' : 'productos-mas-vendidos', ascendente ? 'Productos menos vendidos' : 'Productos más vendidos', filtros, ordenar(filas, 'cantidad_vendida', ascendente), { facturas: facturas.length, productos: filas.length });
  }

  productosMasVendidos(filtros, contexto) { return this.productosVendidos(filtros, contexto, false); }
  productosMenosVendidos(filtros, contexto) { return this.productosVendidos(filtros, contexto, true); }

  async ingresosBase(filtros, contexto) {
    return filtrarRango(await this.salida.listarTodos('inventario', 'ingresos', {}, contexto), filtros)
      .filter(ingreso => !filtros.proveedorId || Number(ingreso.proveedor_id) === Number(filtros.proveedorId))
      .filter(ingreso => !filtros.estado || ingreso.estado === filtros.estado)
      .filter(ingreso => !filtros.buscar
        || coincideTexto(ingreso.id_personalizado, filtros.buscar)
        || coincideTexto(ingreso.numero_factura, filtros.buscar)
        || coincideTexto(ingreso.proveedor_nombre, filtros.buscar));
  }

  async comprasPorProveedor(filtros, contexto) {
    const ingresos = await this.ingresosBase(filtros, contexto);
    const acumulado = new Map();
    ingresos.forEach((ingreso) => {
      const id = ingreso.proveedor_id || 'sin-proveedor';
      const actual = acumulado.get(id) || { proveedor_id: ingreso.proveedor_id || null, proveedor_nombre: ingreso.proveedor_nombre || 'Sin proveedor', compras: 0, total_comprado: 0 };
      actual.compras += 1;
      actual.total_comprado += numero(ingreso.total);
      acumulado.set(id, actual);
    });
    return reporte('compras-proveedor', 'Compras por proveedor', filtros, ordenar([...acumulado.values()], 'total_comprado'), {
      compras: ingresos.length,
      total_comprado: ingresos.reduce((suma, ingreso) => suma + numero(ingreso.total), 0),
    });
  }

  async ingresosMercaderia(filtros, contexto) {
    const filas = await this.ingresosBase(filtros, contexto);
    return reporte('ingresos-mercaderia', 'Ingresos de mercadería por fechas', filtros, filas, { ingresos: filas.length, total: filas.reduce((suma, item) => suma + numero(item.total), 0) });
  }

  async egresosMercaderia(filtros, contexto) {
    const filas = filtrarRango(await this.salida.listarTodos('inventario', 'egresos', {}, contexto), filtros);
    return reporte('egresos-mercaderia', 'Egresos de mercadería por fechas', filtros, filas, { egresos: filas.length, costo_total: filas.reduce((suma, item) => suma + numero(item.costo_total), 0) });
  }

  async ventasGenerales(filtros, contexto, configuracion = {}) {
    const [facturas, detalles, productos, abonos, catalogos] = await Promise.all([
      this.facturas(contexto),
      this.detallesFacturas(contexto),
      this.productos(contexto),
      this.abonos(contexto),
      this.catalogosVentas(contexto),
    ]);
    const costos = new Map(productos.map(producto => [Number(producto.id), numero(producto.costo)]));
    const detallesPorFactura = new Map();
    detalles.forEach(detalle => {
      const id = Number(detalle.factura_id);
      const actuales = detallesPorFactura.get(id) || [];
      actuales.push(detalle);
      detallesPorFactura.set(id, actuales);
    });
    const facturasPorId = new Map(facturas.map(factura => [Number(factura.id), factura]));
    const nombreUsuario = id => catalogos.usuarios.get(Number(id)) || (id ? `Usuario #${id}` : 'Sin usuario');
    const nombreSucursal = id => catalogos.sucursales.get(Number(id)) || (id ? `Sucursal #${id}` : 'Sin sucursal');
    const nombreCliente = registro => registro.cliente_nombre
      || catalogos.clientes.get(Number(registro.cliente_id))
      || (registro.cliente_id ? `Cliente #${registro.cliente_id}` : 'Consumidor final');
    const coincide = (valor, filtro) => !filtro || String(valor) === String(filtro);
    const filtrarComun = registro => dentroDeRango(fechaRegistro(registro), filtros.fechaDesde, filtros.fechaHasta)
      && coincide(registro.cliente_id, filtros.clienteId)
      && coincide(registro.usuario_id, filtros.usuarioId)
      && coincideTexto(registro.id_personalizado || registro.factura_id_personalizado, filtros.buscarFactura)
      && coincideTexto(nombreCliente(registro), filtros.buscarCliente || filtros.buscar);

    const filasVentas = facturas
      .filter(factura => filtrarComun(factura))
      .filter(factura => coincide(factura.sucursal_id, filtros.sucursalId))
      .filter(factura => coincide(factura.estado_pago, filtros.estado))
      .filter(factura => !filtros.metodoPago || normalizarMetodoPago(factura.metodo_pago, factura.es_credito) === filtros.metodoPago)
      .map(factura => {
        const costo = (detallesPorFactura.get(Number(factura.id)) || []).reduce(
          (suma, detalle) => suma + (costos.get(Number(detalle.producto_id)) || 0) * numero(detalle.cantidad),
          0,
        );
        const total = numero(factura.total);
        return {
          id: `VENTA-${factura.id}`,
          referenciaId: factura.id,
          tipoTransaccion: 'VENTA',
          tipoTransaccionLabel: 'Venta',
          numeroFactura: factura.id_personalizado || `#${factura.id}`,
          clienteId: factura.cliente_id,
          cliente: nombreCliente(factura),
          sucursalId: factura.sucursal_id,
          sucursal: nombreSucursal(factura.sucursal_id),
          usuarioId: factura.usuario_id,
          usuario: nombreUsuario(factura.usuario_id),
          fecha: fechaRegistro(factura),
          metodoPago: normalizarMetodoPago(factura.metodo_pago, factura.es_credito),
          metodoPagoOriginal: normalizarMetodoPago(factura.metodo_pago),
          tipoVenta: factura.tipo_venta || (factura.es_credito ? 'CREDITO' : 'CONTADO'),
          estado: factura.estado_pago,
          subtotal: numero(factura.subtotal),
          iva: numero(factura.iva),
          total,
          monto: total,
          montoCobrado: factura.es_credito ? 0 : numero(factura.abonado),
          abonado: numero(factura.abonado),
          saldoPendiente: numero(factura.saldo_pendiente),
          costo: Number(costo.toFixed(2)),
          utilidad: Number((total - costo).toFixed(2)),
        };
      });

    const filasCobros = abonos
      .filter(abono => numero(abono.monto_pagado) > 0)
      .filter(abono => filtrarComun(abono))
      .filter(abono => !filtros.metodoPago || normalizarMetodoPago(abono.metodo_pago) === filtros.metodoPago)
      .map(abono => {
        const factura = facturasPorId.get(Number(abono.factura_id)) || {};
        const sucursalId = factura.sucursal_id || null;
        if (!coincide(sucursalId, filtros.sucursalId)) return null;
        const monto = numero(abono.monto_pagado);
        return {
          id: `COBRO-${abono.id}`,
          referenciaId: abono.id,
          tipoTransaccion: 'COBRO',
          tipoTransaccionLabel: 'Pago de deuda',
          numeroFactura: abono.factura_id_personalizado || factura.id_personalizado || `#${abono.factura_id}`,
          clienteId: abono.cliente_id,
          cliente: nombreCliente(abono),
          sucursalId,
          sucursal: nombreSucursal(sucursalId),
          usuarioId: abono.usuario_id,
          usuario: nombreUsuario(abono.usuario_id),
          fecha: fechaRegistro(abono),
          metodoPago: normalizarMetodoPago(abono.metodo_pago),
          estado: abono.estado_pago,
          subtotal: 0,
          iva: 0,
          total: monto,
          monto,
          montoCobrado: monto,
          abonado: monto,
          saldoPendiente: numero(abono.saldo_restante),
          costo: 0,
          utilidad: 0,
        };
      })
      .filter(Boolean);

    const tipoTransaccion = filtros.tipoTransaccion || 'TODAS';
    const incluirVentas = ['TODAS', 'VENTAS', 'VENTAS_COBROS'].includes(tipoTransaccion);
    const incluirCobros = ['TODAS', 'COBROS', 'VENTAS_COBROS'].includes(tipoTransaccion);
    const filasCompletas = [
      ...(incluirVentas ? filasVentas : []),
      ...(incluirCobros ? filasCobros : []),
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const totalRows = filasCompletas.length;
    const pageSize = Math.min(Math.max(Number(filtros.pageSize) || 20, 1), configuracion.pageSizeMax || 5000);
    const totalPages = Math.ceil(totalRows / pageSize);
    const page = totalPages ? Math.min(Math.max(Number(filtros.page) || 1, 1), totalPages) : 1;
    const filas = filasCompletas.slice((page - 1) * pageSize, page * pageSize);
    const resumen = resumirTransacciones(filasCompletas);
    const filtrosUsados = {
      fechaDesde: filtros.fechaDesde || '',
      fechaHasta: filtros.fechaHasta || '',
      sucursalId: filtros.sucursalId || '',
      usuarioId: filtros.usuarioId || '',
      clienteId: filtros.clienteId || '',
      estado: filtros.estado || '',
      metodoPago: filtros.metodoPago || '',
      tipoTransaccion,
      buscarFactura: filtros.buscarFactura || '',
      buscarCliente: filtros.buscarCliente || filtros.buscar || '',
    };
    return reporte(configuracion.id || 'analisis-ventas', configuracion.title || 'Análisis de Ventas', filtrosUsados, filas, {
      ...resumen,
      totalVentas: resumen.ventas,
      total: resumen.montoVentas,
      montoTotal: resumen.montoVentas,
    }, null, [], {
      shortTitle: configuracion.shortTitle || 'Análisis',
      pagination: { page, pageSize, totalRows, totalPages },
      columnas: [
        { key: 'tipoTransaccionLabel', label: 'Movimiento', type: 'text' },
        { key: 'numeroFactura', label: 'Factura', type: 'text' },
        { key: 'cliente', label: 'Cliente', type: 'text' },
        { key: 'sucursal', label: 'Sucursal', type: 'text' },
        { key: 'usuario', label: 'Usuario', type: 'text' },
        { key: 'fecha', label: 'Fecha', type: 'datetime' },
        { key: 'metodoPago', label: 'Método de pago', type: 'text' },
        { key: 'subtotal', label: 'Subtotal', type: 'currency' },
        { key: 'iva', label: 'IVA', type: 'currency' },
        { key: 'total', label: 'Total', type: 'currency' },
        { key: 'saldoPendiente', label: 'Saldo pendiente', type: 'currency' },
        { key: 'costo', label: 'Costo', type: 'currency' },
        { key: 'utilidad', label: 'Utilidad', type: 'currency' },
        { key: 'estado', label: 'Estado', type: 'text' },
      ],
    });
  }

  async ventasPorFecha(filtros, contexto) {
    return this.ventasGenerales(filtros, contexto, { id: 'ventas-fecha', title: 'Ventas por rango de fechas', shortTitle: 'Ventas por fecha' });
  }

  async ventasAgrupadas(filtros, contexto, campoId, campoNombre, codigo, titulo) {
    const { facturas } = await this.contextoVentas(filtros, contexto);
    let catalogo = [];
    try {
      catalogo = campoId === 'sucursal_id'
        ? await this.salida.listarTodos('usuario', 'sucursales', {}, contexto)
        : campoId === 'usuario_id'
          ? await this.salida.listarTodos('usuario', 'usuarios', { incluirInactivos: true }, contexto)
          : [];
    } catch (error) {
      if (![401, 403].includes(error.status)) throw error;
    }
    const nombres = new Map(catalogo.map((item) => [Number(item.id), item.nombre_completo || [item.nombre, item.apellido].filter(Boolean).join(' ') || 'Sin asignar']));
    const acumulado = new Map();
    facturas.forEach((factura) => {
      const id = factura[campoId] || 'sin-asignar';
      const nombre = factura[campoNombre] || nombres.get(Number(factura[campoId])) || (factura[campoId] ? `#${factura[campoId]}` : 'Sin asignar');
      const actual = acumulado.get(id) || { [campoId]: factura[campoId] || null, [campoNombre]: nombre, ventas: 0, total: 0, abonado: 0, saldo_pendiente: 0 };
      actual.ventas += 1;
      actual.total += numero(factura.total);
      actual.abonado += numero(factura.abonado);
      actual.saldo_pendiente += numero(factura.saldo_pendiente);
      acumulado.set(id, actual);
    });
    return reporte(codigo, titulo, filtros, ordenar([...acumulado.values()], 'total'), { ventas: facturas.length });
  }

  ventasPorSucursal(filtros, contexto) { return this.ventasAgrupadas(filtros, contexto, 'sucursal_id', 'sucursal_nombre', 'ventas-sucursal', 'Ventas por sucursal'); }
  ventasPorUsuario(filtros, contexto) { return this.ventasAgrupadas(filtros, contexto, 'usuario_id', 'usuario_nombre', 'ventas-usuario', 'Ventas por usuario'); }
  ventasPorCliente(filtros, contexto) { return this.ventasAgrupadas(filtros, contexto, 'cliente_id', 'cliente_nombre', 'ventas-cliente', 'Ventas por cliente'); }

  async utilidadVentas(filtros, contexto) {
    const { facturas, detalles, productos } = await this.contextoVentas(filtros, contexto, true);
    const costos = new Map(productos.map((producto) => [Number(producto.id), numero(producto.costo)]));
    const filas = facturas.map((factura) => {
      const detallesFactura = detalles.filter((detalle) => Number(detalle.factura_id) === Number(factura.id));
      const costo = detallesFactura.reduce((suma, detalle) => suma + (costos.get(Number(detalle.producto_id)) || 0) * numero(detalle.cantidad), 0);
      const venta = numero(factura.total);
      return { id: factura.id, id_personalizado: factura.id_personalizado, fecha: fechaRegistro(factura), venta, costo: Number(costo.toFixed(2)), utilidad: Number((venta - costo).toFixed(2)) };
    });
    return reporte('utilidad-ventas', 'Utilidad por ventas', filtros, filas, { ventas: filas.length, venta: filas.reduce((suma, item) => suma + item.venta, 0), costo: filas.reduce((suma, item) => suma + item.costo, 0), utilidad: filas.reduce((suma, item) => suma + item.utilidad, 0) });
  }

  async movimientosCajas(contexto) {
    const [banco, chica] = await Promise.all([
      this.salida.listarTodos('caja', 'cajas-banco', {}, contexto),
      this.salida.listarTodos('caja', 'cajas-chicas', {}, contexto),
    ]);
    const cargar = async (cajas, ruta, tipo) => (await Promise.all(cajas.map(async (caja) => {
      const respuesta = await this.salida.leer('caja', `${ruta}/${caja.id}/movimientos`, {}, contexto);
      return lista(respuesta).map((movimiento) => ({ ...movimiento, tipo_caja: tipo, caja_id: caja.id }));
    }))).flat();
    return [...await cargar(banco, 'cajas-banco', 'BANCO'), ...await cargar(chica, 'cajas-chicas', 'CHICA')];
  }

  async flujoCaja(filtros, contexto) {
    const filas = filtrarRango(await this.movimientosCajas(contexto), filtros).sort((a, b) => new Date(fechaRegistro(b)) - new Date(fechaRegistro(a)));
    return reporte('flujo-caja', 'Flujo de caja', filtros, filas, { ingresos: filas.filter((item) => item.tipo === 'INGRESO').reduce((suma, item) => suma + numero(item.monto), 0), egresos: filas.filter((item) => item.tipo === 'EGRESO').reduce((suma, item) => suma + numero(item.monto), 0) });
  }

  async estadoCuentasCobrar(filtros, contexto) {
    const { facturas } = await this.contextoVentas(filtros, contexto);
    const filas = facturas
      .filter((factura) => numero(factura.saldo_pendiente) > 0)
      .filter((factura) => !filtros.buscar
        || coincideTexto(factura.id_personalizado, filtros.buscar)
        || coincideTexto(factura.cliente_nombre, filtros.buscar))
      .map((factura) => ({ factura_id: factura.id, factura_id_personalizado: factura.id_personalizado, cliente_id: factura.cliente_id, cliente_nombre: factura.cliente_nombre, total: numero(factura.total), abonado: numero(factura.abonado), saldo_pendiente: numero(factura.saldo_pendiente), fecha: fechaRegistro(factura) }));
    return reporte('estado-cuentas-cobrar', 'Estado de cuentas por cobrar', filtros, filas, { facturas: filas.length, saldo_total: filas.reduce((suma, item) => suma + item.saldo_pendiente, 0) });
  }

  async cajaDashboard(tipo, contexto, periodo) {
    const esChica = tipo === 'CHICA';
    const ruta = esChica ? 'cajas-chicas' : 'cajas-banco';
    const caja = resultado(await this.salida.leer('caja', `${ruta}/abierta`, {}, contexto));
    if (!caja) {
      return {
        caja: null,
        stats: { totalIngresos: 0, totalEgresos: 0, flujoNeto: 0, totalMovimientos: 0 },
      };
    }
    const movimientos = filtrarRango(
      lista(await this.salida.leer('caja', `${ruta}/${caja.id}/movimientos`, {}, contexto)),
      periodo,
    );
    const totalIngresos = movimientos
      .filter(movimiento => movimiento.tipo === 'INGRESO')
      .reduce((suma, movimiento) => suma + numero(movimiento.monto), 0);
    const totalEgresos = movimientos
      .filter(movimiento => movimiento.tipo === 'EGRESO')
      .reduce((suma, movimiento) => suma + numero(movimiento.monto), 0);
    return {
      caja: {
        id: caja.id,
        fecha: caja.fecha,
        estado: caja.estado || 'ABIERTA',
        abierta: caja.estado === 'ABIERTA',
        ...(esChica
          ? { montoInicial: numero(caja.monto_inicial), montoActual: numero(caja.monto_actual) }
          : { saldoInicial: numero(caja.saldo_inicial), saldoActual: numero(caja.saldo_actual) }),
      },
      stats: {
        totalIngresos: Number(totalIngresos.toFixed(2)),
        totalEgresos: Number(totalEgresos.toFixed(2)),
        flujoNeto: Number((totalIngresos - totalEgresos).toFixed(2)),
        totalMovimientos: movimientos.length,
      },
    };
  }

  async dashboardIndicadores(filtros, contexto) {
    const periodo = periodoMes(filtros);
    const [analisisVentas, inventario, ingresos, clientes, cajaChica, cajaBanco] = await Promise.all([
      this.ventasGenerales(
        { tipoTransaccion: 'VENTAS_COBROS', page: 1, pageSize: Number.MAX_SAFE_INTEGER },
        contexto,
        { pageSizeMax: Number.MAX_SAFE_INTEGER },
      ),
      this.inventarioActual({}, contexto),
      this.ingresosBase({}, contexto),
      this.catalogoSeguro('cliente', 'clientes', contexto, { estado: 'todos' }),
      this.cajaDashboard('CHICA', contexto, periodo),
      this.cajaDashboard('BANCO', contexto, periodo),
    ]);

    const transacciones = analisisVentas.filas;
    const resumenVentas = resumirTransacciones(transacciones);
    const transaccionesMes = filtrarRango(transacciones, periodo);
    const resumenVentasMes = resumirTransacciones(transaccionesMes);
    const ventasVigentes = transacciones.filter(item => item.tipoTransaccion === 'VENTA' && item.estado !== 'ANULADA');
    const facturasPendientes = ventasVigentes.filter(item => numero(item.saldoPendiente) > 0);
    const productos = inventario.filas;
    const productosControlados = productos.filter(producto => producto.tipo_control_stock !== 'ILIMITADO');
    const ingresosMes = filtrarRango(ingresos, periodo).filter(ingreso => ingreso.estado !== 'ANULADO');
    const clientesActivos = clientes.filter(cliente => cliente.activo !== false);
    const clientesNuevosMes = filtrarRango(clientes, periodo).length;

    const datos = {
      periodo,
      ventas: {
        totalVentas: resumenVentas.ventas,
        totalVentasMes: resumenVentasMes.ventas,
        montoTotal: resumenVentas.montoVentas,
        montoTotalMes: resumenVentasMes.montoVentas,
        montoCobrado: resumenVentas.montoCobrado,
        montoAbonadoMes: resumenVentasMes.montoCobrado,
        ventasPendientes: transaccionesMes.filter(item => item.tipoTransaccion === 'VENTA' && item.estado === 'PENDIENTE').length,
      },
      deudas: {
        facturasConDeuda: facturasPendientes.length,
        totalDeuda: Number(facturasPendientes.reduce((suma, factura) => suma + numero(factura.saldoPendiente), 0).toFixed(2)),
      },
      clientes: {
        totalClientes: clientes.length,
        totalActivos: clientesActivos.length,
        nuevosMes: clientesNuevosMes,
      },
      productos: {
        totalActivos: productos.length,
        conStock: productosControlados.filter(producto => numero(producto.stock) > 0).length,
        sinStock: productosControlados.filter(producto => numero(producto.stock) <= 0).length,
        unidadesStock: productosControlados.reduce((suma, producto) => suma + numero(producto.stock), 0),
        valorInventario: Number(productosControlados.reduce((suma, producto) => suma + numero(producto.stock) * numero(producto.costo), 0).toFixed(2)),
      },
      ingresos: {
        totalIngresosMes: ingresosMes.length,
        montoIngresosMes: Number(ingresosMes.reduce((suma, ingreso) => suma + numero(ingreso.total), 0).toFixed(2)),
        borradores: ingresosMes.filter(ingreso => ingreso.estado === 'BORRADOR').length,
        pendientes: ingresosMes.filter(ingreso => ingreso.estado === 'BORRADOR').length,
      },
      cajaChica: cajaChica.caja,
      cajaChicaStats: cajaChica.stats,
      cajaBanco: cajaBanco.caja,
      cajaBancoStats: cajaBanco.stats,
    };

    const ultimasVentas = transacciones
      .filter(item => item.tipoTransaccion === 'VENTA')
      .slice(0, 5)
      .map(item => ({
        id: item.referenciaId,
        id_personalizado: item.numeroFactura,
        cliente_nombre: item.cliente,
        total: item.total,
        estado_pago: item.estado,
        created_at: item.fecha,
        tipo_venta: item.tipoVenta,
        metodo_pago: item.metodoPagoOriginal,
      }));
    const flujoNeto = cajaChica.stats.flujoNeto + cajaBanco.stats.flujoNeto;

    return reporte('dashboard-indicadores', 'Dashboard de indicadores', periodo, ultimasVentas, {
      productos: datos.productos.totalActivos,
      unidades_stock: datos.productos.unidadesStock,
      ventas: datos.ventas.totalVentasMes,
      total_ventas: datos.ventas.montoTotalMes,
      total_cobrado: datos.ventas.montoAbonadoMes,
      cuentas_por_cobrar: datos.deudas.totalDeuda,
      clientes_activos: datos.clientes.totalActivos,
      ingresos_mes: datos.ingresos.totalIngresosMes,
      valor_inventario: datos.productos.valorInventario,
      flujo_neto: Number(flujoNeto.toFixed(2)),
    }, datos, [], {
      columnas: [
        { key: 'id_personalizado', label: 'Factura', type: 'text' },
        { key: 'cliente_nombre', label: 'Cliente', type: 'text' },
        { key: 'total', label: 'Total', type: 'currency' },
        { key: 'estado_pago', label: 'Estado', type: 'text' },
        { key: 'created_at', label: 'Fecha', type: 'datetime' },
        { key: 'tipo_venta', label: 'Tipo de venta', type: 'text' },
        { key: 'metodo_pago', label: 'Método de pago', type: 'text' },
      ],
    });
  }
}
