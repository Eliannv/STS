// src/infraestructura/adaptador-entrada/EmpleadoMetricasControlador.js
export default class EmpleadoMetricasControlador {
    constructor(queryUC) {
        this.queryUC = queryUC;
    }

    /**
     * GET /api/empleado-metricas/resumen?mes=7&anio=2026
     * Devuelve métricas de todos los empleados + rankings para el período.
     */
    resumen = async(req, res) => {
        const { mes, anio } = req.query;
        const ahora = new Date();
        const m = mes ? parseInt(mes) : ahora.getMonth() + 1;
        const a = anio ? parseInt(anio) : ahora.getFullYear();

        const respuesta = await this.queryUC.resumenPorPeriodo(m, a);
        return res.status(respuesta.estado === 'ok' ? 200 : 400).json({
            ...respuesta,
            traceId: req.traceId,
        });
    };

    /**
     * GET /api/empleado-metricas/detalle/:usuarioId?mes=7&anio=2026
     * Devuelve métricas detalladas de un empleado para el período.
     */
    detalle = async(req, res) => {
        const { usuarioId } = req.params;
        const { mes, anio } = req.query;
        const ahora = new Date();
        const m = mes ? parseInt(mes) : ahora.getMonth() + 1;
        const a = anio ? parseInt(anio) : ahora.getFullYear();

        const respuesta = await this.queryUC.detallePorEmpleado(usuarioId, m, a);
        return res.status(respuesta.estado === 'ok' ? 200 : 400).json({
            ...respuesta,
            traceId: req.traceId,
        });
    };

    /**
     * GET /api/empleado-metricas/historial/:usuarioId?meses=6
     * Devuelve el historial mensual (últimos N meses) de un empleado.
     */
    historial = async(req, res) => {
        const { usuarioId } = req.params;
        const numMeses = parseInt(req.query.meses ? req.query.meses : 6);

        const respuesta = await this.queryUC.historialMensual(usuarioId, numMeses);
        return res.status(respuesta.estado === 'ok' ? 200 : 400).json({
            ...respuesta,
            traceId: req.traceId,
        });
    };
}