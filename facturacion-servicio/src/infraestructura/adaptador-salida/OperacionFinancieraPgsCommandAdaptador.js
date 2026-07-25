// facturacion-servicio/src/infraestructura/adaptador-salida/OperacionFinancieraPgsCommandAdaptador.js
import sequelize from '../base-dato/Postgresql.js';
import OperacionFinancieraSalidaCommandPuerto from '../../aplicacion/puertos/salida/OperacionFinancieraSalidaCommandPuerto.js';
import OperacionFinanciera from '../../dominio/entidades/OperacionFinanciera.js';
import ModeloOperacionFinanciera from '../modelos/ModeloOperacionFinanciera.js';

const mapearEntidad = (modelo) => (
  modelo ? new OperacionFinanciera(modelo.get({ plain: true })) : null
);

const operacionDb = (operacion) => ({
  factura_id: operacion.getFacturaId(),
  factura_deuda_id: operacion.getFacturaDeudaId(),
  cuenta_cobrar_id: operacion.getCuentaCobrarId(),
  operacion_id: operacion.getOperacionId(),
  operacion_id_original: operacion.getOperacionIdOriginal(),
  idempotency_key: operacion.getIdempotencyKey(),
  tipo: operacion.getTipo(),
  metodo_pago: operacion.getMetodoPago(),
  metodo_cobro: operacion.getMetodoCobro(),
  monto_total: operacion.getMontoTotal(),
  monto_cobrado: operacion.getMontoCobrado(),
  monto_credito: operacion.getMontoCredito(),
  fecha_vencimiento: operacion.getFechaVencimiento(),
  referencia_pago: operacion.getReferenciaPago(),
  estado: operacion.getEstado(),
  intentos: operacion.getIntentos(),
  ultimo_error: operacion.getUltimoError(),
  payload: operacion.getPayload(),
  respuesta: operacion.getRespuesta(),
  proximo_reintento_en: operacion.getProximoReintentoEn(),
  aplicado_en: operacion.getAplicadoEn(),
  descartado_en: operacion.getDescartadoEn(),
  motivo_descarte: operacion.getMotivoDescarte(),
  trace_id: operacion.getTraceId(),
  usuario_id: operacion.getUsuarioId(),
  usuario_nombre: operacion.getUsuarioNombre(),
  sucursal_id: operacion.getSucursalId(),
});

export default class OperacionFinancieraPgsCommandAdaptador
  extends OperacionFinancieraSalidaCommandPuerto {
  async save(operacion, transactionExterna = null) {
    const guardar = async (transaction) => {
      const existente = await ModeloOperacionFinanciera.findOne({
        where: { idempotency_key: operacion.getIdempotencyKey() },
        transaction,
      });
      if (existente) {
        return mapearEntidad(existente);
      }
      const creada = await ModeloOperacionFinanciera.create(
        {
          ...operacionDb(operacion),
          created_at: operacion.getCreatedAt() ?? new Date(),
          updated_at: operacion.getUpdatedAt() ?? new Date(),
        },
        { transaction },
      );
      return mapearEntidad(creada);
    };

    if (transactionExterna) {
      return guardar(transactionExterna);
    }
    return sequelize.transaction(guardar);
  }

  async marcarAplicado(id, respuesta) {
    const cambios = {
      estado: 'APLICADO',
      respuesta,
      aplicado_en: new Date(),
      proximo_reintento_en: null,
      ultimo_error: null,
      updated_at: new Date(),
    };
    const cuentaCobrarId =
      respuesta?.cuenta_cobrar_id
      ?? respuesta?.cuenta_anulada_id;
    if (cuentaCobrarId != null) {
      cambios.cuenta_cobrar_id = cuentaCobrarId;
    }
    const [cantidad] = await ModeloOperacionFinanciera.update(
      cambios,
      { where: { id, estado: 'PENDIENTE' } },
    );
    return cantidad > 0;
  }

  async marcarError(id, error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    const [cantidad] = await ModeloOperacionFinanciera.update(
      {
        estado: 'DESCARTADO',
        ultimo_error: mensaje,
        motivo_descarte: mensaje,
        descartado_en: new Date(),
        proximo_reintento_en: null,
        updated_at: new Date(),
      },
      { where: { id, estado: 'PENDIENTE' } },
    );
    return cantidad > 0;
  }

  async marcarDescartado(id, motivo) {
    const mensaje = motivo instanceof Error ? motivo.message : String(motivo);
    const [cantidad] = await ModeloOperacionFinanciera.update(
      {
        estado: 'DESCARTADO',
        ultimo_error: null,
        motivo_descarte: mensaje,
        descartado_en: new Date(),
        proximo_reintento_en: null,
        updated_at: new Date(),
      },
      { where: { id, estado: 'PENDIENTE' } },
    );
    return cantidad > 0;
  }

  async incrementarIntentos(id, proximoReintentoEn = null, error = null) {
    const operacion = await ModeloOperacionFinanciera.findByPk(id);
    if (!operacion || operacion.estado !== 'PENDIENTE') {
      return null;
    }
    await operacion.update({
      intentos: Number(operacion.intentos ?? 0) + 1,
      ultimo_error: error instanceof Error ? error.message : error,
      proximo_reintento_en: proximoReintentoEn,
      updated_at: new Date(),
    });
    return mapearEntidad(operacion);
  }
}
