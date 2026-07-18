import { DataTypes } from 'sequelize';
import sequelize from '../base-dato/Postgresql.js';

const ModeloSucursal = sequelize.define('Sucursal', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  direccion: DataTypes.STRING(255),
  telefono: DataTypes.STRING(30),
  fecha_creacion: DataTypes.DATE,
  creado_por_id: DataTypes.INTEGER
}, { tableName: 'sucursales', timestamps: false, freezeTableName: true });

export default ModeloSucursal;
