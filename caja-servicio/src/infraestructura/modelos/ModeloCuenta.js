// caja-servicio/src/infraestructura/modelos/ModeloCuenta.js
import { DataTypes } from 'sequelize';
import sequelize from '../base-dato/Postgresql.js';

const ModeloCuenta = sequelize.define(
  'Cuenta',
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
    tipo: {
      type: DataTypes.ENUM('PAGAR', 'COBRAR'),
      allowNull: false,
    },
    tipo_cuenta_por_pagar: DataTypes.ENUM('Deuda', 'Prestamo'),
    monto_total: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    monto_abonado: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    saldo: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM('PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA', 'ANULADA'),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },
    observacion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    tercero_nombre: DataTypes.STRING(150),
    tercero_id: DataTypes.INTEGER,
    usuario_id: DataTypes.INTEGER,
    sucursal_id: DataTypes.INTEGER,
    caja_banco_id: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
    origen: DataTypes.STRING(50),
    referencia_tipo: DataTypes.STRING(50),
    referencia_id: DataTypes.INTEGER,
    referencia_codigo: DataTypes.STRING(100),
    tercero_tipo: DataTypes.STRING(50),
    fecha_emision: DataTypes.DATEONLY,
    fecha_vencimiento: DataTypes.DATEONLY,
    moneda: {
      type: DataTypes.STRING(10),
      defaultValue: 'USD',
    },
    usuario_nombre: DataTypes.STRING(150),
    operacion_id: DataTypes.UUID,
    idempotency_key: DataTypes.STRING(255),
  },
  {
    tableName: 'cuentas',
    timestamps: false,
    freezeTableName: true,
  },
);

export default ModeloCuenta;
