// caja-servicio/src/infraestructura/modelos/ModeloCajaChica.js
import { DataTypes } from 'sequelize';
import sequelize from '../base-dato/Postgresql.js';

const ModeloCajaChica = sequelize.define(
  'CajaChica',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    monto_inicial: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    monto_actual: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    estado: {
      type: DataTypes.ENUM('ABIERTA', 'CERRADA'),
      allowNull: false,
      defaultValue: 'ABIERTA',
    },
    usuario_id: DataTypes.INTEGER,
    usuario_nombre: DataTypes.STRING(150),
    observacion: DataTypes.TEXT,
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    caja_banco_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sucursal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sucursal_nombre: DataTypes.STRING(100),
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
    cerrado_en: DataTypes.DATE,
    cerrado_por_id: DataTypes.INTEGER,
    cerrado_por_nombre: DataTypes.STRING(150),
    ingresos_acumulados: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    egresos_acumulados: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_movimientos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    saldo_contado_cierre: DataTypes.DECIMAL(14, 2),
    diferencia_cierre: DataTypes.DECIMAL(14, 2),
    motivo_diferencia: DataTypes.TEXT,
    transferir_a_banco: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'cajas_chicas',
    timestamps: false,
    freezeTableName: true,
  },
);

export default ModeloCajaChica;
