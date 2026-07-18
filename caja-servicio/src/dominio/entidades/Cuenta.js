export default class Cuenta {
  constructor(id, datos = {}) { Object.assign(this, { id, ...datos }); }
}
