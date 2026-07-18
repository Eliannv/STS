export default class MovimientoCajaChica {
  constructor(id, datos = {}) { Object.assign(this, { id, ...datos }); }
}
