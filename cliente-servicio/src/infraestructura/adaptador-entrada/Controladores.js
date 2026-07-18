import { ClienteDTO } from '../../aplicacion/dto/ClienteDTO.js';
import { HistorialClinicoDTO } from '../../aplicacion/dto/HistorialClinicoDTO.js';

export class ClienteControlador {
  constructor(usesCases) { this.usesCases = usesCases; }
  async crear(req, res) { const r = await this.usesCases.crear(new ClienteDTO(req.body)); return res.status(r.estado === 'ok' ? 201 : 400).json({ ...r, traceId: req.traceId }); }
  async lista(req, res) { const r = await this.usesCases.lista(req.query.buscar, { limit: Math.min(Number(req.query.limit) || 20, 100), offset: Math.max(Number(req.query.offset) || 0, 0) }); return res.json({ ...r, traceId: req.traceId }); }
  async buscarPorId(req, res) { const r = await this.usesCases.buscarPorId(Number(req.params.id)); return res.status(r.estado === 'ok' ? 200 : 404).json({ ...r, traceId: req.traceId }); }
  async editar(req, res) { const r = await this.usesCases.editar(new ClienteDTO({ ...req.body, id: req.params.id })); return res.status(r.estado === 'ok' ? 200 : 400).json({ ...r, traceId: req.traceId }); }
  async eliminar(req, res) { const r = await this.usesCases.eliminar(Number(req.params.id)); return res.status(r.estado === 'ok' ? 200 : 404).json({ ...r, traceId: req.traceId }); }
}

export class HistorialControlador {
  constructor(usesCases) { this.usesCases = usesCases; }
  async crear(req, res) { const r = await this.usesCases.crear(new HistorialClinicoDTO(req.body)); return res.status(r.estado === 'ok' ? 201 : 400).json({ ...r, traceId: req.traceId }); }
  async listaPorCliente(req, res) { const r = await this.usesCases.listaPorCliente(Number(req.params.clienteId)); return res.json({ ...r, traceId: req.traceId }); }
  async buscarPorId(req, res) { const r = await this.usesCases.buscarPorId(Number(req.params.id)); return res.status(r.estado === 'ok' ? 200 : 404).json({ ...r, traceId: req.traceId }); }
  async editar(req, res) { const r = await this.usesCases.editar(new HistorialClinicoDTO({ ...req.body, id: req.params.id })); return res.status(r.estado === 'ok' ? 200 : 400).json({ ...r, traceId: req.traceId }); }
  async eliminar(req, res) { const r = await this.usesCases.eliminar(Number(req.params.id)); return res.status(r.estado === 'ok' ? 200 : 404).json({ ...r, traceId: req.traceId }); }
}
