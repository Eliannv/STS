// inventario-servicio/src/infraestructura/adaptador-salida/EgresoMercaderiaPgsCommandAdaptador.js
import EgresoSalidaCommandPuerto from '../../aplicacion/puertos/salida/EgresoSalidaCommandPuerto.js';
import DetalleEgreso from '../../dominio/entidades/DetalleEgreso.js';
import EgresoMercaderia from '../../dominio/entidades/EgresoMercaderia.js';
import sequelize from '../base-dato/Postgresql.js';
import ModeloDetalleEgreso from '../modelos/ModeloDetalleEgreso.js';
import ModeloEgresoMercaderia from '../modelos/ModeloEgresoMercaderia.js';

const mapearEgreso = (modelo) => (
  modelo ? new EgresoMercaderia(modelo.get({ plain: true })) : null
);
const mapearDetalle = (modelo) => (
  modelo ? new DetalleEgreso(modelo.get({ plain: true })) : null
);

const egresoDb = (egreso) => ({
  id_personalizado: egreso.getIdPersonalizado(),
  tipo_egreso: egreso.getTipoEgreso(),
  descripcion: egreso.getDescripcion(),
  motivo: egreso.getMotivo(),
  observacion: egreso.getObservacion(),
  fecha: egreso.getFecha(),
  estado: egreso.getEstado(),
  estado_financiero: egreso.getEstadoFinanciero(),
  origen: egreso.getOrigen(),
  ingreso_origen_id: egreso.getIngresoOrigenId(),
  usuario_id: egreso.getUsuarioId(),
  usuario_nombre: egreso.getUsuarioNombre(),
  costo_total: egreso.getCostoTotal(),
  proveedor_id: egreso.getProveedorId(),
  proveedor_nombre: egreso.getProveedorNombre(),
  sucursal_id: egreso.getSucursalId(),
  sucursal_nombre: egreso.getSucursalNombre(),
  documento_referencia: egreso.getDocumentoReferencia(),
  confirmado_en: egreso.getConfirmadoEn(),
  confirmado_por_id: egreso.getConfirmadoPorId(),
  confirmado_por_nombre: egreso.getConfirmadoPorNombre(),
  anulado_en: egreso.getAnuladoEn(),
  anulado_por_id: egreso.getAnuladoPorId(),
  anulado_por_nombre: egreso.getAnuladoPorNombre(),
  motivo_anulacion: egreso.getMotivoAnulacion(),
  operacion_confirmacion_id: egreso.getOperacionConfirmacionId(),
  operacion_anulacion_id: egreso.getOperacionAnulacionId(),
});

const detalleDb = (detalle) => ({
  egreso_id: detalle.getEgresoId(),
  producto_id: detalle.getProductoId(),
  detalle_ingreso_id: detalle.getDetalleIngresoId(),
  nombre: detalle.getNombre(),
  modelo: detalle.getModelo(),
  color: detalle.getColor(),
  grupo: detalle.getGrupo(),
  cantidad: detalle.getCantidad(),
  costo_unitario: detalle.getCostoUnitario(),
  costo_unitario_original: detalle.getCostoUnitarioOriginal(),
  subtotal: detalle.calcularSubtotal(),
  idempotency_key: detalle.getIdempotencyKey(),
  operacion_id: detalle.getOperacionId(),
});

export default class EgresoMercaderiaPgsCommandAdaptador
  extends EgresoSalidaCommandPuerto {
  enTransaccion(work) {
    return sequelize.transaction(work);
  }

  async save(egreso, options = {}) {
    const creado = await ModeloEgresoMercaderia.create({
      ...egresoDb(egreso),
      created_at: new Date(),
      updated_at: new Date(),
    }, { transaction: options.transaction });
    const idPersonalizado = String(creado.id).padStart(10, '0');
    await creado.update({
      id_personalizado: idPersonalizado,
      documento_referencia:
        creado.documento_referencia
        ?? `EGR-${idPersonalizado}`,
      updated_at: new Date(),
    }, { transaction: options.transaction });
    return mapearEgreso(creado);
  }

  async update(id, campos = {}, options = {}) {
    const permitido = [
      'tipo_egreso',
      'descripcion',
      'motivo',
      'observacion',
      'fecha',
      'proveedor_id',
      'proveedor_nombre',
      'ingreso_origen_id',
      'sucursal_id',
      'sucursal_nombre',
      'documento_referencia',
    ];
    const cambios = Object.fromEntries(
      Object.entries(campos).filter(([clave]) => permitido.includes(clave)),
    );
    const [cantidad] = await ModeloEgresoMercaderia.update(
      { ...cambios, updated_at: new Date() },
      {
        where: { id, estado: 'BORRADOR' },
        transaction: options.transaction,
      },
    );
    if (!cantidad) throw new Error('Solo se puede editar un borrador');
    return mapearEgreso(await ModeloEgresoMercaderia.findByPk(id, {
      transaction: options.transaction,
    }));
  }

  async confirmar(id, datos = {}, options = {}) {
    const modelo = await ModeloEgresoMercaderia.findByPk(id, {
      transaction: options.transaction,
      ...(options.transaction
        ? { lock: options.transaction.LOCK.UPDATE }
        : {}),
    });
    if (!modelo || modelo.estado !== 'BORRADOR') {
      throw new Error('Solo se puede confirmar un borrador');
    }
    await modelo.update({
      estado: 'CONFIRMADO',
      estado_financiero: datos.estadoFinanciero,
      costo_total: datos.costoTotal,
      operacion_confirmacion_id: datos.operacionConfirmacionId,
      confirmado_en: new Date(),
      confirmado_por_id: datos.confirmadoPorId,
      confirmado_por_nombre: datos.confirmadoPorNombre,
      updated_at: new Date(),
    }, { transaction: options.transaction });
    return mapearEgreso(modelo);
  }

  async anular(id, datos = {}, options = {}) {
    const modelo = await ModeloEgresoMercaderia.findByPk(id, {
      transaction: options.transaction,
      ...(options.transaction
        ? { lock: options.transaction.LOCK.UPDATE }
        : {}),
    });
    if (!modelo || modelo.estado !== 'CONFIRMADO') {
      throw new Error('Solo se puede anular un egreso confirmado');
    }
    await modelo.update({
      estado: 'ANULADO',
      estado_financiero: datos.estadoFinanciero,
      operacion_anulacion_id: datos.operacionAnulacionId,
      motivo_anulacion: datos.motivoAnulacion,
      anulado_en: new Date(),
      anulado_por_id: datos.anuladoPorId,
      anulado_por_nombre: datos.anuladoPorNombre,
      updated_at: new Date(),
    }, { transaction: options.transaction });
    return mapearEgreso(modelo);
  }

  async descartar(id, datos = {}, options = {}) {
    const [cantidad] = await ModeloEgresoMercaderia.update({
      estado: 'DESCARTADO',
      updated_at: new Date(),
    }, {
      where: { id, estado: 'BORRADOR' },
      transaction: options.transaction,
    });
    if (!cantidad) throw new Error('Solo se puede descartar un borrador');
    return mapearEgreso(await ModeloEgresoMercaderia.findByPk(id, {
      transaction: options.transaction,
    }));
  }

  async saveDetalle(detalle, options = {}) {
    if (detalle.getIdempotencyKey()) {
      const existente = await ModeloDetalleEgreso.findOne({
        where: { idempotency_key: detalle.getIdempotencyKey() },
        transaction: options.transaction,
      });
      if (existente) return mapearDetalle(existente);
    }
    return mapearDetalle(await ModeloDetalleEgreso.create(
      detalleDb(detalle),
      { transaction: options.transaction },
    ));
  }

  async deleteDetalle(id, egresoId, options = {}) {
    const egreso = await ModeloEgresoMercaderia.findOne({
      where: { id: egresoId, estado: 'BORRADOR' },
      transaction: options.transaction,
    });
    if (!egreso) throw new Error('Solo se puede modificar un borrador');
    const cantidad = await ModeloDetalleEgreso.destroy({
      where: { id, egreso_id: egresoId },
      transaction: options.transaction,
    });
    if (!cantidad) throw new Error('Detalle no encontrado');
    return true;
  }
}
