import MovimientoStockEntradaPuerto from '../../aplicacion/puertos/entrada/MovimientoStockEntradaPuerto.js';
import MovimientoStockDTO from '../../aplicacion/dto/MovimientoStockDTO.js';

const contextoUsuario = (req) => ({
  usuarioId: req.usuario?.id ?? req.body?.usuarioId ?? null,
  usuarioNombre: req.usuario ? `${req.usuario.nombre || ''} ${req.usuario.apellido || ''}`.trim() : req.body?.usuarioNombre ?? null,
  sucursalId: req.usuario?.sucursalId ?? req.body?.sucursalId ?? null,
  traceId: req.traceId,
});

export default class MovimientoStockControlador extends MovimientoStockEntradaPuerto {
  constructor(commandUC, queryUC) {
    super();
    this.commandUC = commandUC;
    this.queryUC = queryUC;
  }

  async aplicar(req, res) {
    const respuesta = await this.commandUC.aplicar(new MovimientoStockDTO({ ...req.body, ...contextoUsuario(req) }));
    return res.status(respuesta.estado === 'ok' ? 201 : 400).json({ ...respuesta, traceId: req.traceId });
  }

  async revertirMovimiento(req, res) {
    const respuesta = await this.commandUC.revertirMovimiento(new MovimientoStockDTO({ ...req.body, ...contextoUsuario(req), movimientoId: req.params.id }));
    return res.status(respuesta.estado === 'ok' ? 201 : 400).json({ ...respuesta, traceId: req.traceId });
  }

  async revertirReferencia(req, res) {
    const respuesta = await this.commandUC.revertirReferencia(new MovimientoStockDTO({ ...req.body, ...contextoUsuario(req) }));
    return res.status(respuesta.estado === 'ok' ? 201 : 400).json({ ...respuesta, traceId: req.traceId });
  }

  async listar(req, res) {
    const respuesta = await this.queryUC.listar(req.query);
    return res.status(200).json({ ...respuesta, traceId: req.traceId });
  }

  async buscar(req, res) {
    const respuesta = await this.queryUC.buscarPorId(Number(req.params.id));
    return res.status(respuesta.estado === 'ok' ? 200 : 404).json({ ...respuesta, traceId: req.traceId });
  }
}
