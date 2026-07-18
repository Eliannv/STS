import { HistorialClinicoDTO } from '../../aplicacion/dto/HistorialClinicoDTO.js';
import HistorialClinicoEntradaPuerto from '../../aplicacion/puertos/entrada/HistorialClinicoEntradaPuerto.js';

export default class HistorialClinicoControlador extends HistorialClinicoEntradaPuerto {
  constructor(casoUsoCommand, casoUsoQuery) {
    super();
    this.casoUsoCommand = casoUsoCommand;
    this.casoUsoQuery = casoUsoQuery;
  }

  async crear(req, res) {
    const resultado = await this.casoUsoCommand.crear(new HistorialClinicoDTO(req.body));
    return res.status(resultado.estado === 'ok' ? 201 : 400).json({ ...resultado, traceId: req.traceId });
  }

  async listaPorCliente(req, res) {
    const resultado = await this.casoUsoQuery.listaPorCliente(Number(req.params.clienteId));
    return res.status(200).json({ ...resultado, traceId: req.traceId });
  }

  async buscarPorId(req, res) {
    const resultado = await this.casoUsoQuery.buscarPorId(Number(req.params.id));
    return res.status(resultado.estado === 'ok' ? 200 : 404).json({ ...resultado, traceId: req.traceId });
  }

  async editar(req, res) {
    const resultado = await this.casoUsoCommand.editar(new HistorialClinicoDTO({ ...req.body, id: req.params.id ?? req.body.id }));
    return res.status(resultado.estado === 'ok' ? 200 : 400).json({ ...resultado, traceId: req.traceId });
  }

  async eliminar(req, res) {
    const resultado = await this.casoUsoCommand.eliminar(new HistorialClinicoDTO({ id: req.params.id ?? req.body.id }));
    return res.status(resultado.estado === 'ok' ? 200 : 404).json({ ...resultado, traceId: req.traceId });
  }
}
