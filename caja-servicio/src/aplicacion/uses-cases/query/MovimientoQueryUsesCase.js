// caja-servicio/src/aplicacion/uses-cases/query/MovimientoQueryUsesCase.js
import MovimientoFinancieroDTO from '../../dto/MovimientoFinancieroDTO.js';
import MovimientoFiltro from '../../../dominio/filtros/MovimientoFiltro.js';

const extraerResultado = (respuesta) => {
  if (respuesta?.estado === 'error') {
    throw new Error(String(respuesta.resultado));
  }

  return respuesta && Object.prototype.hasOwnProperty.call(respuesta, 'resultado')
    ? respuesta.resultado
    : respuesta;
};

export default class MovimientoQueryUsesCase {
  constructor(
    movimientoBancoQueryPuerto,
    movimientoChicaQueryPuerto = movimientoBancoQueryPuerto,
  ) {
    this.movimientoBancoQueryPuerto = movimientoBancoQueryPuerto;
    this.movimientoChicaQueryPuerto = movimientoChicaQueryPuerto;
  }

  async listarPorCaja(cajaId, filtro = {}) {
    if (!cajaId) {
      throw new Error('cajaId es requerido');
    }

    const movimientoFiltro = filtro instanceof MovimientoFiltro
      ? filtro
      : new MovimientoFiltro(filtro);
    const puerto = this.obtenerPuerto(movimientoFiltro.getCajaTipo());
    const resultado = extraerResultado(
      await puerto.findByCaja(cajaId, movimientoFiltro),
    );

    return this.mapearColeccion(resultado);
  }

  async buscarPorIdempotencyKey(key, cajaTipo = null) {
    if (!key) {
      throw new Error('idempotencyKey es requerido');
    }

    if (cajaTipo) {
      const resultado = extraerResultado(
        await this.obtenerPuerto(cajaTipo).findByIdempotencyKey(key),
      );
      return MovimientoFinancieroDTO.fromEntidad(resultado);
    }

    const movimientoBanco = extraerResultado(
      await this.movimientoBancoQueryPuerto.findByIdempotencyKey(key),
    );
    if (movimientoBanco) {
      return MovimientoFinancieroDTO.fromEntidad(movimientoBanco);
    }

    if (this.movimientoChicaQueryPuerto === this.movimientoBancoQueryPuerto) {
      return null;
    }

    const movimientoChica = extraerResultado(
      await this.movimientoChicaQueryPuerto.findByIdempotencyKey(key),
    );
    return MovimientoFinancieroDTO.fromEntidad(movimientoChica);
  }

  async buscarPorId(id, cajaTipo = 'BANCO') {
    if (!id) {
      throw new Error('id es requerido');
    }

    const resultado = extraerResultado(
      await this.obtenerPuerto(cajaTipo).findById(id),
    );
    return MovimientoFinancieroDTO.fromEntidad(resultado);
  }

  obtenerPuerto(cajaTipo) {
    if (cajaTipo === 'CHICA') {
      return this.movimientoChicaQueryPuerto;
    }

    if (cajaTipo === 'BANCO' || cajaTipo === null || cajaTipo === undefined) {
      return this.movimientoBancoQueryPuerto;
    }

    throw new Error('Tipo de caja inválido');
  }

  mapearColeccion(resultado) {
    if (Array.isArray(resultado)) {
      return resultado.map(MovimientoFinancieroDTO.fromEntidad);
    }

    if (Array.isArray(resultado?.rows)) {
      return {
        ...resultado,
        rows: resultado.rows.map(MovimientoFinancieroDTO.fromEntidad),
      };
    }

    return {
      rows: [],
      count: 0,
    };
  }
}
