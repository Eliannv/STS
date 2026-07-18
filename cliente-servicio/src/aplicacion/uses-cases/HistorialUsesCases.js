import HistorialClinico from '../../dominio/entidades/HistorialClinico.js';

export default class HistorialUsesCases {
  constructor(command, query) { this.command = command; this.query = query; }
  listaPorCliente(id) { return id ? this.query.listaPorCliente(id) : Promise.resolve({ estado: 'error', resultado: [] }); }
  buscarPorId(id) { return id ? this.query.buscarPorId(id) : Promise.resolve({ estado: 'error', resultado: null }); }
  crear(dto) { return dto.clienteId ? this.command.guardar(new HistorialClinico(null, dto)) : Promise.resolve({ estado: 'error', resultado: 'El ID del cliente es requerido' }); }
  editar(dto) { return dto.id ? this.command.actualizar(new HistorialClinico(dto.id, dto)) : Promise.resolve({ estado: 'error', resultado: 'El ID es requerido' }); }
  eliminar(id) { return this.command.eliminar(id); }
}
