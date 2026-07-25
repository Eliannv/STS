// inventario-servicio/src/infraestructura/modelos/ModeloDetalleEgreso.js
import { DataTypes } from 'sequelize';
import sequelize from '../base-dato/Postgresql.js';

const ModeloDetalleEgreso = sequelize.define(
  'DetalleEgreso',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    egreso_id: { type: DataTypes.INTEGER, allowNull: false },
    producto_id: { type: DataTypes.INTEGER, allowNull: false },
    detalle_ingreso_id: DataTypes.INTEGER,
    nombre: DataTypes.STRING(150),
    modelo: DataTypes.STRING(100),
    color: DataTypes.STRING(60),
    grupo: DataTypes.STRING(60),
    cantidad: { type: DataTypes.INTEGER, allowNull: false },
    costo_unitario: DataTypes.DECIMAL(14, 2),
    costo_unitario_original: DataTypes.DECIMAL(14, 2),
    subtotal: DataTypes.DECIMAL(14, 2),
    idempotency_key: DataTypes.STRING(255),
    operacion_id: DataTypes.UUID,
  },
  {
    tableName: 'detalle_egresos',
    timestamps: false,
    underscored: true,
    freezeTableName: true,
  },
);

export default ModeloDetalleEgreso;
