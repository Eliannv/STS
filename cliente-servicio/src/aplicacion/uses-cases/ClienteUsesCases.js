import Cliente from '../../dominio/entidades/Cliente.js';

export default class ClienteUsesCases {
  constructor(command, query) { this.command = command; this.query = query; }
  lista(buscar, pag) { return this.query.lista(buscar, pag); }
  buscarPorId(id) { return this.query.buscarPorId(id); }
  crear(dto) {
    if (!dto.nombres || !dto.apellidos) return Promise.resolve({ estado: 'error', resultado: 'Nombres y apellidos son requeridos' });
    return this.command.guardar(new Cliente(null, {
      ...dto,
      activo: true,
      tieneHistorialClinico: false,
      tieneCredito: false,
      tieneDeuda: false
    }));
  }
  editar(dto) {
    if (!dto.id || !dto.nombres || !dto.apellidos) return Promise.resolve({ estado: 'error', resultado: 'ID, nombres y apellidos son requeridos' });
    return this.command.actualizar(new Cliente(dto.id, dto));
  }
  eliminar(id) {
    return id
      ? this.command.eliminar(id)
      : Promise.resolve({ estado: 'error', resultado: 'El ID es requerido para eliminar' });
  }
}
