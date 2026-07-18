import ProveedorEntradaPuerto from '../../aplicacion/puertos/entrada/ProveedorEntradaPuerto.js';
import { ProveedorDTO } from '../../aplicacion/dto/ProveedorDTO.js';

export default class ProveedorControlador extends ProveedorEntradaPuerto {
  constructor(proveedorCommandUsesCase, proveedorQueryUsesCase) {
    super();
    this.commandUC = proveedorCommandUsesCase;
    this.queryUC = proveedorQueryUsesCase;
  }

  async crear(req, res) {
    const respuesta = await this.commandUC.crear(new ProveedorDTO(req.body));
    return res.status(respuesta.estado === 'ok' ? 201 : 400).json({ ...respuesta, traceId: req.traceId });
  }

  async lista(req, res) {
    const respuesta = await this.queryUC.lista(new ProveedorDTO({ buscar: req.query.buscar }), { limit: Number(req.query.limit) || 20, offset: Number(req.query.offset) || 0 });
    return res.status(200).json({ ...respuesta, traceId: req.traceId });
  }

  async buscarPorId(req, res) {
    const respuesta = await this.queryUC.buscarPorId(Number(req.params.id));
    return res.status(respuesta.estado === 'ok' ? 200 : 404).json({ ...respuesta, traceId: req.traceId });
  }

  async editar(req, res) {
    const respuesta = await this.commandUC.editar(new ProveedorDTO({ ...req.body, id: req.params.id ?? req.body.id }));
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({ ...respuesta, traceId: req.traceId });
  }

  async eliminar(req, res) {
    const respuesta = await this.commandUC.eliminar(new ProveedorDTO({ id: req.params.id ?? req.body.id }));
    return res.status(respuesta.estado === 'ok' ? 200 : 404).json({ ...respuesta, traceId: req.traceId });
  }
}
