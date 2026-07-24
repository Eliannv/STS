// facturacion-servicio/src/infraestructura/adaptador-salida/VentaTarjetaPgsCommandAdaptador.js
import sequelize from '../base-dato/Postgresql.js';
import { Op } from 'sequelize';
import VentaTarjetaSalidaCommandPuerto from '../../aplicacion/puertos/salida/VentaTarjetaSalidaCommandPuerto.js';
import VentaTarjetaEntidad from '../../dominio/entidades/VentaTarjeta.js';
import AbonoVentaTarjeta from '../../dominio/entidades/AbonoVentaTarjeta.js';
import { VentaTarjeta, AbonoTarjeta } from '../modelos/Modelos.js';

const mapearVenta = (modelo) => (
  modelo ? new VentaTarjetaEntidad(modelo.get({ plain: true })) : null
);

const mapearAbono = (modelo) => (
  modelo ? new AbonoVentaTarjeta(modelo.get({ plain: true })) : null
);

const abonoDb = (abono) => ({
  venta_tarjeta_id: abono.getVentaTarjetaId(),
  fecha: abono.getFecha(),
  monto: abono.getMontoBruto(),
  observacion: abono.getObservacion(),
  monto_bruto: abono.getMontoBruto(),
  comision: abono.getComision(),
  retencion: abono.getRetencion(),
  monto_neto: abono.getMontoNeto(),
  banco: abono.getBanco(),
  numero_lote: abono.getNumeroLote(),
  numero_autorizacion: abono.getNumeroAutorizacion(),
  voucher: abono.getVoucher(),
  fecha_acreditacion: abono.getFechaAcreditacion(),
  cuenta_banco_id: abono.getCuentaBancoId(),
  operacion_id: abono.getOperacionId(),
  idempotency_key: abono.getIdempotencyKey(),
  usuario_id: abono.getUsuarioId(),
  usuario_nombre: abono.getUsuarioNombre(),
  trace_id: abono.getTraceId(),
  estado: abono.getEstado(),
  created_at: abono.getCreatedAt() ?? new Date(),
});

const acumuladosDb = (venta) => ({
  monto_recibido: venta.getMontoRecibido(),
  saldo_pendiente: venta.getSaldoPendiente(),
  estado: venta.getEstado(),
  cuenta_banco_id: venta.getCuentaBancoId(),
  fecha_ultima_acreditacion: venta.getFechaUltimaAcreditacion(),
  comision_acumulada: venta.getComisionAcumulada(),
  retencion_acumulada: venta.getRetencionAcumulada(),
  monto_bruto_acreditado: venta.getMontoBrutoAcreditado(),
  monto_neto_acreditado: venta.getMontoNetoAcreditado(),
  updated_at: new Date(),
});

export default class VentaTarjetaPgsCommandAdaptador
  extends VentaTarjetaSalidaCommandPuerto {
  async registrarAcreditacion(
    ventaTarjetaId,
    idempotencyKey,
    construirAcreditacion,
    operacionCommand,
  ) {
    return sequelize.transaction(async (transaction) => {
      const modeloVenta = await VentaTarjeta.findByPk(ventaTarjetaId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!modeloVenta) {
        throw new Error('Venta con tarjeta no encontrada');
      }

      const existente = await AbonoTarjeta.findOne({
        where: { idempotency_key: idempotencyKey },
        transaction,
      });
      if (existente) {
        if (Number(existente.venta_tarjeta_id) !== Number(ventaTarjetaId)) {
          throw new Error('idempotency_key ya pertenece a otra venta');
        }
        return {
          venta: mapearVenta(modeloVenta),
          abono: mapearAbono(existente),
          operacion: null,
          idempotente: true,
        };
      }

      const primerAbono = await AbonoTarjeta.findOne({
        where: {
          venta_tarjeta_id: ventaTarjetaId,
          operacion_id: { [Op.ne]: null },
        },
        order: [['id', 'ASC']],
        transaction,
      });
      const preparado = construirAcreditacion({
        venta: mapearVenta(modeloVenta),
        operacionIdExistente: primerAbono?.operacion_id ?? null,
      });

      const modeloAbono = await AbonoTarjeta.create(
        abonoDb(preparado.abono),
        { transaction },
      );
      const abono = mapearAbono(modeloAbono);
      const operacion = preparado.construirOperacion(abono);
      const operacionGuardada = await operacionCommand.save(
        operacion,
        transaction,
      );
      await modeloVenta.update(
        acumuladosDb(preparado.venta),
        { transaction },
      );

      return {
        venta: mapearVenta(modeloVenta),
        abono,
        operacion: operacionGuardada,
        idempotente: false,
      };
    });
  }

  async actualizarEstadoAbono(id, estado) {
    const [cantidad] = await AbonoTarjeta.update(
      { estado },
      { where: { id } },
    );
    return cantidad > 0;
  }

  registrarAbono() {
    throw new Error('Use registrarAcreditacion para conservar idempotencia');
  }
}
