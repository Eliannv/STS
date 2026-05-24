// src/infraestructura/adaptador-entrada/SucursalControlador.js
import { SucursalDTO } from '../../aplicacion/dto/SucursalDTO.js';
import SucursalEntradaPuerto from '../../aplicacion/puertos/entrada/SucursalEntradaPuerto.js';

export class SucursalControlador extends SucursalEntradaPuerto {
  constructor(casoUsoCommand, casoUsoQuery) {
    super();
    this.casoUsoCommandSucursal = casoUsoCommand;
    this.casoUsoQuerySucursal   = casoUsoQuery;
  }

  crear = async (req, res) => {
    const traceId = req.traceId;
    const dto     = new SucursalDTO({ ...req.body, creadoPorId: req.usuario?.id ?? null });
    const resultado = await this.casoUsoCommandSucursal.crear(dto);
    if (resultado.estado === 'error') {
      return res.status(400).json({ estado: 'error', traceId, mensaje: resultado.resultado });
    }
    return res.status(201).json({ estado: 'ok', traceId, resultado: resultado.resultado });
  }

  lista = async (req, res) => {
    const traceId = req.traceId;
    const resultado = await this.casoUsoQuerySucursal.lista();
    return res.status(200).json({ estado: 'ok', traceId, resultado: resultado.resultado });
  }

  buscarPorId = async (req, res) => {
    const traceId = req.traceId;
    const id      = parseInt(req.params.id);
    const resultado = await this.casoUsoQuerySucursal.buscarPorId(id);
    if (resultado.estado === 'error' || !resultado.resultado) {
      return res.status(404).json({ estado: 'error', traceId, mensaje: 'Sucursal no encontrada' });
    }
    return res.status(200).json({ estado: 'ok', traceId, resultado: resultado.resultado });
  }

  editar = async (req, res) => {
    const traceId = req.traceId;
    const dto     = new SucursalDTO(req.body);
    const resultado = await this.casoUsoCommandSucursal.editar(dto);
    if (resultado.estado === 'error') {
      return res.status(400).json({ estado: 'error', traceId, mensaje: resultado.resultado });
    }
    return res.status(200).json({ estado: 'ok', traceId, resultado: resultado.resultado });
  }

  eliminar = async (req, res) => {
    const traceId = req.traceId;
    const dto     = new SucursalDTO(req.body);
    const resultado = await this.casoUsoCommandSucursal.eliminar(dto);
    if (resultado.estado === 'error') {
      return res.status(400).json({ estado: 'error', traceId, mensaje: resultado.resultado });
    }
    return res.status(200).json({ estado: 'ok', traceId, resultado: resultado.resultado });
  }
}
