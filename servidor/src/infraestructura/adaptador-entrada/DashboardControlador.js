// src/infraestructura/adaptador-entrada/DashboardControlador.js
export default class DashboardControlador {
    constructor(queryUC) {
        this.queryUC = queryUC;
    }
    resumen = async(req, res) => {
        const respuesta = await this.queryUC.resumen();
        return res.status(respuesta.estado === 'ok' ? 200 : 500).json({
            ...respuesta,
            traceId: req.traceId,
        });
    };
}