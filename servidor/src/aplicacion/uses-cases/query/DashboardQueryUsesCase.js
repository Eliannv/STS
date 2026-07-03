// src/aplicacion/uses-cases/query/DashboardQueryUsesCase.js
export default class DashboardQueryUsesCase {
    constructor(adaptador) {
        this.adaptador = adaptador;
    }
    async resumen() {
        return this.adaptador.resumen();
    }
}