// reportes-servicio/src/infraestructura/util/DecimalUtil.js
const expandirExponente = (valor) => {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return null;
  return numero.toFixed(20).replace(/0+$/, '').replace(/\.$/, '');
};

const aCentavos = (valor) => {
  if (!DecimalUtil.esValido(valor)) {
    throw new Error('Valor monetario inválido');
  }

  let texto = String(valor).trim();
  if (/e/i.test(texto)) texto = expandirExponente(texto);

  const coincidencia = texto.match(/^([+-]?)(\d*)(?:\.(\d*))?$/);
  if (!coincidencia || (!coincidencia[2] && !coincidencia[3])) {
    throw new Error('Valor monetario inválido');
  }

  const signo = coincidencia[1] === '-' ? -1n : 1n;
  const enteros = BigInt(coincidencia[2] || '0');
  const decimales = coincidencia[3] ?? '';
  let centavos = BigInt((decimales.slice(0, 2) || '').padEnd(2, '0'));
  if (Number(decimales[2] ?? 0) >= 5) centavos += 1n;
  return signo * (enteros * 100n + centavos);
};

const desdeCentavos = (centavos) => Number(centavos) / 100;

const dividirRedondeado = (numerador, denominador) => {
  if (denominador === 0n) return 0n;
  const negativo = (numerador < 0n) !== (denominador < 0n);
  const absolutoNumerador = numerador < 0n ? -numerador : numerador;
  const absolutoDenominador = denominador < 0n ? -denominador : denominador;
  const cociente = absolutoNumerador / absolutoDenominador;
  const residuo = absolutoNumerador % absolutoDenominador;
  const redondeado = residuo * 2n >= absolutoDenominador
    ? cociente + 1n
    : cociente;
  return negativo ? -redondeado : redondeado;
};

export default class DecimalUtil {
  static sumar(...valores) {
    const total = valores.reduce(
      (acumulado, valor) => acumulado + aCentavos(valor),
      0n,
    );
    return desdeCentavos(total);
  }

  static restar(a, b) {
    return desdeCentavos(aCentavos(a) - aCentavos(b));
  }

  static multiplicar(a, b) {
    return desdeCentavos(
      dividirRedondeado(aCentavos(a) * aCentavos(b), 100n),
    );
  }

  static dividir(a, b) {
    const divisor = aCentavos(b);
    if (divisor === 0n) return 0;
    return desdeCentavos(
      dividirRedondeado(aCentavos(a) * 100n, divisor),
    );
  }

  static porcentaje(parte, total) {
    const totalCentavos = aCentavos(total);
    if (totalCentavos === 0n) return 0;
    const porcentajeEnCentesimas = dividirRedondeado(
      aCentavos(parte) * 10_000n,
      totalCentavos,
    );
    return Number(porcentajeEnCentesimas) / 100;
  }

  static formatear(valor) {
    const centavos = aCentavos(valor);
    const negativo = centavos < 0n;
    const absoluto = negativo ? -centavos : centavos;
    const enteros = absoluto / 100n;
    const decimales = String(absoluto % 100n).padStart(2, '0');
    return `${negativo ? '-' : ''}${enteros}.${decimales}`;
  }

  static esValido(valor) {
    if (valor === null || valor === undefined || valor === '') return false;
    return Number.isFinite(Number(valor));
  }
}
