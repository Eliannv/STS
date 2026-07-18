export class HistorialClinicoDTO {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.clienteId = datos.clienteId ?? null;
    for (const campo of ['odEsfera','odCilindro','odEje','odAvsc','odAvcc','oiEsfera','oiCilindro','oiEje','oiAvsc','oiAvcc','dp','add','de','altura','color','observacion','armazonH','armazonV','armazonDbl']) this[campo] = datos[campo] ?? null;
  }
}
