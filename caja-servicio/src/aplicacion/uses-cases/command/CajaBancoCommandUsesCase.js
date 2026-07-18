import CajaBanco from '../../../dominio/entidades/CajaBanco.js';
import MovimientoCajaBanco from '../../../dominio/entidades/MovimientoCajaBanco.js';

export default class CajaBancoCommandUsesCase {
  constructor(command, query) { this.command = command; this.query = query; }
  async abrir(datos) {
    if (!datos.fecha) return { estado: 'error', resultado: 'La fecha es requerida' };
    if (!datos.usuarioId) return { estado: 'error', resultado: 'El usuario es requerido' };
    if ((await this.query.cajaAbierta()).resultado) return { estado: 'error', resultado: 'Ya existe una Caja Banco abierta. Ciérrala primero.' };
    const mes = new Date(datos.fecha).toISOString().slice(0, 7);
    if ((await this.query.buscarPorMes(mes)).length) return { estado: 'error', resultado: `Ya existe una Caja Banco para ${mes}.` };
    return this.command.abrir(new CajaBanco(null, { ...datos, saldoActual: datos.saldoInicial, estado: 'ABIERTA', activo: true }));
  }
  cerrar(datos) { return datos.id ? this.command.cerrar(datos.id, { cerradoEn: new Date(), cerradoPorId: datos.cerradoPorId || datos.usuarioId, cerradoPorNombre: datos.cerradoPorNombre || datos.usuarioNombre }) : Promise.resolve({ estado: 'error', resultado: 'El id es requerido' }); }
  registrarMovimiento(datos) {
    if (!datos.cajaBancoId || !datos.tipo || !datos.categoria || !(Number(datos.monto) > 0)) return Promise.resolve({ estado: 'error', resultado: 'Caja, tipo, categoría y monto válido son requeridos' });
    return this.command.registrarMovimiento(new MovimientoCajaBanco(null, datos));
  }
  eliminarMovimiento(id) { return id ? this.command.eliminarMovimiento(id) : Promise.resolve({ estado: 'error', resultado: 'movimientoId es requerido' }); }
}
