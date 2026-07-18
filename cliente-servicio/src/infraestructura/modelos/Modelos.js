import { DataTypes } from 'sequelize';
import sequelize from '../base-dato/Postgresql.js';

const ClienteModel = sequelize.define('Cliente', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, nombres: { type: DataTypes.STRING(100), allowNull: false }, apellidos: { type: DataTypes.STRING(100), allowNull: false }, cedula: { type: DataTypes.STRING(20), unique: true }, telefono: DataTypes.STRING(30), email: DataTypes.STRING(150), fecha_nacimiento: DataTypes.DATEONLY, direccion: DataTypes.STRING(255), pais: DataTypes.STRING(60), provincia: DataTypes.STRING(60), ciudad: DataTypes.STRING(60), activo: { type: DataTypes.BOOLEAN, defaultValue: true }, tiene_historial_clinico: { type: DataTypes.BOOLEAN, defaultValue: false }, tiene_credito: { type: DataTypes.BOOLEAN, defaultValue: false }, tiene_deuda: { type: DataTypes.BOOLEAN, defaultValue: false }, ultima_actualizacion_deuda: DataTypes.DATE, es_consumidor_final: { type: DataTypes.BOOLEAN, defaultValue: false }, created_at: DataTypes.DATE, updated_at: DataTypes.DATE
}, { tableName: 'clientes', timestamps: false, freezeTableName: true });

const HistorialModel = sequelize.define('HistorialClinico', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, cliente_id: { type: DataTypes.INTEGER, allowNull: false },
  od_esfera: DataTypes.DECIMAL(5, 2), od_cilindro: DataTypes.DECIMAL(5, 2), od_eje: DataTypes.DECIMAL(6, 2), od_avsc: DataTypes.DECIMAL(5, 2), od_avcc: DataTypes.DECIMAL(5, 2), oi_esfera: DataTypes.DECIMAL(5, 2), oi_cilindro: DataTypes.DECIMAL(5, 2), oi_eje: DataTypes.DECIMAL(6, 2), oi_avsc: DataTypes.DECIMAL(5, 2), oi_avcc: DataTypes.DECIMAL(5, 2), dp: DataTypes.DECIMAL(5, 2), add: DataTypes.DECIMAL(5, 2), de: DataTypes.STRING(60), altura: DataTypes.DECIMAL(5, 2), color: DataTypes.STRING(60), observacion: DataTypes.TEXT, armazon_h: DataTypes.DECIMAL(5, 2), armazon_v: DataTypes.DECIMAL(5, 2), armazon_dbl: DataTypes.DECIMAL(5, 2), created_at: DataTypes.DATE, updated_at: DataTypes.DATE
}, { tableName: 'historial_clinico', timestamps: false, freezeTableName: true });

ClienteModel.hasMany(HistorialModel, { foreignKey: 'cliente_id', as: 'historial' });
HistorialModel.belongsTo(ClienteModel, { foreignKey: 'cliente_id', as: 'cliente' });
export { ClienteModel, HistorialModel };
