// caja-servicio/src/infraestructura/adaptador-salida/CajaChicaPgsCommandAdaptador.js
import sequelize from '../base-dato/Postgresql.js';
import CajaChicaSalidaCommandPuerto from '../../aplicacion/puertos/salida/CajaChicaSalidaCommandPuerto.js';
import CajaChica from '../../dominio/entidades/CajaChica.js';
import ModeloCajaChica from '../modelos/ModeloCajaChica.js';

const redondear = (valor) => parseFloat(Number(valor).toFixed(2));

const mapearEntidad = (modelo) => (
  modelo ? new CajaChica(modelo.get({ plain: true })) : null
);

const cajaDb = (caja) => ({
  fecha: caja.getFecha(),
  monto_inicial: caja.getMontoInicial(),
  monto_actual: caja.getMontoActual(),
  estado: caja.getEstado(),
  usuario_id: caja.getUsuarioId(),
  usuario_nombre: caja.getUsuarioNombre(),
  observacion: caja.getObservacion(),
  activo: caja.getActivo(),
  caja_banco_id: caja.getCajaBancoId(),
  ingresos_acumulados: caja.getIngresosAcumulados(),
  egresos_acumulados: caja.getEgresosAcumulados(),
  total_movimientos: caja.getTotalMovimientos(),
  saldo_contado_cierre: caja.getSaldoContadoCierre(),
  diferencia_cierre: caja.getDiferenciaCierre(),
  motivo_diferencia: caja.getMotivoDiferencia(),
  transferir_a_banco: caja.getTransferirABanco(),
});

export default class CajaChicaPgsCommandAdaptador extends CajaChicaSalidaCommandPuerto {
  async abrir(caja) {
    return sequelize.transaction(async (transaction) => {
      const creada = await ModeloCajaChica.create(
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
      const caja = await ModeloCajaChica.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!caja || caja.activo !== true) {
        throw new Error('Caja Chica no encontrada');
      }
      if (caja.estado !== 'ABIERTA') {
        throw new Error('Caja cerrada');
      }

      await caja.update(
        {
          monto_actual: datos.montoActual,
          estado: 'CERRADA',
          saldo_contado_cierre: datos.saldoContadoCierre,
          diferencia_cierre: datos.diferenciaCierre,
          motivo_diferencia: datos.motivoDiferencia,
          transferir_a_banco: datos.transferirABanco,
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
      const caja = await ModeloCajaChica.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!caja) {
        throw new Error('Caja Chica no encontrada');
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
