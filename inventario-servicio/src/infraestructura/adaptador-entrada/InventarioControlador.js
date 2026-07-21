export default class InventarioControlador {
  constructor(usesCases) { this.usesCases = usesCases; }
  async lista(req, res) { const r = await this.usesCases.listar(req.params.recurso, req.query); res.status(r.estado === 'ok' ? 200 : 400).json({ ...r, traceId: req.traceId }); }
  async buscar(req, res) { const r = await this.usesCases.obtener(req.params.recurso, Number(req.params.id)); res.status(r.estado === 'ok' ? 200 : 404).json({ ...r, traceId: req.traceId }); }
  contexto(req) { return { usuarioId: req.usuario?.id, usuarioNombre: req.usuario ? `${req.usuario.nombre || ''} ${req.usuario.apellido || ''}`.trim() : null, sucursalId: req.usuario?.sucursalId, traceId: req.traceId }; }
  async crear(req, res) { const r = await this.usesCases.crear(req.params.recurso, { ...req.body, ...this.contexto(req) }); res.status(r.estado === 'ok' ? 201 : 400).json({ ...r, traceId: req.traceId }); }
  async editar(req, res) { const r = await this.usesCases.actualizar(req.params.recurso, Number(req.params.id), { ...req.body, ...this.contexto(req) }); res.status(r.estado === 'ok' ? 200 : 400).json({ ...r, traceId: req.traceId }); }
  async eliminar(req, res) { const r = await this.usesCases.eliminar(req.params.recurso, Number(req.params.id), this.contexto(req)); res.status(r.estado === 'ok' ? 200 : 404).json({ ...r, traceId: req.traceId }); }
}
