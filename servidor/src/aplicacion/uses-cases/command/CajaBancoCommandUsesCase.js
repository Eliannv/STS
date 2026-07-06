// src/aplicacion/uses-cases/command/CajaBancoCommandUsesCase.js
import CajaBanco from '../../../dominio/entidades/CajaBanco.js';
import { CajaBancoDTO, MovimientoCajaBancoDTO } from '../../dto/CajaBancoDTO.js';

export default class CajaBancoCommandUsesCase {
  constructor(adaptadorCommand, adaptadorQuery) {
    this._adaptadorCommand = adaptadorCommand;
    this._adaptadorQuery = adaptadorQuery;
  }

  /** Abrir (crear) una nueva caja banco */
  async abrir(datos) {
    const dto = new CajaBancoDTO(datos);
    if (!dto.getFecha())     return { estado: 'error', resultado: 'La fecha es requerida' };
    if (!dto.getUsuarioId()) return { estado: 'error', resultado: 'El usuario es requerido' };

    // ── Validar que no exista otra Caja Banco abierta ──
    if (this._adaptadorQuery) {
      const cajaAbiertaResp = await this._adaptadorQuery.cajaAbierta();
      if (cajaAbiertaResp.resultado) {
        console.log('❌ Ya existe una Caja Banco abierta');
        return { 
          estado: 'error', 
          resultado: 'Ya existe una Caja Banco abierta. Ciérrala primero.'
        };
      }
      console.log('✅ No hay Caja Banco abierta, verificando mes...');
    }

    // ── Validar que no exista otra Caja Banco para el mismo mes ──
    if (this._adaptadorQuery) {
      console.log('🔍 Verificando si ya existe una Caja Banco para este mes...');
      const fechaFormato = new Date(dto.getFecha()).toISOString().substring(0, 7); // YYYY-MM
      const cajaExistente = await this._adaptadorQuery.buscarPorMes(fechaFormato);
      
      if (cajaExistente && cajaExistente.length > 0) {
        console.log('❌ Ya existe una Caja Banco para el mes:', fechaFormato);
        return { 
          estado: 'error', 
          resultado: `Ya existe una Caja Banco abierta o cerrada para ${fechaFormato}. Abre una nueva el siguiente mes.`
        };
      }
      console.log('✅ No existe Caja Banco para este mes, procediendo...');
    }

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
    return this._adaptadorCommand.abrir(caja);
  }

  /** Cerrar la caja banco */
  async cerrar(datos) {
    const dto = new CajaBancoDTO(datos);
    if (!dto.getId()) return { estado: 'error', resultado: 'El id es requerido' };

    return this._adaptadorCommand.cerrar(dto.getId(), {
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
    console.log('🟡 CajaBancoCommandUsesCase.registrarMovimiento - DTO creado:', {
      cajaBancoId: dto.getCajaBancoId(),
      tipo: dto.getTipo(),
      categoria: dto.getCategoria(),
      monto: dto.getMonto(),
      ventaId: dto.getVentaId(),
    });
    
    if (!dto.getCajaBancoId())  return { estado: 'error', resultado: 'cajaBancoId es requerido' };
    if (!dto.getTipo())         return { estado: 'error', resultado: 'tipo es requerido (INGRESO | EGRESO)' };
    if (!dto.getCategoria())    return { estado: 'error', resultado: 'categoria es requerida' };
    if (!(dto.getMonto() > 0))  return { estado: 'error', resultado: 'El monto debe ser mayor a 0' };

    console.log('✅ Validaciones pasadas, llamando adaptador...');
    const resultado = await this._adaptadorCommand.registrarMovimiento(dto);
    console.log('📤 Resultado del adaptador:', resultado);
    return resultado;
  }

  /** Eliminar un movimiento y revertir el saldo */
  async eliminarMovimiento(movimientoId) {
    if (!movimientoId) return { estado: 'error', resultado: 'movimientoId es requerido' };
    return this._adaptadorCommand.eliminarMovimiento(movimientoId);
  }
}
