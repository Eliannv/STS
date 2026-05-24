// src/infraestructura/adaptador-entrada/UsuarioControlador.js
import { UsuarioDTO } from '../../aplicacion/dto/UsuarioDTO.js';
import UsuarioEntradaPuerto from '../../aplicacion/puertos/entrada/UsuarioEntradaPuerto.js';

export class UsuarioControlador extends UsuarioEntradaPuerto {
  constructor(casoUsoCommand, casoUsoQuery) {
    super();
    this.casoUsoCommandUsuario = casoUsoCommand;
    this.casoUsoQueryUsuario   = casoUsoQuery;
  }

  login = async (req, res) => {
    const traceId = req.traceId;
    const dto     = new UsuarioDTO(req.body);
    const resultado = await this.casoUsoCommandUsuario.login(dto);
    if (resultado.estado === 'error') {
      return res.status(401).json({ estado: 'error', traceId, mensaje: resultado.mensaje });
    }
    return res.status(200).json({ estado: 'ok', traceId, resultado: resultado.resultado });
  }

  crear = async (req, res) => {
    const traceId = req.traceId;
    const dto     = new UsuarioDTO(req.body);
    const resultado = await this.casoUsoCommandUsuario.crear(dto);
    if (resultado.estado === 'error') {
      return res.status(400).json({ estado: 'error', traceId, mensaje: resultado.resultado });
    }
    return res.status(201).json({ estado: 'ok', traceId, resultado: resultado.resultado });
  }

  lista = async (req, res) => {
    const traceId = req.traceId;
    const resultado = await this.casoUsoQueryUsuario.lista();
    return res.status(200).json({ estado: 'ok', traceId, resultado: resultado.resultado });
  }

  buscarPorId = async (req, res) => {
    const traceId = req.traceId;
    const id      = parseInt(req.params.id);
    const resultado = await this.casoUsoQueryUsuario.buscarPorId(id);
    if (resultado.estado === 'error' || !resultado.resultado) {
      return res.status(404).json({ estado: 'error', traceId, mensaje: 'Usuario no encontrado' });
    }
    return res.status(200).json({ estado: 'ok', traceId, resultado: resultado.resultado });
  }

  editar = async (req, res) => {
    const traceId = req.traceId;
    const dto     = new UsuarioDTO(req.body);
    const resultado = await this.casoUsoCommandUsuario.editar(dto);
    if (resultado.estado === 'error') {
      return res.status(400).json({ estado: 'error', traceId, mensaje: resultado.resultado });
    }
    return res.status(200).json({ estado: 'ok', traceId, resultado: resultado.resultado });
  }

  eliminar = async (req, res) => {
    const traceId = req.traceId;
    const dto     = new UsuarioDTO(req.body);
    const resultado = await this.casoUsoCommandUsuario.eliminar(dto);
    if (resultado.estado === 'error') {
      return res.status(400).json({ estado: 'error', traceId, mensaje: resultado.resultado });
    }
    return res.status(200).json({ estado: 'ok', traceId, resultado: resultado.resultado });
  }

  cambiarPassword = async (req, res) => {
    const traceId = req.traceId;
    const dto = new UsuarioDTO({
      id:       req.body.id,
      password: req.body.nuevaPassword
    });
    const resultado = await this.casoUsoCommandUsuario.cambiarPassword(dto);
    if (resultado.estado === 'error') {
      return res.status(400).json({ estado: 'error', traceId, mensaje: resultado.resultado });
    }
    return res.status(200).json({ estado: 'ok', traceId, resultado: resultado.resultado });
  }
}

