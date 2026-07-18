import CobroDeudaEntradaPuerto from '../../aplicacion/puertos/entrada/CobroDeudaEntradaPuerto.js';

export default class CobroDeudaControlador extends CobroDeudaEntradaPuerto {
  constructor(commandUC, queryUC) { super(); this.commandUC = commandUC; this.queryUC = queryUC; }
  async registrarAbono(req, res) { const r = await this.commandUC.registrarAbono({ ...req.body, usuarioId: req.usuario?.id ?? null }); return res.status(r.estado === 'ok' ? 201 : 400).json({ ...r, traceId: req.traceId }); }
  async facturasPendientes(req, res) { const r = await this.queryUC.facturasPendientes(Number(req.query.clienteId) || null, req.query); return res.status(200).json({ ...r, traceId: req.traceId }); }
  async abonosPorFactura(req, res) { const r = await this.queryUC.abonosPorFactura(Number(req.params.facturaId)); return res.status(200).json({ ...r, traceId: req.traceId }); }
  async obtenerAbono(req, res) { const r = await this.queryUC.abonoPorId(Number(req.params.abonoId)); return res.status(r.estado === 'ok' ? 200 : 404).json({ ...r, traceId: req.traceId }); }
  async resumenDeuda(req, res) { const r = await this.queryUC.resumenClienteDeuda(Number(req.params.clienteId)); return res.status(200).json({ ...r, traceId: req.traceId }); }
  async listaAbonos(req, res) { const r = await this.queryUC.listaAbonos(req.query); return res.status(200).json({ ...r, traceId: req.traceId }); }
  async deudasPaginadas(req, res) { const limite = Number(req.query.limite) || 5; const r = await this.queryUC.deudasPaginadas((Number(req.query.pagina) || 0) * limite, limite); return res.status(200).json({ ...r, traceId: req.traceId }); }
}
