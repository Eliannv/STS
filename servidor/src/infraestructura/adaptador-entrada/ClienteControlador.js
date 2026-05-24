// src/infraestructura/adaptador-entrada/ClienteControlador.js
import { ClienteDTO } from '../../aplicacion/dto/ClienteDTO.js';
import ClienteEntradaPuerto from '../../aplicacion/puertos/entrada/ClienteEntradaPuerto.js';

export class ClienteControlador extends ClienteEntradaPuerto {
  constructor(casoUsoCommand, casoUsoQuery) {
    super();
    this.casoUsoCommandCliente = casoUsoCommand;
    this.casoUsoQueryCliente   = casoUsoQuery;
  }

  crear = async (req, res) => {
    const traceId = req.traceId;
    const dto     = new ClienteDTO(req.body);
    const resultado = await this.casoUsoCommandCliente.crear(dto);
    if (resultado.estado === 'error') {
      return res.status(400).json({ estado: 'error', traceId, mensaje: resultado.resultado });
    }
    return res.status(201).json({ estado: 'ok', traceId, resultado: resultado.resultado });
  }

  lista = async (req, res) => {
    const traceId = req.traceId;
    const buscar  = req.query.buscar || null;
    const resultado = await this.casoUsoQueryCliente.lista(buscar);
    return res.status(200).json({ estado: 'ok', traceId, resultado: resultado.resultado });
  }

  buscarPorId = async (req, res) => {
    const traceId = req.traceId;
    const id      = parseInt(req.params.id);
    const resultado = await this.casoUsoQueryCliente.buscarPorId(id);
    if (resultado.estado === 'error' || !resultado.resultado) {
      return res.status(404).json({ estado: 'error', traceId, mensaje: 'Cliente no encontrado' });
    }
    return res.status(200).json({ estado: 'ok', traceId, resultado: resultado.resultado });
  }

  editar = async (req, res) => {
    const traceId = req.traceId;
    const dto     = new ClienteDTO(req.body);
    const resultado = await this.casoUsoCommandCliente.editar(dto);
    if (resultado.estado === 'error') {
      return res.status(400).json({ estado: 'error', traceId, mensaje: resultado.resultado });
    }
    return res.status(200).json({ estado: 'ok', traceId, resultado: resultado.resultado });
  }

  eliminar = async (req, res) => {
    const traceId = req.traceId;
    const dto     = new ClienteDTO(req.body);
    const resultado = await this.casoUsoCommandCliente.eliminar(dto);
    if (resultado.estado === 'error') {
      return res.status(400).json({ estado: 'error', traceId, mensaje: resultado.resultado });
    }
    return res.status(200).json({ estado: 'ok', traceId, resultado: resultado.resultado });
  }
}
