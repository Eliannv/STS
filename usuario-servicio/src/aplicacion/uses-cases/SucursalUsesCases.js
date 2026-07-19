import Sucursal from '../../dominio/entidades/Sucursal.js';

export default class SucursalUsesCases {
  constructor(command, query) { this.command = command; this.query = query; }
  lista() { return this.query.lista(); }
  buscarPorId(id) { return id ? this.query.buscarPorId(id) : Promise.resolve({ estado: 'error', resultado: null }); }
  crear(dto) { return dto.codigo && dto.nombre ? this.command.guardar(new Sucursal(null, dto.codigo, dto.nombre, true, dto.direccion, dto.telefono, dto.email, dto.creadoPorId)) : Promise.resolve({ estado: 'error', resultado: 'Código y nombre son requeridos' }); }
  editar(dto) { return dto.id && dto.codigo && dto.nombre ? this.command.actualizar(new Sucursal(dto.id, dto.codigo, dto.nombre, dto.activo, dto.direccion, dto.telefono, dto.email)) : Promise.resolve({ estado: 'error', resultado: 'ID, código y nombre son requeridos' }); }
  eliminar(id) { return id ? this.command.eliminar(id) : Promise.resolve({ estado: 'error', resultado: 'El ID es requerido para eliminar' }); }
}
