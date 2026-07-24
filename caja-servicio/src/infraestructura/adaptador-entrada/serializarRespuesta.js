// caja-servicio/src/infraestructura/adaptador-entrada/serializarRespuesta.js
const convertirSnakeCase = (clave) => (
  clave.replace(/[A-Z]/g, (letra) => `_${letra.toLowerCase()}`)
);

export const serializarRespuesta = (valor) => {
  if (
    valor === null
    || valor === undefined
    || typeof valor !== 'object'
    || valor instanceof Date
  ) {
    return valor;
  }

  if (Array.isArray(valor)) {
    return valor.map(serializarRespuesta);
  }

  return Object.entries(valor).reduce((resultado, [clave, contenido]) => {
    const contenidoSerializado = serializarRespuesta(contenido);
    resultado[clave] = contenidoSerializado;

    const claveSnakeCase = convertirSnakeCase(clave);
    if (claveSnakeCase !== clave && resultado[claveSnakeCase] === undefined) {
      resultado[claveSnakeCase] = contenidoSerializado;
    }

    return resultado;
  }, {});
};
