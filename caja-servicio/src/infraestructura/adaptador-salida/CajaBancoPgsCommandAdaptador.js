// caja-servicio/src/infraestructura/adaptador-salida/CajaBancoPgsCommandAdaptador.js
import sequelize from '../base-dato/Postgresql.js';
import CajaBancoSalidaCommandPuerto from '../../aplicacion/puertos/salida/CajaBancoSalidaCommandPuerto.js';
import CajaBanco from '../../dominio/entidades/CajaBanco.js';
import ModeloCajaBanco from '../modelos/ModeloCajaBanco.js';
import ModeloCajaChica from '../modelos/ModeloCajaChica.js';

const redondear = (valor) => parseFloat(Number(valor).toFixed(2));

const mapearEntidad = (modelo) => (
  modelo ? new CajaBanco(modelo.get({ plain: true })) : null
);

const cajaDb = (caja) => ({
  fecha: caja.getFecha(),
  saldo_inicial: caja.getSaldoInicial(),
  saldo_actual: caja.getSaldoActual(),
  estado: caja.getEstado(),
  usuario_id: caja.getUsuarioId(),
  usuario_nombre: caja.getUsuarioNombre(),
  observacion: caja.getObservacion(),
  activo: caja.getActivo(),
  periodo: caja.getPeriodo(),
  fecha_apertura: caja.getFechaApertura(),
  ingresos_acumulados: caja.getIngresosAcumulados(),
  egresos_acumulados: caja.getEgresosAcumulados(),
  total_movimientos: caja.getTotalMovimientos(),
  saldo_contado_cierre: caja.getSaldoContadoCierre(),
  diferencia_cierre: caja.getDiferenciaCierre(),
  motivo_diferencia: caja.getMotivoDiferencia(),
  observacion_cierre: caja.getObservacionCierre(),
  permite_saldo_negativo: caja.getPermiteSaldoNegativo(),
});

export default class CajaBancoPgsCommandAdaptador extends CajaBancoSalidaCommandPuerto {
  async abrir(caja) {
    return sequelize.transaction(async (transaction) => {
      const creada = await ModeloCajaBanco.create(
        {
          ...cajaDb(caja),
          created_at: caja.getCreatedAt() ?? new Date(),
          updated_at: caja.getUpdatedAt() ?? new Date(),
        },
        { transaction },
      );
      return mapearEntidad(creada);
    });
  }

  async cerrar(id, datos) {
    return sequelize.transaction(async (transaction) => {
      const caja = await ModeloCajaBanco.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!caja || caja.activo !== true) {
        throw new Error('Caja Banco no encontrada');
      }
      if (caja.estado !== 'ABIERTA') {
        throw new Error('Caja cerrada');
      }

      const cajaChicaAbierta = await ModeloCajaChica.findOne({
        where: {
          caja_banco_id: id,
          estado: 'ABIERTA',
          activo: true,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (cajaChicaAbierta) {
        throw new Error('Debe cerrar la Caja Chica asociada antes de cerrar la Caja Banco');
      }

      await caja.update(
        {
          saldo_actual: datos.saldoActual,
          estado: 'CERRADA',
          saldo_contado_cierre: datos.saldoContadoCierre,
          diferencia_cierre: datos.diferenciaCierre,
          motivo_diferencia: datos.motivoDiferencia,
          observacion_cierre: datos.observacionCierre,
          cerrado_en: datos.cerradoEn ?? new Date(),
          cerrado_por_id: datos.cerradoPorId,
          cerrado_por_nombre: datos.cerradoPorNombre,
          updated_at: new Date(),
        },
        { transaction },
      );

      return mapearEntidad(caja);
    });
  }

  async actualizarAcumulados(id, deltaIngreso = 0, deltaEgreso = 0) {
    return sequelize.transaction(async (transaction) => {
      const caja = await ModeloCajaBanco.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!caja) {
        throw new Error('Caja Banco no encontrada');
      }

      await caja.update(
        {
          ingresos_acumulados: redondear(
            Number(caja.ingresos_acumulados ?? 0) + Number(deltaIngreso ?? 0),
          ),
          egresos_acumulados: redondear(
            Number(caja.egresos_acumulados ?? 0) + Number(deltaEgreso ?? 0),
          ),
          updated_at: new Date(),
        },
        { transaction },
      );

      return mapearEntidad(caja);
    });
  }

  eliminarMovimiento() {
    throw new Error('Los movimientos son inmutables');
  }
}
