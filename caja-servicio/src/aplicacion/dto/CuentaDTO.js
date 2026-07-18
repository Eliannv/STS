export class CuentaDTO {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.fecha = datos.fecha ?? null;
    this.tipo = datos.tipo ?? null;
    this.tipoCuentaPorPagar = datos.tipoCuentaPorPagar ?? datos.tipo_cuenta_por_pagar ?? null;
    this.montoTotal = Number(datos.montoTotal ?? datos.monto_total) || 0;
    this.montoAbonado = Number(datos.montoAbonado ?? datos.monto_abonado) || 0;
    this.saldo = Number(datos.saldo) || 0;
    this.estado = datos.estado ?? 'ACTIVA';
    this.observacion = datos.observacion ?? '';
    this.terceroNombre = datos.terceroNombre ?? datos.tercero_nombre ?? null;
    this.terceroId = datos.terceroId ?? datos.tercero_id ?? null;
    this.usuarioId = datos.usuarioId ?? datos.usuario_id ?? null;
    this.sucursalId = datos.sucursalId ?? datos.sucursal_id ?? null;
    this.cajaBancoId = datos.cajaBancoId ?? datos.caja_banco_id ?? null;
  }
}
