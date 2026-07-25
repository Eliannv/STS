// caja-servicio/src/infraestructura/adaptador-entrada/CuentaControlador.js
import CuentaEntradaPuerto from '../../aplicacion/puertos/entrada/CuentaEntradaPuerto.js';

export default class CuentaControlador extends CuentaEntradaPuerto {
  constructor(commandUC, queryUC) { super(); this.commandUC = commandUC; this.queryUC = queryUC; }
  async lista(req, res) { const r = await this.queryUC.lista({ ...req.query, sucursalId: req.sucursalScope?.filtroLectura ?? null }); return res.status(200).json({ ...r, traceId: req.traceId }); }
  async buscarPorId(req, res) { const r = await this.queryUC.buscarPorId(Number(req.params.id)); return res.status(r.estado === 'ok' ? 200 : 404).json({ ...r, traceId: req.traceId }); }
  async crear(req, res) { const r = await this.commandUC.crear({ ...req.body, usuarioId: req.usuario?.id }); return res.status(r.estado === 'ok' ? 201 : 400).json({ ...r, traceId: req.traceId }); }
  async editar(req, res) { const r = await this.commandUC.actualizar(Number(req.params.id), { ...req.body, usuarioId: req.usuario?.id }); return res.status(r.estado === 'ok' ? 200 : 400).json({ ...r, traceId: req.traceId }); }
  async cancelar(req, res) { const r = await this.commandUC.cancelar(Number(req.params.id)); return res.status(r.estado === 'ok' ? 200 : 400).json({ ...r, traceId: req.traceId }); }
  async movimientos(req, res) {
    const r = await this.queryUC.movimientos(Number(req.params.id));
    return res.status(r.estado === 'ok' ? 200 : 404).json({
      ...r,
      traceId: req.traceId,
    });
  }
}
