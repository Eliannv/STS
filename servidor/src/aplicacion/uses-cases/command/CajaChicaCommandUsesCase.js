// src/aplicacion/uses-cases/command/CajaChicaCommandUsesCase.js
import CajaChica from '../../../dominio/entidades/CajaChica.js';
import { CajaChicaDTO, MovimientoCajaChicaDTO } from '../../dto/CajaChicaDTO.js';

export default class CajaChicaCommandUsesCase {
  constructor(adaptadorCommand, adaptadorQuery) {
    this._adaptadorCommand = adaptadorCommand;
    this._adaptadorQuery = adaptadorQuery;
  }

  /** Abrir (crear) una nueva caja chica */
  async abrir(datos) {
    const dto = new CajaChicaDTO(datos);
    if (!dto.getFecha())         return { estado: 'error', resultado: 'La fecha es requerida' };
    if (!dto.getUsuarioId())     return { estado: 'error', resultado: 'El usuario es requerido' };

    // ── Validar que no exista otra Caja Chica para el mismo día ──
    if (this._adaptadorQuery) {
      console.log('🔍 Verificando si ya existe una Caja Chica para esta fecha...');
      const fechaFormato = new Date(dto.getFecha()).toISOString().split('T')[0]; // YYYY-MM-DD
      const cajaExistente = await this._adaptadorQuery.buscarPorFecha(fechaFormato);
      
      if (cajaExistente && cajaExistente.length > 0) {
        console.log('❌ Ya existe una Caja Chica para el día:', fechaFormato);
        return { 
          estado: 'error', 
          resultado: `Ya existe una Caja Chica abierta o cerrada para el ${fechaFormato}. Ciérrala primero o abre una nueva el siguiente día.`
        };
      }
      console.log('✅ No existe Caja Chica para esta fecha, procediendo...');
    }

    const caja = new CajaChica(
      null,
      dto.getFecha(),
      dto.getMontoInicial(),
      dto.getMontoInicial(), // monto_actual = monto_inicial al abrir
      'ABIERTA',
      dto.getUsuarioId(),
      dto.getUsuarioNombre(),
      dto.getObservacion(),
      true,
      null,
    );
    return this._adaptadorCommand.abrir(caja);
  }

  /** Cerrar la caja chica: cambia estado a CERRADA y opcionalmente la asocia a caja banco */
  async cerrar(datos) {
    console.log('🔍 CajaChicaCommandUsesCase.cerrar() - datos recibidos:', datos);
    const dto = new CajaChicaDTO(datos);
    console.log('🔍 DTO creado - getId():', dto.getId());
    if (!dto.getId()) {
      console.log('❌ ERROR: id no está disponible en el DTO');
      return { estado: 'error', resultado: 'El id es requerido' };
    }

    console.log('✅ Llamando adaptador.cerrar() con id:', dto.getId());
    return this._adaptadorCommand.cerrar(dto.getId(), {
      cerradoEn:        new Date(),
      cerradoPorId:     dto.getCerradoPorId()     || dto.getUsuarioId(),
      cerradoPorNombre: dto.getCerradoPorNombre() || dto.getUsuarioNombre(),
      cajaBancoId:      dto.getCajaBancoId(),
    });
  }

  /**
   * Registrar un movimiento (INGRESO o EGRESO) en la caja chica.
   * El adaptador se encarga de calcular saldo_anterior, saldo_nuevo y actualizar monto_actual.
   */
  async registrarMovimiento(datos) {
    const dto = new MovimientoCajaChicaDTO(datos);
    if (!dto.getCajaChicaId())  return { estado: 'error', resultado: 'cajaChicaId es requerido' };
    if (!dto.getTipo())         return { estado: 'error', resultado: 'tipo es requerido (INGRESO | EGRESO)' };
    if (!dto.getDescripcion())  return { estado: 'error', resultado: 'descripcion es requerida' };
    if (!(dto.getMonto() > 0))  return { estado: 'error', resultado: 'El monto debe ser mayor a 0' };

    return this._adaptadorCommand.registrarMovimiento(dto);
  }

  /** Eliminar un movimiento (solo admins) — revierte el saldo */
  async eliminarMovimiento(movimientoId) {
    if (!movimientoId) return { estado: 'error', resultado: 'movimientoId es requerido' };
    return this._adaptadorCommand.eliminarMovimiento(movimientoId);
  }
}
