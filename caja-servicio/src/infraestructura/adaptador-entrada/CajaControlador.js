export default class CajaControlador {
  constructor(usesCases) { this.usesCases = usesCases; }
  async lista(req, res) { const r = await this.usesCases.listar(req.params.recurso, req.query); res.status(r.estado === 'ok' ? 200 : 400).json({ ...r, traceId: req.traceId }); }
  async buscar(req, res) { const r = await this.usesCases.obtener(req.params.recurso, Number(req.params.id)); res.status(r.estado === 'ok' ? 200 : 404).json({ ...r, traceId: req.traceId }); }
  async crear(req, res) { const r = await this.usesCases.crear(req.params.recurso, req.body); res.status(r.estado === 'ok' ? 201 : 400).json({ ...r, traceId: req.traceId }); }
  async editar(req, res) { const r = await this.usesCases.actualizar(req.params.recurso, Number(req.params.id), req.body); res.status(r.estado === 'ok' ? 200 : 400).json({ ...r, traceId: req.traceId }); }
  async eliminar(req, res) { const r = await this.usesCases.eliminar(req.params.recurso, Number(req.params.id)); res.status(r.estado === 'ok' ? 200 : 404).json({ ...r, traceId: req.traceId }); }
  async abrir(req, res) { const r = await this.usesCases.abrir(req.params.tipo, req.body); res.status(r.estado === 'ok' ? 201 : 400).json({ ...r, traceId: req.traceId }); }
  async cerrar(req, res) { const r = await this.usesCases.cerrar(req.params.tipo, Number(req.params.id), req.body); res.status(r.estado === 'ok' ? 200 : 400).json({ ...r, traceId: req.traceId }); }
  async movimiento(req, res) { const r = await this.usesCases.movimiento(req.params.tipo, req.body); res.status(r.estado === 'ok' ? 201 : 400).json({ ...r, traceId: req.traceId }); }
}
