// src/infraestructura/adaptador-entrada/CajaBancoControlador.js
import CajaBancoEntradaPuerto from '../../aplicacion/puertos/entrada/CajaBancoEntradaPuerto.js';
import { CajaBancoDTO, MovimientoCajaBancoDTO } from '../../aplicacion/dto/CajaBancoDTO.js';

export default class CajaBancoControlador extends CajaBancoEntradaPuerto {
  constructor(commandUC, queryUC) {
    super();
    this.commandUC = commandUC;
    this.queryUC   = queryUC;
  }

  async abrir(req, res) {
    const datos = { ...req.body, usuarioId: req.usuario?.id };
    const respuesta = await this.commandUC.abrir(datos);
    return res.status(respuesta.estado === 'ok' ? 201 : 400).json({ ...respuesta, traceId: req.traceId });
  }

  async cerrar(req, res) {
    const datos = {
      ...req.body,
      usuarioId:        req.usuario?.id,
      cerradoPorId:     req.usuario?.id,
      cerradoPorNombre: req.usuario?.nombre,
    };
    const respuesta = await this.commandUC.cerrar(datos);
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({ ...respuesta, traceId: req.traceId });
  }

  async lista(req, res) {
    const filtros = {
      estado:     req.query.estado,
      fechaDesde: req.query.fechaDesde,
      fechaHasta: req.query.fechaHasta,
    };
    const respuesta = await this.queryUC.lista(filtros);
    return res.status(200).json({ ...respuesta, traceId: req.traceId });
  }

  async buscarPorId(req, res) {
    const respuesta = await this.queryUC.buscarPorId(req.params.id);
    return res.status(respuesta.estado === 'ok' ? 200 : 404).json({ ...respuesta, traceId: req.traceId });
  }

  async cajaAbierta(req, res) {
    const respuesta = await this.queryUC.cajaAbierta();
    return res.status(200).json({ ...respuesta, traceId: req.traceId });
  }

  async registrarMovimiento(req, res) {
    const datos = { ...req.body, usuarioId: req.usuario?.id };
    const respuesta = await this.commandUC.registrarMovimiento(datos);
    return res.status(respuesta.estado === 'ok' ? 201 : 400).json({ ...respuesta, traceId: req.traceId });
  }

  async listarMovimientos(req, res) {
    const respuesta = await this.queryUC.listarMovimientos(req.params.id);
    return res.status(200).json({ ...respuesta, traceId: req.traceId });
  }

  async eliminarMovimiento(req, res) {
    const movimientoId = req.body.movimientoId || req.params.id;
    const respuesta = await this.commandUC.eliminarMovimiento(movimientoId);
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({ ...respuesta, traceId: req.traceId });
  }
}
