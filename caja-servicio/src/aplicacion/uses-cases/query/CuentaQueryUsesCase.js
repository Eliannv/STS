// caja-servicio/src/aplicacion/uses-cases/query/CuentaQueryUsesCase.js
import MovimientoCuentaDTO from '../../dto/MovimientoCuentaDTO.js';

export default class CuentaQueryUsesCase {
  constructor(adaptador) { this.adaptador = adaptador; }
  lista(filtros) { return this.adaptador.lista(filtros); }
  buscarPorId(id) { return id ? this.adaptador.buscarPorId(id) : Promise.resolve({ estado: 'error', resultado: null }); }
  async movimientos(id) {
    if (!id) return { estado: 'error', resultado: [] };
    const movimientos = await this.adaptador.findMovimientosByCuentaId(id);
    return {
      estado: 'ok',
      resultado: movimientos.map(MovimientoCuentaDTO.fromEntidad),
    };
  }
}
