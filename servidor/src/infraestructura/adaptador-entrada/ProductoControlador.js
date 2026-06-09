// src/infraestructura/adaptador-entrada/ProductoControlador.js
import ProductoEntradaPuerto from '../../aplicacion/puertos/entrada/ProductoEntradaPuerto.js';
import { ProductoDTO } from '../../aplicacion/dto/ProductoDTO.js';

export default class ProductoControlador extends ProductoEntradaPuerto {
  constructor(productoCommandUsesCase, productoQueryUsesCase) {
    super();
    this.commandUC = productoCommandUsesCase;
    this.queryUC   = productoQueryUsesCase;
  }

  async crear(req, res) {
    const dto = new ProductoDTO({ ...req.body });
    const respuesta = await this.commandUC.crear(dto);
    return res.status(respuesta.estado === 'ok' ? 201 : 400).json({
      ...respuesta, traceId: req.traceId
    });
  }

  async lista(req, res) {
    const dto = new ProductoDTO({
      buscar:     req.query.buscar,
      sucursalId: req.query.sucursalId
    });
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
    const dto = new ProductoDTO({ ...req.body });
    const respuesta = await this.commandUC.editar(dto);
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({
      ...respuesta, traceId: req.traceId
    });
  }

  async eliminar(req, res) {
    const dto = new ProductoDTO({ id: req.body.id });
    const respuesta = await this.commandUC.eliminar(dto);
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({
      ...respuesta, traceId: req.traceId
    });
  }

  async buscarPorModeloColorGrupo(req, res) {
    const { modelo, color, grupo } = req.query;
    const respuesta = await this.queryUC.buscarPorModeloColorGrupo(modelo, color, grupo);
    return res.status(respuesta.estado === 'ok' ? 200 : 404).json({
      ...respuesta, traceId: req.traceId
    });
  }
}
