// caja-servicio/src/infraestructura/modelos/ModeloMovimientoChica.js
import { DataTypes } from 'sequelize';
import sequelize from '../base-dato/Postgresql.js';
import {
  CATEGORIAS_MOVIMIENTO_FINANCIERO,
  ORIGENES_MOVIMIENTO_FINANCIERO,
} from './ModeloMovimientoBanco.js';

const ModeloMovimientoChica = sequelize.define(
  'MovimientoChica',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    caja_chica_id: {
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
    categoria: DataTypes.ENUM(...CATEGORIAS_MOVIMIENTO_FINANCIERO),
    origen: DataTypes.ENUM(...ORIGENES_MOVIMIENTO_FINANCIERO),
    descripcion: {
      type: DataTypes.STRING(255),
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
    factura_id: DataTypes.INTEGER,
    referencia: DataTypes.STRING(100),
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
    tableName: 'movimientos_cajas_chicas',
    timestamps: false,
    freezeTableName: true,
  },
);

export default ModeloMovimientoChica;
