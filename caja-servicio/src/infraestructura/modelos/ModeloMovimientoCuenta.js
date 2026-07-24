// caja-servicio/src/infraestructura/modelos/ModeloMovimientoCuenta.js
import { DataTypes } from 'sequelize';
import sequelize from '../base-dato/Postgresql.js';

const ModeloMovimientoCuenta = sequelize.define(
  'MovimientoCuenta',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    cuenta_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tipo_movimiento: {
      type: DataTypes.ENUM('CREACION', 'ABONO', 'PAGO', 'AJUSTE', 'ANULACION', 'REVERSO'),
      allowNull: false,
    },
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
    metodo_pago: DataTypes.STRING(30),
    caja_tipo: DataTypes.STRING(10),
    caja_id: DataTypes.INTEGER,
    movimiento_financiero_id: DataTypes.INTEGER,
    referencia_tipo: DataTypes.STRING(50),
    referencia_id: DataTypes.INTEGER,
    referencia_codigo: DataTypes.STRING(100),
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
    usuario_id: DataTypes.INTEGER,
    usuario_nombre: DataTypes.STRING(150),
    created_at: DataTypes.DATE,
  },
  {
    tableName: 'movimientos_cuentas',
    timestamps: false,
    freezeTableName: true,
  },
);

export default ModeloMovimientoCuenta;
