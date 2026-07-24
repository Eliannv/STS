// caja-servicio/src/infraestructura/adaptador-salida/CajaAdaptador.js
import {
  CajaBanco,
  CajaChica,
  MovimientoChica,
  MovimientoBanco,
  Cuenta,
} from '../modelos/Modelos.js';
import CajaBancoEntidad from '../../dominio/entidades/CajaBanco.js';
import CajaChicaEntidad from '../../dominio/entidades/CajaChica.js';
import MovimientoFinanciero from '../../dominio/entidades/MovimientoFinanciero.js';
import CuentaEntidad from '../../dominio/entidades/Cuenta.js';

const modelos = {
  'cajas-banco': CajaBanco,
  'cajas-chicas': CajaChica,
  'movimientos-banco': MovimientoBanco,
  'movimientos-chicas': MovimientoChica,
  cuentas: Cuenta,
};

const esMovimiento = (recurso) => (
  recurso === 'movimientos-banco' || recurso === 'movimientos-chicas'
);

const mapearEntidad = (recurso, modelo) => {
  const datos = modelo.get({ plain: true });
  if (recurso === 'cajas-banco') return new CajaBancoEntidad(datos);
  if (recurso === 'cajas-chicas') return new CajaChicaEntidad(datos);
  if (esMovimiento(recurso)) return new MovimientoFinanciero(datos);
  return new CuentaEntidad(datos.id, datos);
};

export default class CajaAdaptador {
  async listar(recurso, {
    estado = null,
    cajaId = null,
    limit = 20,
    offset = 0,
  } = {}) {
    const Model = modelos[recurso];
    if (!Model) {
      return { estado: 'error', resultado: 'Recurso inválido' };
    }

    const where = {};
    if (estado && Model.rawAttributes.estado) where.estado = estado;
    if (cajaId && Model.rawAttributes.caja_banco_id) where.caja_banco_id = cajaId;
    if (cajaId && Model.rawAttributes.caja_chica_id) where.caja_chica_id = cajaId;
    return {
      estado: 'ok',
      resultado: (await Model.findAll({
        where,
        order: [['id', 'DESC']],
        limit: Math.min(Number(limit) || 20, 100),
        offset: Math.max(Number(offset) || 0, 0),
      })).map((modelo) => mapearEntidad(recurso, modelo)),
    };
  }

  async obtener(recurso, id) {
    const Model = modelos[recurso];
    if (!Model) {
      return { estado: 'error', resultado: 'Recurso inválido' };
    }

    const modelo = await Model.findByPk(id);
    return modelo
      ? { estado: 'ok', resultado: mapearEntidad(recurso, modelo) }
      : { estado: 'error', resultado: 'No encontrado' };
  }

  async crear(recurso, datos) {
    if (esMovimiento(recurso)) {
      throw new Error('Los movimientos solo pueden crearse mediante el ledger financiero');
    }

    const Model = modelos[recurso];
    if (!Model) {
      return { estado: 'error', resultado: 'Recurso inválido' };
    }

    const ahora = new Date();
    const modelo = await Model.create({
      ...datos,
      created_at: datos.created_at || ahora,
      updated_at: datos.updated_at || ahora,
    });
    return {
      estado: 'ok',
      resultado: mapearEntidad(recurso, modelo),
    };
  }

  async actualizar(recurso, id, datos) {
    if (esMovimiento(recurso)) {
      throw new Error('Los movimientos son inmutables');
    }

    const Model = modelos[recurso];
    if (!Model) {
      return { estado: 'error', resultado: 'Recurso inválido' };
    }

    const [cantidad] = await Model.update(
      { ...datos, updated_at: new Date() },
      { where: { id } },
    );
    return cantidad
      ? { estado: 'ok', resultado: 'Actualizado correctamente' }
      : { estado: 'error', resultado: 'No encontrado' };
  }

  eliminar() {
    throw new Error('La eliminación física está deshabilitada');
  }

  movimiento() {
    throw new Error('Utilice los casos de uso del ledger financiero');
  }
}
