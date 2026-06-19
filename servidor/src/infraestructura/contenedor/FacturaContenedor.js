// src/infraestructura/contenedor/FacturaContenedor.js
import FacturaPgsCommandAdaptador  from '../adaptador-salida/FacturaPgsCommandAdaptador.js';
import FacturaPgsQueryAdaptador    from '../adaptador-salida/FacturaPgsQueryAdaptador.js';
import FacturaCommandUsesCase      from '../../aplicacion/uses-cases/command/FacturaCommandUsesCase.js';
import FacturaQueryUsesCase        from '../../aplicacion/uses-cases/query/FacturaQueryUsesCase.js';
import FacturaControlador          from '../adaptador-entrada/FacturaControlador.js';
import CajaChicaPgsCommandAdaptador from '../adaptador-salida/CajaChicaPgsCommandAdaptador.js';
import CajaChicaPgsQueryAdaptador   from '../adaptador-salida/CajaChicaPgsQueryAdaptador.js';
import CajaChicaCommandUsesCase     from '../../aplicacion/uses-cases/command/CajaChicaCommandUsesCase.js';
import CajaChicaQueryUsesCase       from '../../aplicacion/uses-cases/query/CajaChicaQueryUsesCase.js';
import CajaBancoPgsCommandAdaptador from '../adaptador-salida/CajaBancoPgsCommandAdaptador.js';
import CajaBancoPgsQueryAdaptador   from '../adaptador-salida/CajaBancoPgsQueryAdaptador.js';
import CajaBancoCommandUsesCase     from '../../aplicacion/uses-cases/command/CajaBancoCommandUsesCase.js';
import CajaBancoQueryUsesCase       from '../../aplicacion/uses-cases/query/CajaBancoQueryUsesCase.js';

const commandAdaptador      = new FacturaPgsCommandAdaptador();
const queryAdaptador        = new FacturaPgsQueryAdaptador();
const commandUC             = new FacturaCommandUsesCase(commandAdaptador);
const queryUC               = new FacturaQueryUsesCase(queryAdaptador);
const cajaChicaCommandUC    = new CajaChicaCommandUsesCase(new CajaChicaPgsCommandAdaptador());
const cajaChicaQueryUC      = new CajaChicaQueryUsesCase(new CajaChicaPgsQueryAdaptador());
const cajaBancoCommandUC    = new CajaBancoCommandUsesCase(new CajaBancoPgsCommandAdaptador());
const cajaBancoQueryUC      = new CajaBancoQueryUsesCase(new CajaBancoPgsQueryAdaptador());

export const facturaControlador = new FacturaControlador(commandUC, queryUC, cajaChicaCommandUC, cajaChicaQueryUC, cajaBancoCommandUC, cajaBancoQueryUC);
