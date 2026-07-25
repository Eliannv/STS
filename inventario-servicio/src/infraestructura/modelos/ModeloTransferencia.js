// inventario-servicio/src/infraestructura/modelos/ModeloTransferencia.js
import { DataTypes } from 'sequelize';
import sequelize from '../base-dato/Postgresql.js';

const common = { timestamps: false, freezeTableName: true };

const Transferencia = sequelize.define('Transferencia', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_personalizado: DataTypes.STRING(10),
  sucursal_origen_id: { type: DataTypes.INTEGER, allowNull: false },
  sucursal_origen_nombre: DataTypes.STRING(100),
  sucursal_destino_id: { type: DataTypes.INTEGER, allowNull: false },
  sucursal_destino_nombre: DataTypes.STRING(100),
  fecha: DataTypes.DATE,
  estado: DataTypes.ENUM('CONFIRMADA', 'ANULADA'),
  motivo: DataTypes.STRING(150),
  observacion: DataTypes.TEXT,
  total_items: DataTypes.INTEGER,
  costo_total: DataTypes.DECIMAL(14, 2),
  usuario_id: DataTypes.INTEGER,
  usuario_nombre: DataTypes.STRING(150),
  operacion_id: { type: DataTypes.STRING(100), allowNull: false },
  idempotency_key: { type: DataTypes.STRING(180), allowNull: false, unique: true },
  anulada_en: DataTypes.DATE,
  anulada_por_id: DataTypes.INTEGER,
  anulada_por_nombre: DataTypes.STRING(150),
  motivo_anulacion: DataTypes.STRING(150),
  trace_id: DataTypes.STRING(100),
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
}, { tableName: 'transferencias', ...common });

const DetalleTransferencia = sequelize.define('DetalleTransferencia', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  transferencia_id: { type: DataTypes.INTEGER, allowNull: false },
  producto_id: { type: DataTypes.INTEGER, allowNull: false },
  producto_codigo: DataTypes.STRING(50),
  producto_nombre: DataTypes.STRING(150),
  modelo: DataTypes.STRING(100),
  color: DataTypes.STRING(60),
  grupo: DataTypes.STRING(60),
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  costo_unitario: DataTypes.DECIMAL(14, 2),
  subtotal: DataTypes.DECIMAL(14, 2),
}, { tableName: 'detalle_transferencias', ...common });

export { Transferencia, DetalleTransferencia };
