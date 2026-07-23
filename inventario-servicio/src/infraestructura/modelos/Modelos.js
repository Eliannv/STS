import { DataTypes } from 'sequelize';
import sequelize from '../base-dato/Postgresql.js';

const common = { timestamps: false, freezeTableName: true };
const Proveedor = sequelize.define('Proveedor', { id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, codigo: DataTypes.STRING(30), nombre: { type: DataTypes.STRING(150), allowNull: false }, representante: DataTypes.STRING(100), ruc: { type: DataTypes.STRING(20), allowNull: false }, telefono_principal: DataTypes.STRING(30), telefono_secundario: DataTypes.STRING(30), codigo_lugar: DataTypes.STRING(20), direccion: DataTypes.STRING(255), fecha_ingreso: DataTypes.DATEONLY, saldo: DataTypes.DECIMAL(14,2), activo: DataTypes.BOOLEAN, created_at: DataTypes.DATE, updated_at: DataTypes.DATE }, { tableName: 'proveedores', ...common });
const Producto = sequelize.define('Producto', { id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, id_interno: DataTypes.INTEGER, codigo: { type: DataTypes.STRING(50), allowNull: false }, codigo_barras: { type: DataTypes.STRING(100), unique: true }, nombre: { type: DataTypes.STRING(150), allowNull: false }, modelo: DataTypes.STRING(100), color: DataTypes.STRING(60), grupo: DataTypes.STRING(60), stock: DataTypes.INTEGER, tipo_control_stock: DataTypes.ENUM('NORMAL','ILIMITADO'), costo: DataTypes.DECIMAL(14,2), pvp1: DataTypes.DECIMAL(14,2), iva: DataTypes.DECIMAL(5,2), precio_con_iva: DataTypes.DECIMAL(14,2), proveedor_id: DataTypes.INTEGER, ingreso_id: DataTypes.INTEGER, observacion: DataTypes.TEXT, activo: DataTypes.BOOLEAN, created_at: DataTypes.DATE, updated_at: DataTypes.DATE }, { tableName: 'productos', ...common });
const CatalogoItem = sequelize.define('CatalogoItem', { id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, nombre: { type: DataTypes.STRING(150), allowNull: false }, categoria: DataTypes.ENUM('LUNA','LENTE_CONTACTO','LIQUIDO','SERVICIO'), precio: DataTypes.DECIMAL(14,2), iva: DataTypes.DECIMAL(5,2), precio_con_iva: DataTypes.DECIMAL(14,2), activo: DataTypes.BOOLEAN, observacion: DataTypes.TEXT, created_at: DataTypes.DATE, updated_at: DataTypes.DATE }, { tableName: 'catalogo_items', ...common });
const Ingreso = sequelize.define('Ingreso', { id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, id_personalizado: DataTypes.STRING(10), proveedor_id: DataTypes.INTEGER, proveedor_nombre: DataTypes.STRING(150), numero_factura: { type: DataTypes.STRING(50), allowNull: false }, fecha: { type: DataTypes.DATEONLY, allowNull: false }, tipo_compra: DataTypes.ENUM('CONTADO','CREDITO'), observacion: DataTypes.TEXT, descuento: DataTypes.DECIMAL(14,2), flete: DataTypes.DECIMAL(14,2), iva: DataTypes.DECIMAL(14,2), total: DataTypes.DECIMAL(14,2), estado: DataTypes.ENUM('BORRADOR','FINALIZADO','ANULADO'), usuario_id: DataTypes.INTEGER, created_at: DataTypes.DATE, updated_at: DataTypes.DATE }, { tableName: 'ingresos', ...common });
const DetalleIngreso = sequelize.define('DetalleIngreso', { id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, ingreso_id: DataTypes.INTEGER, producto_id: DataTypes.INTEGER, tipo: DataTypes.ENUM('EXISTENTE','NUEVO'), codigo: DataTypes.STRING(50), nombre: DataTypes.STRING(150), modelo: DataTypes.STRING(100), color: DataTypes.STRING(60), grupo: DataTypes.STRING(60), pvp1: DataTypes.DECIMAL(14,2), observacion: DataTypes.TEXT, stock_ingresado: DataTypes.INTEGER, costo_unitario: DataTypes.DECIMAL(14,2), subtotal: DataTypes.DECIMAL(14,2) }, { tableName: 'detalle_ingresos', ...common });
const Egreso = sequelize.define('Egreso', { id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, motivo: DataTypes.ENUM('DEVOLUCION_PROVEEDOR','PRODUCTO_DANADO','AJUSTE_INVENTARIO','DONACION','USO_INTERNO','PERDIDA_ROBO','OTRO'), descripcion: { type: DataTypes.TEXT, allowNull: false }, fecha: DataTypes.DATE, usuario_id: DataTypes.INTEGER, usuario_nombre: DataTypes.STRING(150), costo_total: DataTypes.DECIMAL(14,2), proveedor_id: DataTypes.INTEGER, proveedor_nombre: DataTypes.STRING(150), sucursal_id: DataTypes.INTEGER, sucursal_nombre: DataTypes.STRING(100), documento_referencia: DataTypes.STRING(100), created_at: DataTypes.DATE }, { tableName: 'egresos_mercaderia', ...common });
const DetalleEgreso = sequelize.define('DetalleEgreso', { id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, egreso_id: DataTypes.INTEGER, producto_id: DataTypes.INTEGER, nombre: DataTypes.STRING(150), modelo: DataTypes.STRING(100), color: DataTypes.STRING(60), grupo: DataTypes.STRING(60), cantidad: DataTypes.INTEGER, costo_unitario: DataTypes.DECIMAL(14,2), subtotal: DataTypes.DECIMAL(14,2) }, { tableName: 'detalle_egresos', ...common });
const MovimientoStock = sequelize.define('MovimientoStock', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  producto_id: { type: DataTypes.INTEGER, allowNull: false },
  producto_codigo: DataTypes.STRING(50),
  producto_nombre: DataTypes.STRING(150),
  grupo_producto: DataTypes.STRING(60),
  sucursal_id: DataTypes.INTEGER,
  sucursal_nombre: DataTypes.STRING(100),
  tipo: { type: DataTypes.ENUM('INGRESO','AJUSTE','ANULACION','VENTA NORMAL','VENTA','SALIDA','ELIMINACION','VENTA_EDITADA','COMPRA_EDITADA'), allowNull: false },
  naturaleza: { type: DataTypes.ENUM('ENTRADA','SALIDA','NEUTRO'), allowNull: false },
  tipo_movimiento: { type: DataTypes.ENUM('INVENTARIO_INICIAL','COMPRA','VENTA','DEVOLUCION_CLIENTE','DEVOLUCION_PROVEEDOR','EGRESO','AJUSTE','TRANSFERENCIA_ENTRADA','TRANSFERENCIA_SALIDA','ANULACION_VENTA','ANULACION_COMPRA','ANULACION_EGRESO','REVALORIZACION','COMPENSACION'), allowNull: false },
  origen: { type: DataTypes.STRING(30), allowNull: false },
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  costo_unitario: DataTypes.DECIMAL(14,2),
  precio_venta: DataTypes.DECIMAL(14,2),
  costo_promedio_anterior: DataTypes.DECIMAL(14,4),
  costo_promedio_nuevo: DataTypes.DECIMAL(14,4),
  stock_anterior: { type: DataTypes.INTEGER, allowNull: false },
  stock_nuevo: { type: DataTypes.INTEGER, allowNull: false },
  referencia_id: DataTypes.INTEGER,
  referencia_tipo: DataTypes.STRING(50),
  referencia_codigo: DataTypes.STRING(50),
  usuario_id: DataTypes.INTEGER,
  usuario_nombre: DataTypes.STRING(150),
  fecha_operacion: { type: DataTypes.DATE, allowNull: false },
  operacion_id: { type: DataTypes.STRING(100), allowNull: false },
  idempotency_key: { type: DataTypes.STRING(180), allowNull: false, unique: true },
  movimiento_revertido_id: DataTypes.INTEGER,
  motivo: DataTypes.STRING(150),
  observacion: DataTypes.TEXT,
  trace_id: DataTypes.STRING(100),
  created_at: DataTypes.DATE,
}, { tableName: 'movimientos_stock', ...common });

export { Proveedor, Producto, CatalogoItem, Ingreso, DetalleIngreso, Egreso, DetalleEgreso, MovimientoStock };
