// inventario-servicio/src/infraestructura/modelos/ModeloEgresoMercaderia.js
import { DataTypes } from 'sequelize';
import sequelize from '../base-dato/Postgresql.js';

const ModeloEgresoMercaderia = sequelize.define(
  'EgresoMercaderia',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_personalizado: DataTypes.STRING(20),
    tipo_egreso: {
      type: DataTypes.ENUM(
        'DEVOLUCION_PROVEEDOR',
        'MERMA',
        'ROTURA',
        'ROBO',
        'PERDIDA',
        'VENCIMIENTO',
        'CONSUMO_INTERNO',
        'MUESTRA',
        'DONACION',
        'OBSOLESCENCIA',
        'RETIRO_CALIDAD',
        'OTRO',
      ),
      allowNull: false,
    },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    motivo: DataTypes.TEXT,
    observacion: DataTypes.TEXT,
    fecha: { type: DataTypes.DATE, allowNull: false },
    estado: {
      type: DataTypes.ENUM('BORRADOR', 'CONFIRMADO', 'ANULADO', 'DESCARTADO'),
      allowNull: false,
      defaultValue: 'BORRADOR',
    },
    estado_financiero: {
      type: DataTypes.ENUM(
        'NO_APLICA',
        'PENDIENTE',
        'APLICADO',
        'ERROR',
        'DESCARTADO',
      ),
      allowNull: false,
      defaultValue: 'NO_APLICA',
    },
    origen: DataTypes.STRING(50),
    ingreso_origen_id: DataTypes.INTEGER,
    usuario_id: DataTypes.INTEGER,
    usuario_nombre: DataTypes.STRING(150),
    costo_total: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
    proveedor_id: DataTypes.INTEGER,
    proveedor_nombre: DataTypes.STRING(150),
    sucursal_id: DataTypes.INTEGER,
    sucursal_nombre: DataTypes.STRING(100),
    documento_referencia: DataTypes.STRING(100),
    confirmado_en: DataTypes.DATE,
    confirmado_por_id: DataTypes.INTEGER,
    confirmado_por_nombre: DataTypes.STRING(150),
    anulado_en: DataTypes.DATE,
    anulado_por_id: DataTypes.INTEGER,
    anulado_por_nombre: DataTypes.STRING(150),
    motivo_anulacion: DataTypes.TEXT,
    operacion_confirmacion_id: DataTypes.UUID,
    operacion_anulacion_id: DataTypes.UUID,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    tableName: 'egresos_mercaderia',
    timestamps: false,
    underscored: true,
    freezeTableName: true,
  },
);

export default ModeloEgresoMercaderia;
