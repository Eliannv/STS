// src/aplicacion/uses-cases/query/EmpleadoMetricasQueryUsesCase.js
export default class EmpleadoMetricasQueryUsesCase {
    constructor(adaptadorBDSalidaQuery) {
        this.adaptador = adaptadorBDSalidaQuery;
    }

    async resumenPorPeriodo(mes, anio) {
        if (!mes || !anio) return { estado: 'error', resultado: 'Mes y año son requeridos' };
        return this.adaptador.resumenPorPeriodo(parseInt(mes), parseInt(anio));
    }

    async detallePorEmpleado(usuarioId, mes, anio) {
        if (!usuarioId) return { estado: 'error', resultado: 'usuarioId es requerido' };
        if (!mes || !anio) return { estado: 'error', resultado: 'Mes y año son requeridos' };
        return this.adaptador.detallePorEmpleado(usuarioId, parseInt(mes), parseInt(anio));
    }

    async historialMensual(usuarioId, numMeses = 6) {
        if (!usuarioId) return { estado: 'error', resultado: 'usuarioId es requerido' };
        return this.adaptador.historialMensual(usuarioId, parseInt(numMeses));
    }
}