// inventario-servicio/src/infraestructura/modelos/ModeloOperacionFinancieraInventario.js
import { DataTypes } from 'sequelize';
import sequelize from '../base-dato/Postgresql.js';

const ModeloOperacionFinancieraInventario = sequelize.define(
  'OperacionFinancieraInventario',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ingreso_id: { type: DataTypes.INTEGER, allowNull: false },
    cuenta_pagar_id: DataTypes.INTEGER,
    operacion_id: { type: DataTypes.UUID, allowNull: false, unique: true },
    operacion_id_original: DataTypes.UUID,
    idempotency_key: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    tipo: { type: DataTypes.STRING(50), allowNull: false },
    tipo_compra: DataTypes.STRING(20),
    metodo_pago: DataTypes.STRING(30),
    caja_tipo: DataTypes.STRING(10),
    caja_id: DataTypes.INTEGER,
    monto_total: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
    fecha_vencimiento: DataTypes.DATEONLY,
    estado: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },
    intentos: { type: DataTypes.INTEGER, defaultValue: 0 },
    ultimo_error: DataTypes.TEXT,
    payload: { type: DataTypes.JSONB, allowNull: false },
    respuesta: DataTypes.JSONB,
    proximo_reintento_en: DataTypes.DATE,
    aplicado_en: DataTypes.DATE,
    descartado_en: DataTypes.DATE,
    motivo_descarte: DataTypes.TEXT,
    motivo: DataTypes.TEXT,
    trace_id: DataTypes.STRING(100),
    usuario_id: DataTypes.INTEGER,
    usuario_nombre: DataTypes.STRING(150),
    sucursal_id: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    tableName: 'operaciones_financieras_inventario',
    timestamps: false,
    freezeTableName: true,
  },
);

export default ModeloOperacionFinancieraInventario;
