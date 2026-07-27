// facturacion-servicio/src/infraestructura/adaptador-entrada/FacturaControlador.js
import FacturaEntradaPuerto from '../../aplicacion/puertos/entrada/FacturaEntradaPuerto.js';

export default class FacturaControlador extends FacturaEntradaPuerto {
  constructor(commandUC, queryUC) { super(); this.commandUC = commandUC; this.queryUC = queryUC; }
  contexto(req) { return { usuarioId: req.usuario?.id ?? null, usuarioNombre: req.usuario ? `${req.usuario.nombre || ''} ${req.usuario.apellido || ''}`.trim() : null, sucursalId: req.sucursalScope?.sucursalId ?? null, sucursalNombre: req.sucursalScope?.sucursalNombre ?? null, authorization: req.headers.authorization, traceId: req.traceId, motivo: req.body?.motivo, cuentaCobrarId: req.body?.cuentaCobrarId ?? req.body?.cuenta_cobrar_id ?? null }; }
  async crear(req, res) { const r = await this.commandUC.crear({ ...req.body, ...this.contexto(req) }); return res.status(r.estado === 'ok' ? 201 : 409).json({ ...r, traceId: req.traceId }); }
  async listaGeneral(req, res) { const r = await this.queryUC.listaGeneral({ ...req.query, sucursalId: req.sucursalScope?.filtroLectura ?? null }); return res.status(200).json({ ...r, traceId: req.traceId }); }
  async listaPorCliente(req, res) { const r = await this.queryUC.listaPorCliente(Number(req.params.clienteId), req.sucursalScope?.filtroLectura ?? null); return res.status(200).json({ ...r, traceId: req.traceId }); }
  // alcance=empresa devuelve el histórico consolidado del cliente. Es un agregado
  // (totales y conteos), nunca detalle operativo de otra sucursal: alimenta la
  // métrica "Total comprado (Empresa)" del encabezado de la ficha.
  async resumenPorCliente(req, res) { const alcanceEmpresa = req.query.alcance === 'empresa'; const r = await this.queryUC.resumenPorCliente(Number(req.params.clienteId), alcanceEmpresa ? null : (req.sucursalScope?.filtroLectura ?? null)); return res.status(200).json({ ...r, alcance: alcanceEmpresa ? 'EMPRESA' : 'SUCURSAL', traceId: req.traceId }); }
  async buscarPorId(req, res) { const r = await this.queryUC.buscarPorId(Number(req.params.id)); return res.status(r.estado === 'ok' ? 200 : 404).json({ ...r, traceId: req.traceId }); }
  async editar(req, res) { const r = await this.commandUC.editar({ ...req.body, id: req.params.id ?? req.body.id, ...this.contexto(req) }); return res.status(r.estado === 'ok' ? 200 : 400).json({ ...r, traceId: req.traceId }); }
  async cobrar(req, res) { const r = await this.commandUC.cobrar(Number(req.params.id)); return res.status(r.estado === 'ok' ? 200 : 400).json({ ...r, traceId: req.traceId }); }
  async anular(req, res) { const r = await this.commandUC.anular(Number(req.params.id), this.contexto(req)); return res.status(r.estado === 'ok' ? 200 : 409).json({ ...r, traceId: req.traceId }); }
  async eliminar(req, res) { const r = await this.commandUC.eliminar(Number(req.params.id ?? req.body.id), this.contexto(req)); return res.status(r.estado === 'ok' ? 200 : 409).json({ ...r, traceId: req.traceId }); }
}
