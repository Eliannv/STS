export default class CajaChica {
  constructor(id, datos = {}) { Object.assign(this, { id, ...datos }); }
}
