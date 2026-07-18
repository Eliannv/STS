import VentaTarjetaEntradaPuerto from '../../aplicacion/puertos/entrada/VentaTarjetaEntradaPuerto.js';

export default class VentaTarjetaControlador extends VentaTarjetaEntradaPuerto {
  constructor(commandUC, queryUC) { super(); this.commandUC = commandUC; this.queryUC = queryUC; }
  async listarVentasTarjeta(req, res) { const r = await this.queryUC.listarVentasTarjeta(req.query); return res.status(r.estado === 'ok' ? 200 : 400).json({ ...r, traceId: req.traceId }); }
  async obtenerVentaTarjeta(req, res) { const r = await this.queryUC.obtenerVentaTarjeta(Number(req.params.id)); return res.status(r.estado === 'ok' ? 200 : 404).json({ ...r, traceId: req.traceId }); }
  async registrarAbono(req, res) { const r = await this.commandUC.registrarAbono({ ...req.body, ventaTarjetaId: Number(req.params.ventaTarjetaId), usuarioId: req.usuario?.id ?? null }); return res.status(r.estado === 'ok' ? 201 : 400).json({ ...r, traceId: req.traceId }); }
  async obtenerHistorialAbonos(req, res) { const r = await this.queryUC.historialAbonos(Number(req.params.ventaTarjetaId)); return res.status(r.estado === 'ok' ? 200 : 400).json({ ...r, traceId: req.traceId }); }
  async resumenVentasTarjeta(req, res) { const r = await this.queryUC.resumenVentasTarjeta(); return res.status(r.estado === 'ok' ? 200 : 400).json({ ...r, traceId: req.traceId }); }
}
