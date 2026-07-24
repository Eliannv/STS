// caja-servicio/src/infraestructura/modelos/ModeloMovimientoBanco.js
import { DataTypes } from 'sequelize';
import sequelize from '../base-dato/Postgresql.js';

export const CATEGORIAS_MOVIMIENTO_FINANCIERO = Object.freeze([
  'APERTURA',
  'VENTA_EFECTIVO',
  'VENTA_TRANSFERENCIA',
  'COBRO_DEUDA_EFECTIVO',
  'COBRO_DEUDA_TRANSFERENCIA',
  'ACREDITACION_TARJETA',
  'COMISION_BANCARIA',
  'RETENCION_BANCARIA',
  'PAGO_PROVEEDOR',
  'DEVOLUCION_PROVEEDOR',
  'PAGO_TRABAJADOR',
  'REPOSICION_CAJA_CHICA',
  'DEVOLUCION_CAJA_CHICA',
  'TRANSFERENCIA_ENTRADA',
  'TRANSFERENCIA_SALIDA',
  'OTRO_INGRESO',
  'OTRO_EGRESO',
  'AJUSTE',
  'ANULACION_VENTA',
  'ANULACION_COBRO',
  'ANULACION_PAGO',
  'COMPENSACION',
]);

export const ORIGENES_MOVIMIENTO_FINANCIERO = Object.freeze([
  'FACTURACION',
  'COBRO_DEUDA',
  'VENTA_TARJETA',
  'COMPRAS',
  'INVENTARIO',
  'CUENTA_PAGAR',
  'CAJA',
  'TRANSFERENCIA',
  'AJUSTE',
  'MIGRACION',
  'SISTEMA',
]);

const ModeloMovimientoBanco = sequelize.define(
  'MovimientoBanco',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    caja_banco_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    tipo: {
      type: DataTypes.ENUM('INGRESO', 'EGRESO'),
      allowNull: false,
    },
    categoria: {
      type: DataTypes.ENUM(...CATEGORIAS_MOVIMIENTO_FINANCIERO),
      allowNull: false,
    },
    origen: DataTypes.ENUM(...ORIGENES_MOVIMIENTO_FINANCIERO),
    monto: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      validate: { min: 0.01 },
    },
    saldo_anterior: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    saldo_nuevo: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    descripcion: DataTypes.STRING(255),
    referencia_tipo: DataTypes.STRING(50),
    referencia_id: DataTypes.INTEGER,
    referencia_codigo: DataTypes.STRING(100),
    venta_id: DataTypes.INTEGER,
    operacion_id: DataTypes.UUID,
    idempotency_key: {
      type: DataTypes.STRING(255),
      unique: true,
    },
    movimiento_revertido_id: {
      type: DataTypes.INTEGER,
      unique: true,
    },
    motivo: DataTypes.TEXT,
    observacion: DataTypes.TEXT,
    trace_id: DataTypes.STRING(100),
    fecha_operacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    afecta_flujo_operativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    usuario_id: DataTypes.INTEGER,
    usuario_nombre: DataTypes.STRING(150),
    created_at: DataTypes.DATE,
  },
  {
    tableName: 'movimientos_cajas_banco',
    timestamps: false,
    freezeTableName: true,
  },
);

export default ModeloMovimientoBanco;
