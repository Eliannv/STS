import CajaBancoEntradaPuerto from '../../aplicacion/puertos/entrada/CajaBancoEntradaPuerto.js';

export default class CajaBancoControlador extends CajaBancoEntradaPuerto {
  constructor(commandUC, queryUC) { super(); this.commandUC = commandUC; this.queryUC = queryUC; }
  async abrir(req, res) { const r = await this.commandUC.abrir({ ...req.body, usuarioId: req.usuario?.id, usuarioNombre: req.usuario?.nombre }); return res.status(r.estado === 'ok' ? 201 : 400).json({ ...r, traceId: req.traceId }); }
  async cerrar(req, res) { const r = await this.commandUC.cerrar({ ...req.body, id: req.params.id ?? req.body.id, usuarioId: req.usuario?.id, usuarioNombre: req.usuario?.nombre }); return res.status(r.estado === 'ok' ? 200 : 400).json({ ...r, traceId: req.traceId }); }
  async lista(req, res) { const r = await this.queryUC.lista(req.query); return res.status(200).json({ ...r, traceId: req.traceId }); }
  async buscarPorId(req, res) { const r = await this.queryUC.buscarPorId(Number(req.params.id)); return res.status(r.estado === 'ok' ? 200 : 404).json({ ...r, traceId: req.traceId }); }
  async movimiento(req, res) { const r = await this.commandUC.registrarMovimiento({ ...req.body, cajaBancoId: Number(req.params.id ?? req.body.cajaBancoId), usuarioId: req.usuario?.id, usuarioNombre: req.usuario?.nombre }); return res.status(r.estado === 'ok' ? 201 : 400).json({ ...r, traceId: req.traceId }); }
  async listarMovimientos(req, res) { const r = await this.queryUC.listarMovimientos(Number(req.params.id)); return res.status(200).json({ ...r, traceId: req.traceId }); }
  async eliminarMovimiento(req, res) { const r = await this.commandUC.eliminarMovimiento(Number(req.params.id)); return res.status(r.estado === 'ok' ? 200 : 400).json({ ...r, traceId: req.traceId }); }
}
