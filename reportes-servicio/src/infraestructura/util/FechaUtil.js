// reportes-servicio/src/infraestructura/util/FechaUtil.js
const ZONA_HORARIA = 'America/Bogota';

const formateadorPartes = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const partesEnBogota = (fecha) => {
  const partes = {};
  formateadorPartes.formatToParts(fecha).forEach(({ type, value }) => {
    if (type !== 'literal') partes[type] = Number(value);
  });
  return partes;
};

const offsetMilisegundos = (fecha) => {
  const partes = partesEnBogota(fecha);
  const representacionUtc = Date.UTC(
    partes.year,
    partes.month - 1,
    partes.day,
    partes.hour,
    partes.minute,
    partes.second,
  );
  return representacionUtc - Math.floor(fecha.getTime() / 1000) * 1000;
};

const crearFechaBogota = (
  year,
  month,
  day,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
) => {
  const estimadaUtc = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
    millisecond,
  );
  let fecha = new Date(estimadaUtc);
  fecha = new Date(estimadaUtc - offsetMilisegundos(fecha));
  return fecha;
};

const validarFecha = (fecha) => {
  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) {
    throw new Error('Fecha inválida');
  }
  return fecha;
};

const obtenerPartesFecha = (valor) => {
  if (typeof valor === 'string') {
    const coincidencia = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (coincidencia) {
      return {
        year: Number(coincidencia[1]),
        month: Number(coincidencia[2]),
        day: Number(coincidencia[3]),
      };
    }
  }

  const fecha = validarFecha(
    valor instanceof Date ? valor : new Date(valor),
  );
  return partesEnBogota(fecha);
};

const rellenar = (valor, longitud = 2) => String(valor).padStart(longitud, '0');

export default class FechaUtil {
  static normalizarInicio(fecha) {
    const partes = obtenerPartesFecha(fecha);
    return crearFechaBogota(partes.year, partes.month, partes.day);
  }

  static normalizarFin(fecha) {
    const partes = obtenerPartesFecha(fecha);
    return crearFechaBogota(
      partes.year,
      partes.month,
      partes.day,
      23,
      59,
      59,
      999,
    );
  }

  static inicioMesActual() {
    const partes = partesEnBogota(new Date());
    return crearFechaBogota(partes.year, partes.month, 1);
  }

  static finMesActual() {
    const partes = partesEnBogota(new Date());
    const siguienteMes = partes.month === 12 ? 1 : partes.month + 1;
    const siguienteYear = partes.month === 12 ? partes.year + 1 : partes.year;
    return new Date(
      crearFechaBogota(siguienteYear, siguienteMes, 1).getTime() - 1,
    );
  }

  static hoyInicio() {
    return this.normalizarInicio(new Date());
  }

  static hoyFin() {
    return this.normalizarFin(new Date());
  }

  static formatearISO(date) {
    const fecha = validarFecha(date instanceof Date ? date : new Date(date));
    const partes = partesEnBogota(fecha);
    const offset = offsetMilisegundos(fecha);
    const signo = offset >= 0 ? '+' : '-';
    const offsetAbsoluto = Math.abs(offset);
    const horasOffset = Math.floor(offsetAbsoluto / 3_600_000);
    const minutosOffset = Math.floor(
      (offsetAbsoluto % 3_600_000) / 60_000,
    );

    return [
      `${rellenar(partes.year, 4)}-${rellenar(partes.month)}-${rellenar(partes.day)}`,
      `T${rellenar(partes.hour)}:${rellenar(partes.minute)}:${rellenar(partes.second)}`,
      `.${rellenar(fecha.getMilliseconds(), 3)}`,
      `${signo}${rellenar(horasOffset)}:${rellenar(minutosOffset)}`,
    ].join('');
  }

  static esPeriodoHistorico(fechaHasta) {
    if (!fechaHasta) return false;
    return this.normalizarFin(fechaHasta).getTime() < this.hoyInicio().getTime();
  }
}

export { ZONA_HORARIA };
