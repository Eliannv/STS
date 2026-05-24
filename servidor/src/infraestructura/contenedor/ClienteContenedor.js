// src/infraestructura/contenedor/ClienteContenedor.js
import { ClienteControlador }        from '../adaptador-entrada/ClienteControlador.js';
import ClienteCommandAdaptadorSalida from '../adaptador-salida/ClientePgsCommandAdaptador.js';
import ClienteQueryAdaptadorSalida   from '../adaptador-salida/ClientePgsQueryAdaptador.js';
import CCommandCaso                  from '../../aplicacion/uses-cases/command/ClienteCommandUsesCase.js';
import CQueryCaso                    from '../../aplicacion/uses-cases/query/ClienteQueryUsesCase.js';

// Adaptadores de salida (PostgreSQL)
const clienteCommandBDSalida = new ClienteCommandAdaptadorSalida();
const clienteQueryBDSalida   = new ClienteQueryAdaptadorSalida();

// Casos de uso
const casoUsoCommandCliente = new CCommandCaso(clienteCommandBDSalida);
const casoUsoQueryCliente   = new CQueryCaso(clienteQueryBDSalida);

// Controlador (adaptador de entrada)
const clienteControlador = new ClienteControlador(casoUsoCommandCliente, casoUsoQueryCliente);

export { clienteControlador };
