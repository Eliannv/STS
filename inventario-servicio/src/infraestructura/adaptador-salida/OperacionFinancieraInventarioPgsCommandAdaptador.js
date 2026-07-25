// inventario-servicio/src/infraestructura/adaptador-salida/OperacionFinancieraInventarioPgsCommandAdaptador.js
import sequelize from '../base-dato/Postgresql.js';
import OperacionFinancieraInventarioSalidaCommandPuerto from '../../aplicacion/puertos/salida/OperacionFinancieraInventarioSalidaCommandPuerto.js';
import OperacionFinancieraInventario from '../../dominio/entidades/OperacionFinancieraInventario.js';
import ModeloOperacionFinancieraInventario from '../modelos/ModeloOperacionFinancieraInventario.js';
import ModeloEgresoMercaderia from '../modelos/ModeloEgresoMercaderia.js';
import { Ingreso } from '../modelos/Modelos.js';

const mapear = (modelo) => (
  modelo
    ? new OperacionFinancieraInventario(modelo.get({ plain: true }))
    : null
);

const operacionDb = (operacion) => ({
  ingreso_id: operacion.getIngresoId(),
  egreso_id: operacion.getEgresoId(),
  cuenta_pagar_id: operacion.getCuentaPagarId(),
  operacion_id: operacion.getOperacionId(),
  operacion_id_original: operacion.getOperacionIdOriginal(),
  idempotency_key: operacion.getIdempotencyKey(),
  tipo: operacion.getTipo(),
  tipo_compra: operacion.getTipoCompra(),
  metodo_pago: operacion.getMetodoPago(),
  caja_tipo: operacion.getCajaTipo(),
  caja_id: operacion.getCajaId(),
  monto_total: operacion.getMontoTotal(),
  monto: operacion.getMonto(),
  proveedor_id: operacion.getProveedorId(),
  proveedor_nombre: operacion.getProveedorNombre(),
  ingreso_origen_id: operacion.getIngresoOrigenId(),
  fecha_vencimiento: operacion.getFechaVencimiento(),
  estado: operacion.getEstado(),
  intentos: operacion.getIntentos(),
  ultimo_error: operacion.getUltimoError(),
  payload: operacion.getPayload(),
  respuesta: operacion.getRespuesta(),
  proximo_reintento_en: operacion.getProximoReintentoEn(),
  aplicado_en: operacion.getAplicadoEn(),
  descartado_en: operacion.getDescartadoEn(),
  motivo_descarte: operacion.getMotivoDescarte(),
  motivo: operacion.getMotivo(),
  trace_id: operacion.getTraceId(),
  usuario_id: operacion.getUsuarioId(),
  usuario_nombre: operacion.getUsuarioNombre(),
  sucursal_id: operacion.getSucursalId(),
});

export default class OperacionFinancieraInventarioPgsCommandAdaptador
  extends OperacionFinancieraInventarioSalidaCommandPuerto {
  async save(operacion, options = {}) {
    const transactionExterna =
      options?.transaction
      ?? (typeof options?.commit === 'function' ? options : null);
    const guardar = async (transaction) => {
      const existente = await ModeloOperacionFinancieraInventario.findOne({
        where: { idempotency_key: operacion.getIdempotencyKey() },
        transaction,
      });
      if (existente) return mapear(existente);
      const creada = await ModeloOperacionFinancieraInventario.create(
        {
          ...operacionDb(operacion),
          created_at: operacion.getCreatedAt() ?? new Date(),
          updated_at: operacion.getUpdatedAt() ?? new Date(),
        },
        { transaction },
      );
      return mapear(creada);
    };
    return transactionExterna
      ? guardar(transactionExterna)
      : sequelize.transaction(guardar);
  }

  async marcarAplicada(id, respuesta) {
    return sequelize.transaction(async (transaction) => {
      const operacion = await ModeloOperacionFinancieraInventario.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!operacion || operacion.estado !== 'PENDIENTE') return false;
      const cuentaPagarId = respuesta?.cuenta_pagar_id ?? null;
      await operacion.update({
        estado: 'APLICADO',
        respuesta,
        cuenta_pagar_id: cuentaPagarId,
        aplicado_en: new Date(),
        proximo_reintento_en: null,
        ultimo_error: null,
        updated_at: new Date(),
      }, { transaction });
      if (operacion.ingreso_id) {
        await Ingreso.update({
          estado_financiero: 'APLICADO',
          cuenta_pagar_id: cuentaPagarId,
          updated_at: new Date(),
        }, {
          where: { id: operacion.ingreso_id },
          transaction,
        });
      }
      if (operacion.egreso_id) {
        await ModeloEgresoMercaderia.update({
          estado_financiero: 'APLICADO',
          updated_at: new Date(),
        }, {
          where: { id: operacion.egreso_id },
          transaction,
        });
      }
      return true;
    });
  }

  async registrarFallo(id, error, proximoReintentoEn = null) {
    const mensaje = error instanceof Error ? error.message : String(error);
    return sequelize.transaction(async (transaction) => {
      const operacion = await ModeloOperacionFinancieraInventario.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!operacion || operacion.estado !== 'PENDIENTE') return null;
      await operacion.update({
        intentos: Number(operacion.intentos ?? 0) + 1,
        ultimo_error: mensaje,
        proximo_reintento_en: proximoReintentoEn,
        updated_at: new Date(),
      }, { transaction });
      return mapear(operacion);
    });
  }

  async marcarDescartada(id, motivo) {
    const mensaje = motivo instanceof Error ? motivo.message : String(motivo);
    return sequelize.transaction(async (transaction) => {
      const operacion = await ModeloOperacionFinancieraInventario.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!operacion || operacion.estado !== 'PENDIENTE') return false;
      await operacion.update({
        estado: 'DESCARTADO',
        ultimo_error: mensaje,
        motivo_descarte: mensaje,
        descartado_en: new Date(),
        proximo_reintento_en: null,
        updated_at: new Date(),
      }, { transaction });
      if (operacion.ingreso_id) {
        await Ingreso.update({
          estado_financiero: 'DESCARTADO',
          updated_at: new Date(),
        }, {
          where: { id: operacion.ingreso_id },
          transaction,
        });
      }
      if (operacion.egreso_id) {
        await ModeloEgresoMercaderia.update({
          estado_financiero: 'DESCARTADO',
          updated_at: new Date(),
        }, {
          where: { id: operacion.egreso_id },
          transaction,
        });
      }
      return true;
    });
  }

  async descartarPendientesPorEgreso(egresoId, motivo, options = {}) {
    const ejecutar = (transaction) => ModeloOperacionFinancieraInventario.update({
      estado: 'DESCARTADO',
      ultimo_error: motivo,
      motivo_descarte: motivo,
      descartado_en: new Date(),
      proximo_reintento_en: null,
      updated_at: new Date(),
    }, {
      where: { egreso_id: egresoId, estado: 'PENDIENTE' },
      transaction,
    });
    return options.transaction
      ? ejecutar(options.transaction)
      : sequelize.transaction(ejecutar);
  }

  async vincularCuentaPagar(id, cuentaPagarId) {
    const operacion = await ModeloOperacionFinancieraInventario.findByPk(id);
    if (!operacion) return false;
    await operacion.update({
      cuenta_pagar_id: cuentaPagarId,
      updated_at: new Date(),
    });
    if (operacion.ingreso_id) {
      await Ingreso.update({
        cuenta_pagar_id: cuentaPagarId,
        updated_at: new Date(),
      }, { where: { id: operacion.ingreso_id } });
    }
    return true;
  }
}
