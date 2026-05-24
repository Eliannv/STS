// src/infraestructura/adaptador-entrada/HistorialClinicoControlador.js
import HistorialClinicoEntradaPuerto from '../../aplicacion/puertos/entrada/HistorialClinicoEntradaPuerto.js';
import { HistorialClinicoDTO } from '../../aplicacion/dto/HistorialClinicoDTO.js';

export default class HistorialClinicoControlador extends HistorialClinicoEntradaPuerto {
  constructor(historialClinicoCommandUsesCase, historialClinicoQueryUsesCase) {
    super();
    this.commandUC = historialClinicoCommandUsesCase;
    this.queryUC   = historialClinicoQueryUsesCase;
  }

  async crear(req, res) {
    const dto = new HistorialClinicoDTO({ ...req.body });
    const respuesta = await this.commandUC.crear(dto);
    return res.status(respuesta.estado === 'ok' ? 201 : 400).json({
      ...respuesta, traceId: req.traceId
    });
  }

  async listaPorCliente(req, res) {
    const { clienteId } = req.params;
    const respuesta = await this.queryUC.listaPorCliente(clienteId);
    return res.status(200).json({ ...respuesta, traceId: req.traceId });
  }

  async buscarPorId(req, res) {
    const { id } = req.params;
    const respuesta = await this.queryUC.buscarPorId(id);
    return res.status(respuesta.estado === 'ok' ? 200 : 404).json({
      ...respuesta, traceId: req.traceId
    });
  }

  async editar(req, res) {
    const dto = new HistorialClinicoDTO({ ...req.body });
    const respuesta = await this.commandUC.editar(dto);
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({
      ...respuesta, traceId: req.traceId
    });
  }

  async eliminar(req, res) {
    const dto = new HistorialClinicoDTO({ id: req.body.id });
    const respuesta = await this.commandUC.eliminar(dto);
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({
      ...respuesta, traceId: req.traceId
    });
  }
}
