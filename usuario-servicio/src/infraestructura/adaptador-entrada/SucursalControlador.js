import { SucursalDTO } from '../../aplicacion/dto/SucursalDTO.js';
import SucursalEntradaPuerto from '../../aplicacion/puertos/entrada/SucursalEntradaPuerto.js';

export default class SucursalControlador extends SucursalEntradaPuerto {
  constructor(usesCases) { super(); this.usesCases = usesCases; }
  async crear(req, res) { const r = await this.usesCases.crear(new SucursalDTO({ ...req.body, creadoPorId: req.usuario?.id })); return res.status(r.estado === 'ok' ? 201 : 400).json({ ...r, traceId: req.traceId }); }
  async lista(req, res) { const r = await this.usesCases.lista(); return res.json({ ...r, traceId: req.traceId }); }
  async buscarPorId(req, res) { const r = await this.usesCases.buscarPorId(Number(req.params.id)); return res.status(r.estado === 'ok' ? 200 : 404).json({ ...r, traceId: req.traceId }); }
  async editar(req, res) { const r = await this.usesCases.editar(new SucursalDTO({ ...req.body, id: req.params.id })); return res.status(r.estado === 'ok' ? 200 : 400).json({ ...r, traceId: req.traceId }); }
  async eliminar(req, res) { const r = await this.usesCases.eliminar(Number(req.params.id)); return res.status(r.estado === 'ok' ? 200 : 404).json({ ...r, traceId: req.traceId }); }
}
