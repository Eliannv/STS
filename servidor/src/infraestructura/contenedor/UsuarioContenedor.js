// src/infraestructura/contenedor/UsuarioContenedor.js
import { UsuarioControlador }        from '../adaptador-entrada/UsuarioControlador.js';
import UsuarioCommandAdaptadorSalida from '../adaptador-salida/UsuarioPgsCommandAdaptador.js';
import UsuarioQueryAdaptadorSalida   from '../adaptador-salida/UsuarioPgsQueryAdaptador.js';
import UCommandCaso                  from '../../aplicacion/uses-cases/command/UsuarioCommandUsesCase.js';
import UQueryCaso                    from '../../aplicacion/uses-cases/query/UsuarioQueryUsesCase.js';

// Adaptadores de salida (PostgreSQL)
const usuarioCommandBDSalida = new UsuarioCommandAdaptadorSalida();
const usuarioQueryBDSalida   = new UsuarioQueryAdaptadorSalida();

// Casos de uso
const casoUsoCommandUsuario = new UCommandCaso(usuarioCommandBDSalida);
const casoUsoQueryUsuario   = new UQueryCaso(usuarioQueryBDSalida);

// Controlador (adaptador de entrada)
const usuarioControlador = new UsuarioControlador(casoUsoCommandUsuario, casoUsoQueryUsuario);

export { usuarioControlador };
