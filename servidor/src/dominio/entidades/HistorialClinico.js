// src/dominio/entidades/HistorialClinico.js
export default class HistorialClinico {
  constructor(
    id, clienteId,
    odEsfera, odCilindro, odEje, odAvsc, odAvcc,
    oiEsfera, oiCilindro, oiEje, oiAvsc, oiAvcc,
    dp, add, de, altura, color, observacion,
    armazonH, armazonV, armazonDbl, armazonDm, armazonTipo,
    doctor, fechaChequeo, horaChequeo
  ) {
    this.id           = id;
    this.clienteId    = clienteId;
    // Ojo Derecho
    this.odEsfera     = odEsfera    ?? null;
    this.odCilindro   = odCilindro  ?? null;
    this.odEje        = odEje       ?? null;
    this.odAvsc       = odAvsc      ?? null;
    this.odAvcc       = odAvcc      ?? null;
    // Ojo Izquierdo
    this.oiEsfera     = oiEsfera    ?? null;
    this.oiCilindro   = oiCilindro  ?? null;
    this.oiEje        = oiEje       ?? null;
    this.oiAvsc       = oiAvsc      ?? null;
    this.oiAvcc       = oiAvcc      ?? null;
    // Datos generales
    this.dp           = dp          ?? null;
    this.add          = add         ?? null;
    this.de           = de          ?? null;
    this.altura       = altura      ?? null;
    this.color        = color       ?? null;
    this.observacion  = observacion ?? null;
    // Armazón
    this.armazonH     = armazonH    ?? null;
    this.armazonV     = armazonV    ?? null;
    this.armazonDbl   = armazonDbl  ?? null;
    this.armazonDm    = armazonDm   ?? null;
    this.armazonTipo  = armazonTipo ?? null;
    // Control del chequeo
    this.doctor       = doctor       ?? null;
    this.fechaChequeo = fechaChequeo ?? null;
    this.horaChequeo  = horaChequeo  ?? null;
  }
}
