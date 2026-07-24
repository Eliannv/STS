// inventario-servicio/src/infraestructura/adaptador-salida/ReporteInternoPgsQueryAdaptador.js
import { QueryTypes } from 'sequelize';
import ReporteInternoSalidaQueryPuerto from '../../aplicacion/puertos/salida/ReporteInternoSalidaQueryPuerto.js';
import sequelize from '../base-dato/Postgresql.js';

const paginar = (filtros = {}) => {
  const page = Math.max(0, Number.parseInt(filtros.page, 10) || 0);
  const limit = Math.min(
    500,
    Math.max(1, Number.parseInt(filtros.limit, 10) || 50),
  );
  return { page, limit, offset: page * limit };
};

const rango = (condiciones, replacements, campo, filtros) => {
  if (filtros.fechaDesde) {
    condiciones.push(`${campo} >= :fechaDesde`);
    replacements.fechaDesde = filtros.fechaDesde;
  }
  if (filtros.fechaHasta) {
    condiciones.push(`${campo} <= :fechaHasta`);
    replacements.fechaHasta = filtros.fechaHasta;
  }
};

const pagina = (items, page, limit) => {
  const totalRows = Number(items[0]?.total_rows ?? 0);
  return {
    items: items.map(({ total_rows: ignorado, ...item }) => item),
    totalRows,
    pagination: { page, pageSize: limit, totalRows },
  };
};

export default class ReporteInternoPgsQueryAdaptador
  extends ReporteInternoSalidaQueryPuerto {
  async kardex(filtros = {}) {
    const { page, limit, offset } = paginar(filtros);
    const condiciones = ['1 = 1'];
    const replacements = { limit, offset };
    rango(condiciones, replacements, 'm.fecha_operacion', filtros);
    if (filtros.productoId) {
      condiciones.push('m.producto_id = :productoId');
      replacements.productoId = filtros.productoId;
    }
    if (filtros.grupo) {
      condiciones.push('m.grupo_producto = :grupo');
      replacements.grupo = filtros.grupo;
    }
    if (filtros.tipo) {
      condiciones.push(`(
        m.tipo::TEXT = :tipo
        OR m.naturaleza::TEXT = :tipo
        OR m.tipo_movimiento::TEXT = :tipo
      )`);
      replacements.tipo = filtros.tipo;
    }
    const where = condiciones.join(' AND ');
    const items = await sequelize.query(
      `
        SELECT
          m.*,
          (
            m.cantidad
            * COALESCE(m.costo_promedio_nuevo, m.costo_unitario, 0)
          )::NUMERIC(14,2) AS costo_total,
          COUNT(*) OVER() AS total_rows
        FROM movimientos_stock m
        WHERE ${where}
        ORDER BY m.fecha_operacion DESC, m.id DESC
        LIMIT :limit OFFSET :offset
      `,
      { replacements, type: QueryTypes.SELECT },
    );
    const [summary] = await sequelize.query(
      `
        SELECT
          COALESCE(SUM(m.cantidad) FILTER (
            WHERE m.naturaleza = 'ENTRADA'
          ), 0)::NUMERIC(14,2) AS total_entradas,
          COALESCE(SUM(m.cantidad) FILTER (
            WHERE m.naturaleza = 'SALIDA'
          ), 0)::NUMERIC(14,2) AS total_salidas,
          COUNT(DISTINCT m.producto_id)::INTEGER AS productos_con_movimiento,
          COALESCE(SUM(
            m.cantidad
            * COALESCE(m.costo_promedio_nuevo, m.costo_unitario, 0)
          ), 0)::NUMERIC(14,2) AS costo_total_movido
        FROM movimientos_stock m
        WHERE ${where}
      `,
      { replacements, type: QueryTypes.SELECT },
    );
    return { ...pagina(items, page, limit), summary };
  }

  async compras(filtros = {}) {
    const { page, limit, offset } = paginar(filtros);
    const condiciones = ['1 = 1'];
    const replacements = { limit, offset };
    rango(condiciones, replacements, 'i.fecha', filtros);
    if (filtros.proveedorId) {
      condiciones.push('i.proveedor_id = :proveedorId');
      replacements.proveedorId = filtros.proveedorId;
    }
    if (filtros.tipoCompra) {
      condiciones.push('i.tipo_compra = :tipoCompra');
      replacements.tipoCompra = filtros.tipoCompra;
    }
    if (filtros.estado) {
      condiciones.push('i.estado = :estado');
      replacements.estado = filtros.estado;
    } else {
      condiciones.push("i.estado <> 'ANULADO'");
    }
    const where = condiciones.join(' AND ');
    const items = await sequelize.query(
      `
        SELECT
          i.*,
          COALESCE((
            SELECT SUM(di.stock_ingresado)
            FROM detalle_ingresos di
            WHERE di.ingreso_id = i.id
          ), 0)::INTEGER AS unidades,
          COUNT(*) OVER() AS total_rows
        FROM ingresos i
        WHERE ${where}
        ORDER BY i.fecha DESC, i.id DESC
        LIMIT :limit OFFSET :offset
      `,
      { replacements, type: QueryTypes.SELECT },
    );
    const [summary] = await sequelize.query(
      `
        SELECT
          COALESCE(SUM(i.total), 0)::NUMERIC(14,2) AS total_comprado,
          COALESCE(SUM(i.iva), 0)::NUMERIC(14,2) AS total_iva,
          COALESCE(SUM(i.flete), 0)::NUMERIC(14,2) AS total_flete,
          COUNT(*)::INTEGER AS cantidad_ingresos
        FROM ingresos i
        WHERE ${where}
      `,
      { replacements, type: QueryTypes.SELECT },
    );
    const [proveedorTop] = await sequelize.query(
      `
        SELECT
          COALESCE(i.proveedor_nombre, 'Sin proveedor') AS proveedor,
          SUM(i.total)::NUMERIC(14,2) AS monto
        FROM ingresos i
        WHERE ${where}
        GROUP BY COALESCE(i.proveedor_nombre, 'Sin proveedor')
        ORDER BY SUM(i.total) DESC
        LIMIT 1
      `,
      { replacements, type: QueryTypes.SELECT },
    );
    return {
      ...pagina(items, page, limit),
      summary: { ...summary, proveedor_top: proveedorTop ?? null },
    };
  }

  async alertasStock() {
    const columnas = await sequelize
      .getQueryInterface()
      .describeTable('productos');
    const umbral = columnas.stock_minimo
      ? 'COALESCE(p.stock_minimo, 5)'
      : '5';
    const items = await sequelize.query(
      `
        SELECT
          p.id,
          p.codigo,
          p.nombre,
          p.grupo,
          p.stock,
          ${umbral} AS stock_minimo,
          CASE
            WHEN p.stock = 0 THEN 'SIN_STOCK'
            ELSE 'STOCK_BAJO'
          END AS alerta
        FROM productos p
        WHERE p.activo = TRUE
          AND p.tipo_control_stock = 'NORMAL'
          AND p.stock <= ${umbral}
        ORDER BY p.stock ASC, p.nombre
      `,
      { type: QueryTypes.SELECT },
    );
    return {
      items,
      sin_stock: items.filter((item) => Number(item.stock) === 0).length,
      stock_bajo: items.filter((item) => Number(item.stock) > 0).length,
    };
  }

  async valorInventario() {
    const porGrupo = await sequelize.query(
      `
        SELECT
          COALESCE(p.grupo, 'SIN_GRUPO') AS grupo,
          COALESCE(SUM(p.stock * p.costo), 0)::NUMERIC(14,2) AS valor
        FROM productos p
        WHERE p.activo = TRUE
          AND p.tipo_control_stock = 'NORMAL'
        GROUP BY COALESCE(p.grupo, 'SIN_GRUPO')
        ORDER BY grupo
      `,
      { type: QueryTypes.SELECT },
    );
    const [total] = await sequelize.query(
      `
        SELECT
          COALESCE(SUM(p.stock * p.costo), 0)::NUMERIC(14,2) AS valor_total
        FROM productos p
        WHERE p.activo = TRUE
          AND p.tipo_control_stock = 'NORMAL'
      `,
      { type: QueryTypes.SELECT },
    );
    return { ...total, por_grupo: porGrupo };
  }
}
