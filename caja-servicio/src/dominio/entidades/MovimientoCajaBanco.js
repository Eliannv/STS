export default class MovimientoCajaBanco {
  constructor(id, datos = {}) { Object.assign(this, { id, ...datos }); }
}
