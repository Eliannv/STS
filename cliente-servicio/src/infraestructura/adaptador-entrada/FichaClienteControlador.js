// cliente-servicio/src/infraestructura/adaptador-entrada/FichaClienteControlador.js
//
// El controlador solo traduce HTTP → caso de uso: arma el contexto de la petición
// (token, sucursal, trazabilidad) y devuelve la respuesta. Toda la agregación y el
// cálculo viven en el caso de uso y en la entidad de dominio.
export default class FichaClienteControlador {
  constructor(fichaQueryUC) {
    this.fichaQueryUC = fichaQueryUC;
  }

  async ficha(req, res) {
    const contexto = {
      authorization: req.headers.authorization,
      traceId: req.traceId,
      // Se reenvía la sucursal en curso para que cada servicio aplique su scope.
      sucursalId: req.sucursalScope?.filtroLectura ?? null,
      scope: req.sucursalScope ?? {},
    };
    const resultado = await this.fichaQueryUC.obtener(Number(req.params.id), contexto);
    return res.status(resultado.estado === 'ok' ? 200 : 404).json({ ...resultado, traceId: req.traceId });
  }
}
