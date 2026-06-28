// src/aplicacion/uses-cases/query/UsuarioQueryUsesCase.js
export default class UsuarioQueryUsesCase {
    constructor(adaptadorBDSalidaQuery) {
        this.adaptadorBDSalida = adaptadorBDSalidaQuery;
    }

    async lista(buscar, pag = {}) {
        return await this.adaptadorBDSalida.lista(buscar, pag);
    }

    async buscarPorId(id) {
        if (!id) {
            return { estado: 'error', resultado: null };
        }
        return await this.adaptadorBDSalida.buscarPorId(id);
    }
}