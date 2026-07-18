import { DataTypes } from 'sequelize';
import sequelize from '../base-dato/Postgresql.js';

const ModeloUsuario = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  apellido: { type: DataTypes.STRING(100) },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  cedula: { type: DataTypes.STRING(20) },
  fecha_nacimiento: { type: DataTypes.DATEONLY },
  rol: { type: DataTypes.ENUM('ADMINISTRADOR', 'OPERADOR'), allowNull: false, defaultValue: 'OPERADOR' },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  sucursal_id: { type: DataTypes.INTEGER },
  created_at: { type: DataTypes.DATE, allowNull: false },
  updated_at: { type: DataTypes.DATE, allowNull: false }
}, {
  tableName: 'usuarios',
  schema: 'public',
  timestamps: false,
  freezeTableName: true
});

export default ModeloUsuario;
export { sequelize };
