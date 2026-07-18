import CajaChica from '../../../dominio/entidades/CajaChica.js';
import MovimientoCajaChica from '../../../dominio/entidades/MovimientoCajaChica.js';

export default class CajaChicaCommandUsesCase {
  constructor(command, query) { this.command = command; this.query = query; }
  async abrir(datos) {
    if (!datos.fecha) return { estado: 'error', resultado: 'La fecha es requerida' };
    if (!datos.usuarioId) return { estado: 'error', resultado: 'El usuario es requerido' };
    if ((await this.query.cajaAbierta()).resultado) return { estado: 'error', resultado: 'Ya existe una Caja Chica abierta. Ciérrala primero.' };
    const fecha = new Date(datos.fecha).toISOString().slice(0, 10);
    if ((await this.query.buscarPorFecha(fecha)).length) return { estado: 'error', resultado: `Ya existe una Caja Chica para ${fecha}.` };
    return this.command.abrir(new CajaChica(null, { ...datos, montoActual: datos.montoInicial, estado: 'ABIERTA', activo: true }));
  }
  cerrar(datos) { return datos.id ? this.command.cerrar(datos.id, { cerradoEn: new Date(), cerradoPorId: datos.cerradoPorId || datos.usuarioId, cerradoPorNombre: datos.cerradoPorNombre || datos.usuarioNombre, cajaBancoId: datos.cajaBancoId }) : Promise.resolve({ estado: 'error', resultado: 'El id es requerido' }); }
  registrarMovimiento(datos) {
    if (!datos.cajaChicaId || !datos.tipo || !datos.descripcion || !(Number(datos.monto) > 0)) return Promise.resolve({ estado: 'error', resultado: 'Caja, tipo, descripción y monto válido son requeridos' });
    return this.command.registrarMovimiento(new MovimientoCajaChica(null, datos));
  }
  eliminarMovimiento(id) { return id ? this.command.eliminarMovimiento(id) : Promise.resolve({ estado: 'error', resultado: 'movimientoId es requerido' }); }
}
