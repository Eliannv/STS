import { ClienteDTO } from '../../aplicacion/dto/ClienteDTO.js';
import ClienteEntradaPuerto from '../../aplicacion/puertos/entrada/ClienteEntradaPuerto.js';

export class ClienteControlador extends ClienteEntradaPuerto {
  constructor(casoUsoCommand, casoUsoQuery) {
    super();
    this.casoUsoCommandCliente = casoUsoCommand;
    this.casoUsoQueryCliente = casoUsoQuery;
  }

  async crear(req, res) {
    const resultado = await this.casoUsoCommandCliente.crear(new ClienteDTO(req.body));
    return res.status(resultado.estado === 'ok' ? 201 : 400).json({ ...resultado, traceId: req.traceId });
  }

  async lista(req, res) {
    const pag = {
      limit: Math.min(Number(req.query.limit) || 20, 100),
      offset: Math.max(Number(req.query.offset) || 0, 0),
      estado: req.query.estado || 'activos',
    };
    const resultado = await this.casoUsoQueryCliente.lista(req.query.buscar, pag);
    return res.status(200).json({ ...resultado, traceId: req.traceId });
  }

  async buscarPorId(req, res) {
    const resultado = await this.casoUsoQueryCliente.buscarPorId(Number(req.params.id));
    return res.status(resultado.estado === 'ok' ? 200 : 404).json({ ...resultado, traceId: req.traceId });
  }

  async editar(req, res) {
    const resultado = await this.casoUsoCommandCliente.editar(new ClienteDTO({ ...req.body, id: req.params.id ?? req.body.id }));
    return res.status(resultado.estado === 'ok' ? 200 : 400).json({ ...resultado, traceId: req.traceId });
  }

  async eliminar(req, res) {
    const resultado = await this.casoUsoCommandCliente.eliminar(new ClienteDTO({ id: req.params.id ?? req.body.id }));
    return res.status(resultado.estado === 'ok' ? 200 : 404).json({ ...resultado, traceId: req.traceId });
  }
}
