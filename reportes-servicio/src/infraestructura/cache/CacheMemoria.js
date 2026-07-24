// reportes-servicio/src/infraestructura/cache/CacheMemoria.js
let instancia = null;

export default class CacheMemoria {
  constructor() {
    if (instancia) return instancia;

    this.entradas = new Map();
    this.temporizador = setInterval(
      () => this._limpiarExpirados(),
      60_000,
    );
    this.temporizador.unref?.();
    instancia = this;
  }

  get(clave) {
    const entrada = this.entradas.get(clave);
    if (!entrada) return null;

    if (entrada.expiraEn <= Date.now()) {
      this.entradas.delete(clave);
      return null;
    }

    return entrada.valor;
  }

  set(clave, valor, ttlSegundos) {
    if (
      valor === null
      || valor === undefined
      || valor?.success === false
    ) {
      return false;
    }

    const ttl = Number(ttlSegundos);
    if (!clave || !Number.isFinite(ttl) || ttl <= 0) {
      return false;
    }

    this.entradas.set(clave, {
      valor,
      expiraEn: Date.now() + ttl * 1000,
    });
    return true;
  }

  delete(clave) {
    return this.entradas.delete(clave);
  }

  clear(prefijo) {
    if (prefijo === null || prefijo === undefined || prefijo === '') {
      this.entradas.clear();
      return;
    }

    for (const clave of this.entradas.keys()) {
      if (clave.startsWith(prefijo)) {
        this.entradas.delete(clave);
      }
    }
  }

  _limpiarExpirados() {
    const ahora = Date.now();
    for (const [clave, entrada] of this.entradas.entries()) {
      if (entrada.expiraEn <= ahora) {
        this.entradas.delete(clave);
      }
    }
  }
}
