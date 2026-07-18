export default class HistorialClinico {
  constructor(id, datos = {}) {
    this.id = id;
    this.clienteId = datos.clienteId;
    for (const campo of ['odEsfera','odCilindro','odEje','odAvsc','odAvcc','oiEsfera','oiCilindro','oiEje','oiAvsc','oiAvcc','dp','add','de','altura','color','observacion','armazonH','armazonV','armazonDbl']) {
      this[campo] = datos[campo] ?? null;
    }
  }
}
