export default class CajaBanco {
  constructor(id, datos = {}) { Object.assign(this, { id, ...datos }); }
}
