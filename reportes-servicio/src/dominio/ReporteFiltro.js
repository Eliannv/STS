// reportes-servicio/src/dominio/ReporteFiltro.js
import FechaUtil from '../infraestructura/util/FechaUtil.js';

const enteroNoNegativo = (valor, predeterminado) => {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 0 ? numero : predeterminado;
};

const identificador = (valor) => {
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : valor;
};

const CLAVES_COMUNES = new Set([
  'fechaDesde',
  'fecha_desde',
  'fechaHasta',
  'fecha_hasta',
  'page',
  'limit',
  'usuarioId',
  'usuario_id',
  'sucursalId',
  'sucursal_id',
]);

export default class ReporteFiltro {
  constructor(datos = {}) {
    const fechaDesde = datos.fechaDesde ?? datos.fecha_desde ?? null;
    const fechaHasta = datos.fechaHasta ?? datos.fecha_hasta ?? null;

    this.fechaDesde = fechaDesde
      ? FechaUtil.normalizarInicio(fechaDesde)
      : null;
    this.fechaHasta = fechaHasta
      ? FechaUtil.normalizarFin(fechaHasta)
      : null;
    this.page = enteroNoNegativo(datos.page, 0);
    this.limit = enteroNoNegativo(datos.limit, 50) || 50;
    this.usuarioId = identificador(
      datos.usuarioId ?? datos.usuario_id,
    );
    this.sucursalId = identificador(
      datos.sucursalId ?? datos.sucursal_id,
    );
    this.extras = Object.freeze(
      Object.entries(datos).reduce((resultado, [clave, valor]) => {
        if (!CLAVES_COMUNES.has(clave) && valor !== undefined) {
          resultado[clave] = valor;
        }
        return resultado;
      }, {}),
    );

    Object.freeze(this);
  }

  getFechaDesde() {
    return this.fechaDesde;
  }

  getFechaHasta() {
    return this.fechaHasta;
  }

  getPage() {
    return this.page;
  }

  getLimit() {
    return this.limit;
  }

  getUsuarioId() {
    return this.usuarioId;
  }

  getSucursalId() {
    return this.sucursalId;
  }

  getExtras() {
    return this.extras;
  }

  toObject() {
    return {
      fechaDesde: this.fechaDesde,
      fechaHasta: this.fechaHasta,
      page: this.page,
      limit: this.limit,
      usuarioId: this.usuarioId,
      sucursalId: this.sucursalId,
      ...this.extras,
    };
  }
}
