// inventario-servicio/src/aplicacion/uses-cases/query/EgresoQueryUsesCase.js
import DetalleEgresoDTO from '../../dto/DetalleEgresoDTO.js';
import EgresoMercaderiaDTO from '../../dto/EgresoMercaderiaDTO.js';

export default class EgresoQueryUsesCase {
  constructor(egresoQuery) {
    this.egresoQuery = egresoQuery;
  }

  async obtenerEgresos(filtro) {
    const resultado = await this.egresoQuery.findAll(filtro);
    return {
      rows: resultado.rows.map((egreso) =>
        EgresoMercaderiaDTO.fromEntidad(egreso)),
      pagination: {
        page: filtro.getPage(),
        pageSize: filtro.getLimit(),
        totalRows: resultado.count,
        totalPages: Math.ceil(resultado.count / filtro.getLimit()),
      },
    };
  }

  async obtenerEgresoPorId(id) {
    const egreso = await this.egresoQuery.findById(id);
    if (!egreso) throw new Error('Egreso no encontrado');
    const detalles = await this.egresoQuery.findDetallesByEgresoId(id);
    return EgresoMercaderiaDTO.fromEntidad(
      egreso,
      detalles.map(DetalleEgresoDTO.fromEntidad),
    );
  }

  async obtenerMovimientosDeEgreso(egresoId) {
    return this.egresoQuery.findMovimientosByEgresoId(egresoId);
  }
}
