import CuentaSalidaCommandPuerto from '../../aplicacion/puertos/salida/CuentaSalidaCommandPuerto.js';
import { Cuenta } from '../modelos/Modelos.js';

const cuentaDb = (cuenta) => ({ fecha: cuenta.fecha, tipo: cuenta.tipo, tipo_cuenta_por_pagar: cuenta.tipoCuentaPorPagar, monto_total: cuenta.montoTotal, monto_abonado: cuenta.montoAbonado, saldo: cuenta.saldo, estado: cuenta.estado, observacion: cuenta.observacion, tercero_nombre: cuenta.terceroNombre, tercero_id: cuenta.terceroId, usuario_id: cuenta.usuarioId, sucursal_id: cuenta.sucursalId, caja_banco_id: cuenta.cajaBancoId, updated_at: new Date() });

export default class CuentaPgsCommandAdaptador extends CuentaSalidaCommandPuerto {
  async crear(cuenta) { try { return { estado: 'ok', resultado: await Cuenta.create({ ...cuentaDb(cuenta), created_at: new Date() }) }; } catch (error) { return { estado: 'error', resultado: error.message }; } }
  async actualizar(id, cuenta) { try { const [cantidad] = await Cuenta.update(cuentaDb(cuenta), { where: { id, estado: 'ACTIVA' } }); return cantidad ? { estado: 'ok', resultado: 'Cuenta actualizada correctamente' } : { estado: 'error', resultado: 'Cuenta no encontrada o cancelada' }; } catch (error) { return { estado: 'error', resultado: error.message }; } }
  async cancelar(id) { const [cantidad] = await Cuenta.update({ estado: 'CANCELADA', saldo: 0, updated_at: new Date() }, { where: { id, estado: 'ACTIVA' } }); return cantidad ? { estado: 'ok', resultado: 'Cuenta cancelada correctamente' } : { estado: 'error', resultado: 'Cuenta no encontrada o ya cancelada' }; }
}
