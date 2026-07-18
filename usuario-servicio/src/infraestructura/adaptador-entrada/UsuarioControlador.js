import UsuarioEntradaPuerto from '../../aplicacion/puertos/entrada/UsuarioEntradaPuerto.js';
import { UsuarioDTO } from '../../aplicacion/dto/UsuarioDTO.js';

export class UsuarioControlador extends UsuarioEntradaPuerto {
  constructor(command, query) {
    super();
    this.command = command;
    this.query = query;
  }

  async login(req, res) {
    const resultado = await this.command.login(new UsuarioDTO(req.body));
    return res.status(resultado.estado === 'ok' ? 200 : 401).json({ ...resultado, traceId: req.traceId });
  }

  async crear(req, res) {
    const resultado = await this.command.crear(new UsuarioDTO(req.body));
    return res.status(resultado.estado === 'ok' ? 201 : 400).json({ ...resultado, traceId: req.traceId });
  }

  async lista(req, res) {
    const resultado = await this.query.lista(req.query.buscar, {
      limit: Math.min(Number(req.query.limit) || 20, 100),
      offset: Math.max(Number(req.query.offset) || 0, 0)
    });
    return res.status(200).json({ ...resultado, traceId: req.traceId });
  }

  async buscarPorId(req, res) {
    const resultado = await this.query.buscarPorId(Number(req.params.id));
    return res.status(resultado.estado === 'ok' ? 200 : 404).json({ ...resultado, traceId: req.traceId });
  }

  async editar(req, res) {
    const resultado = await this.command.editar(new UsuarioDTO({ ...req.body, id: req.params.id }));
    return res.status(resultado.estado === 'ok' ? 200 : 400).json({ ...resultado, traceId: req.traceId });
  }

  async eliminar(req, res) {
    const resultado = await this.command.eliminar(new UsuarioDTO({ id: req.params.id }));
    return res.status(resultado.estado === 'ok' ? 200 : 404).json({ ...resultado, traceId: req.traceId });
  }

  async cambiarPassword(req, res) {
    const resultado = await this.command.cambiarPassword(new UsuarioDTO({ id: req.params.id, password: req.body.nuevaPassword }));
    return res.status(resultado.estado === 'ok' ? 200 : 400).json({ ...resultado, traceId: req.traceId });
  }
}
