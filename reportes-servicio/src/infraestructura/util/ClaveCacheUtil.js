// reportes-servicio/src/infraestructura/util/ClaveCacheUtil.js
const serializarObjeto = (valor) => {
  if (valor instanceof Date) return valor.toISOString();
  if (Array.isArray(valor)) return valor.map(serializarObjeto);
  if (valor && typeof valor === 'object') {
    return Object.keys(valor)
      .sort()
      .reduce((resultado, clave) => {
        const item = valor[clave];
        if (item !== null && item !== undefined) {
          resultado[clave] = serializarObjeto(item);
        }
        return resultado;
      }, {});
  }
  return valor;
};

const serializarValor = (valor) => {
  const normalizado = serializarObjeto(valor);
  return typeof normalizado === 'object'
    ? JSON.stringify(normalizado)
    : String(normalizado);
};

export default class ClaveCacheUtil {
  static construir(reporte, filtros = {}, page = 0, limit = 50) {
    if (!reporte) throw new Error('El nombre del reporte es requerido');

    const segmentos = [String(reporte)];
    Object.keys(filtros)
      .sort()
      .forEach((clave) => {
        const valor = filtros[clave];
        if (valor === null || valor === undefined) return;
        segmentos.push(
          `${encodeURIComponent(clave)}=${encodeURIComponent(serializarValor(valor))}`,
        );
      });
    segmentos.push(`page=${page}`, `limit=${limit}`);
    return segmentos.join(':');
  }
}
