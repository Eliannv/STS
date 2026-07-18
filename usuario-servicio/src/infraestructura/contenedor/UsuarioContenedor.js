import { UsuarioControlador } from '../adaptador-entrada/UsuarioControlador.js';
import UsuarioPgsCommandAdaptador from '../adaptador-salida/UsuarioPgsCommandAdaptador.js';
import UsuarioPgsQueryAdaptador from '../adaptador-salida/UsuarioPgsQueryAdaptador.js';
import UsuarioCommandUsesCase from '../../aplicacion/uses-cases/command/UsuarioCommandUsesCase.js';
import UsuarioQueryUsesCase from '../../aplicacion/uses-cases/query/UsuarioQueryUsesCase.js';

const usuarioControlador = new UsuarioControlador(
  new UsuarioCommandUsesCase(new UsuarioPgsCommandAdaptador()),
  new UsuarioQueryUsesCase(new UsuarioPgsQueryAdaptador())
);

export { usuarioControlador };
