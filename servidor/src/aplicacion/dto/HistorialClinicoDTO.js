// src/aplicacion/dto/HistorialClinicoDTO.js
export class HistorialClinicoDTO {
  constructor(datos) {
    this.id         = datos.id         || null;
    this.clienteId  = datos.clienteId  || null;
    // Ojo Derecho
    this.odEsfera   = datos.odEsfera   ?? null;
    this.odCilindro = datos.odCilindro ?? null;
    this.odEje      = datos.odEje      ?? null;
    this.odAvsc     = datos.odAvsc     ?? null;
    this.odAvcc     = datos.odAvcc     ?? null;
    // Ojo Izquierdo
    this.oiEsfera   = datos.oiEsfera   ?? null;
    this.oiCilindro = datos.oiCilindro ?? null;
    this.oiEje      = datos.oiEje      ?? null;
    this.oiAvsc     = datos.oiAvsc     ?? null;
    this.oiAvcc     = datos.oiAvcc     ?? null;
    // Datos generales
    this.dp         = datos.dp         ?? null;
    this.add        = datos.add        ?? null;
    this.de         = datos.de         || null;
    this.altura     = datos.altura     ?? null;
    this.color      = datos.color      || null;
    this.observacion = datos.observacion || null;
    // Armazón
    this.armazonH    = datos.armazonH    ?? null;
    this.armazonV    = datos.armazonV    ?? null;
    this.armazonDbl  = datos.armazonDbl  ?? null;
    this.armazonDm   = datos.armazonDm   ?? null;
    this.armazonTipo = datos.armazonTipo || null;
    // Control del chequeo
    this.doctor       = datos.doctor       || null;
    this.fechaChequeo = datos.fechaChequeo || null;
    this.horaChequeo  = datos.horaChequeo  || null;
  }

  getId()            { return this.id; }
  getClienteId()     { return this.clienteId; }
  getOdEsfera()      { return this.odEsfera; }
  getOdCilindro()    { return this.odCilindro; }
  getOdEje()         { return this.odEje; }
  getOdAvsc()        { return this.odAvsc; }
  getOdAvcc()        { return this.odAvcc; }
  getOiEsfera()      { return this.oiEsfera; }
  getOiCilindro()    { return this.oiCilindro; }
  getOiEje()         { return this.oiEje; }
  getOiAvsc()        { return this.oiAvsc; }
  getOiAvcc()        { return this.oiAvcc; }
  getDp()            { return this.dp; }
  getAdd()           { return this.add; }
  getDe()            { return this.de; }
  getAltura()        { return this.altura; }
  getColor()         { return this.color; }
  getObservacion()   { return this.observacion; }
  getArmazonH()      { return this.armazonH; }
  getArmazonV()      { return this.armazonV; }
  getArmazonDbl()    { return this.armazonDbl; }
  getArmazonDm()     { return this.armazonDm; }
  getArmazonTipo()   { return this.armazonTipo; }
  getDoctor()        { return this.doctor; }
  getFechaChequeo()  { return this.fechaChequeo; }
  getHoraChequeo()   { return this.horaChequeo; }
}
