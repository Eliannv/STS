import FacturaEntradaPuerto from '../../aplicacion/puertos/entrada/FacturaEntradaPuerto.js';

export default class FacturaControlador extends FacturaEntradaPuerto {
  constructor(commandUC, queryUC) { super(); this.commandUC = commandUC; this.queryUC = queryUC; }
  async crear(req, res) { const r = await this.commandUC.crear({ ...req.body, usuarioId: req.usuario?.id ?? null }); return res.status(r.estado === 'ok' ? 201 : 400).json({ ...r, traceId: req.traceId }); }
  async listaGeneral(req, res) { const r = await this.queryUC.listaGeneral(req.query); return res.status(200).json({ ...r, traceId: req.traceId }); }
  async listaPorCliente(req, res) { const r = await this.queryUC.listaPorCliente(Number(req.params.clienteId)); return res.status(200).json({ ...r, traceId: req.traceId }); }
  async resumenPorCliente(req, res) { const r = await this.queryUC.resumenPorCliente(Number(req.params.clienteId)); return res.status(200).json({ ...r, traceId: req.traceId }); }
  async buscarPorId(req, res) { const r = await this.queryUC.buscarPorId(Number(req.params.id)); return res.status(r.estado === 'ok' ? 200 : 404).json({ ...r, traceId: req.traceId }); }
  async editar(req, res) { const r = await this.commandUC.editar({ ...req.body, id: req.params.id ?? req.body.id, usuarioId: req.usuario?.id ?? null }); return res.status(r.estado === 'ok' ? 200 : 400).json({ ...r, traceId: req.traceId }); }
  async cobrar(req, res) { const r = await this.commandUC.cobrar(Number(req.params.id)); return res.status(r.estado === 'ok' ? 200 : 400).json({ ...r, traceId: req.traceId }); }
  async anular(req, res) { const r = await this.commandUC.anular(Number(req.params.id)); return res.status(r.estado === 'ok' ? 200 : 400).json({ ...r, traceId: req.traceId }); }
  async eliminar(req, res) { const r = await this.commandUC.eliminar(Number(req.params.id ?? req.body.id)); return res.status(r.estado === 'ok' ? 200 : 400).json({ ...r, traceId: req.traceId }); }
}
