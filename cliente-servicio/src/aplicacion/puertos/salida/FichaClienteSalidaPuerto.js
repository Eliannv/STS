// Puerto de salida hacia los demás microservicios. cliente-servicio es dueño del
// cliente y de su historial clínico; el resto de la ficha (compras, cuentas, pagos)
// pertenece a otros servicios y se consulta a través de este puerto.
//
// Cada método recibe el contexto de la petición (authorization, sucursal, traceId)
// para que el servicio de origen aplique su propio SucursalScope. Aquí no se
// reimplementan reglas de sucursal.
export default class FichaClienteSalidaPuerto {
  facturasDelCliente(clienteId, contexto) { throw new Error('facturasDelCliente no implementado'); }
  resumenFinanciero(clienteId, contexto, alcance) { throw new Error('resumenFinanciero no implementado'); }
  cuentasPorCobrar(clienteId, contexto) { throw new Error('cuentasPorCobrar no implementado'); }
  pagosRealizados(clienteId, contexto) { throw new Error('pagosRealizados no implementado'); }
  ventasConTarjeta(clienteId, contexto) { throw new Error('ventasConTarjeta no implementado'); }
  catalogoSucursales(contexto) { throw new Error('catalogoSucursales no implementado'); }
  catalogoUsuarios(contexto) { throw new Error('catalogoUsuarios no implementado'); }
}
