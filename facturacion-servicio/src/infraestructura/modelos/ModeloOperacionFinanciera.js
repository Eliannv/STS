// facturacion-servicio/src/infraestructura/modelos/ModeloOperacionFinanciera.js
import { DataTypes } from 'sequelize';
import sequelize from '../base-dato/Postgresql.js';

const ModeloOperacionFinanciera = sequelize.define(
  'OperacionFinanciera',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    factura_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    factura_deuda_id: DataTypes.INTEGER,
    cuenta_cobrar_id: DataTypes.INTEGER,
    operacion_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    operacion_id_original: DataTypes.UUID,
    idempotency_key: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    tipo: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    metodo_pago: DataTypes.STRING(30),
    metodo_cobro: DataTypes.STRING(30),
    monto_total: DataTypes.DECIMAL(14, 2),
    monto_cobrado: DataTypes.DECIMAL(14, 2),
    monto_credito: DataTypes.DECIMAL(14, 2),
    fecha_vencimiento: DataTypes.DATEONLY,
    referencia_pago: DataTypes.STRING(100),
    estado: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },
    intentos: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    ultimo_error: DataTypes.TEXT,
    payload: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    respuesta: DataTypes.JSONB,
    proximo_reintento_en: DataTypes.DATE,
    aplicado_en: DataTypes.DATE,
    descartado_en: DataTypes.DATE,
    motivo_descarte: DataTypes.TEXT,
    trace_id: DataTypes.STRING(100),
    usuario_id: DataTypes.INTEGER,
    usuario_nombre: DataTypes.STRING(150),
    sucursal_id: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    tableName: 'operaciones_financieras',
    timestamps: false,
    freezeTableName: true,
  },
);

export default ModeloOperacionFinanciera;
