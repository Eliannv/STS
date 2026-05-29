// src/aplicacion/uses-cases/command/CajaBancoCommandUsesCase.js
import CajaBanco from '../../../dominio/entidades/CajaBanco.js';
import { CajaBancoDTO, MovimientoCajaBancoDTO } from '../../dto/CajaBancoDTO.js';

export default class CajaBancoCommandUsesCase {
  constructor(adaptador) {
    this._adaptador = adaptador;
  }

  /** Abrir (crear) una nueva caja banco */
  async abrir(datos) {
    const dto = new CajaBancoDTO(datos);
    if (!dto.getFecha())     return { estado: 'error', resultado: 'La fecha es requerida' };
    if (!dto.getUsuarioId()) return { estado: 'error', resultado: 'El usuario es requerido' };

    const caja = new CajaBanco(
      null,
      dto.getFecha(),
      dto.getSaldoInicial(),
      dto.getSaldoInicial(), // saldo_actual = saldo_inicial al abrir
      'ABIERTA',
      dto.getUsuarioId(),
      dto.getUsuarioNombre(),
      dto.getObservacion(),
      true,
    );
    return this._adaptador.abrir(caja);
  }

  /** Cerrar la caja banco */
  async cerrar(datos) {
    const dto = new CajaBancoDTO(datos);
    if (!dto.getId()) return { estado: 'error', resultado: 'El id es requerido' };

    return this._adaptador.cerrar(dto.getId(), {
      cerradoEn:        new Date(),
      cerradoPorId:     dto.getCerradoPorId()     || dto.getUsuarioId(),
      cerradoPorNombre: dto.getCerradoPorNombre() || dto.getUsuarioNombre(),
    });
  }

  /**
   * Registrar un movimiento (INGRESO o EGRESO) en la caja banco.
   * El adaptador calcula saldo_anterior, saldo_nuevo y actualiza saldo_actual.
   */
  async registrarMovimiento(datos) {
    const dto = new MovimientoCajaBancoDTO(datos);
    if (!dto.getCajaBancoId())  return { estado: 'error', resultado: 'cajaBancoId es requerido' };
    if (!dto.getTipo())         return { estado: 'error', resultado: 'tipo es requerido (INGRESO | EGRESO)' };
    if (!dto.getCategoria())    return { estado: 'error', resultado: 'categoria es requerida' };
    if (!(dto.getMonto() > 0))  return { estado: 'error', resultado: 'El monto debe ser mayor a 0' };

    return this._adaptador.registrarMovimiento(dto);
  }

  /** Eliminar un movimiento y revertir el saldo */
  async eliminarMovimiento(movimientoId) {
    if (!movimientoId) return { estado: 'error', resultado: 'movimientoId es requerido' };
    return this._adaptador.eliminarMovimiento(movimientoId);
  }
}
