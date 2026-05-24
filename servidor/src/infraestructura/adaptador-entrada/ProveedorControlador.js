// src/infraestructura/adaptador-entrada/ProveedorControlador.js
import ProveedorEntradaPuerto from '../../aplicacion/puertos/entrada/ProveedorEntradaPuerto.js';
import { ProveedorDTO } from '../../aplicacion/dto/ProveedorDTO.js';

export default class ProveedorControlador extends ProveedorEntradaPuerto {
  constructor(proveedorCommandUsesCase, proveedorQueryUsesCase) {
    super();
    this.commandUC = proveedorCommandUsesCase;
    this.queryUC   = proveedorQueryUsesCase;
  }

  async crear(req, res) {
    const dto = new ProveedorDTO({ ...req.body });
    const respuesta = await this.commandUC.crear(dto);
    return res.status(respuesta.estado === 'ok' ? 201 : 400).json({
      ...respuesta, traceId: req.traceId
    });
  }

  async lista(req, res) {
    const dto = new ProveedorDTO({ buscar: req.query.buscar });
    const respuesta = await this.queryUC.lista(dto);
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
    const dto = new ProveedorDTO({ ...req.body });
    const respuesta = await this.commandUC.editar(dto);
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({
      ...respuesta, traceId: req.traceId
    });
  }

  async eliminar(req, res) {
    const dto = new ProveedorDTO({ id: req.body.id });
    const respuesta = await this.commandUC.eliminar(dto);
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({
      ...respuesta, traceId: req.traceId
    });
  }
}
