import Sucursal from '../../dominio/entidades/Sucursal.js';

const error = (mensaje) => Promise.resolve({ estado: 'error', resultado: mensaje });
const normalizarCodigo = (codigo) => String(codigo ?? '').trim().toUpperCase();

export default class SucursalUsesCases {
  constructor(command, query) { this.command = command; this.query = query; }

  lista(filtros = {}) { return this.query.lista(filtros); }
  buscarPorId(id) { return id ? this.query.buscarPorId(id) : error('El ID es requerido'); }

  crear(dto) {
    const codigo = normalizarCodigo(dto.codigo);
    if (!codigo || !String(dto.nombre ?? '').trim()) return error('Código y nombre son requeridos');
    if (codigo.length > 20) return error('El código no puede superar 20 caracteres');
    return this.command.guardar(new Sucursal(null, codigo, dto.nombre.trim(), true, dto.direccion, dto.telefono, dto.email, dto.creadoPorId));
  }

  async editar(dto) {
    const codigo = normalizarCodigo(dto.codigo);
    if (!dto.id || !codigo || !String(dto.nombre ?? '').trim()) return { estado: 'error', resultado: 'ID, código y nombre son requeridos' };
    if (codigo.length > 20) return { estado: 'error', resultado: 'El código no puede superar 20 caracteres' };

    const actual = await this.query.buscarPorId(dto.id);
    if (actual.estado !== 'ok') return { estado: 'error', resultado: 'Sucursal no encontrada' };

    // La matriz es el destino de los datos huérfanos: debe permanecer operativa.
    if (actual.resultado.es_matriz && dto.activo === false) {
      return { estado: 'error', resultado: 'La sucursal matriz no puede desactivarse' };
    }
    if (dto.activo === false) {
      const bloqueo = await this.validarSinUsuariosActivos(dto.id, 'desactivar');
      if (bloqueo) return bloqueo;
    }

    return this.command.actualizar(new Sucursal(dto.id, codigo, dto.nombre.trim(), dto.activo, dto.direccion, dto.telefono, dto.email));
  }

  async eliminar(id) {
    if (!id) return { estado: 'error', resultado: 'El ID es requerido para eliminar' };

    const actual = await this.query.buscarPorId(id);
    if (actual.estado !== 'ok') return { estado: 'error', resultado: 'Sucursal no encontrada' };
    if (actual.resultado.es_matriz) return { estado: 'error', resultado: 'La sucursal matriz no puede eliminarse' };

    const bloqueo = await this.validarSinUsuariosActivos(id, 'eliminar');
    if (bloqueo) return bloqueo;

    return this.command.eliminar(id);
  }

  // Desactivar una sucursal con personal asignado dejaría a esos usuarios operando
  // sobre una sucursal inexistente para el resto del sistema.
  async validarSinUsuariosActivos(id, accion) {
    const usuarios = await this.query.contarUsuariosActivos(id);
    if (usuarios > 0) {
      return { estado: 'error', resultado: `No se puede ${accion}: la sucursal tiene ${usuarios} usuario(s) activo(s). Reasígnelos primero.` };
    }
    return null;
  }
}
