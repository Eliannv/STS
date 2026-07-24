// facturacion-servicio/src/infraestructura/adaptador-salida/ReporteInternoPgsQueryAdaptador.js
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

const agregarRango = (condiciones, replacements, campo, filtros) => {
  if (filtros.fechaDesde) {
    condiciones.push(`${campo} >= :fechaDesde`);
    replacements.fechaDesde = filtros.fechaDesde;
  }
  if (filtros.fechaHasta) {
    condiciones.push(`${campo} <= :fechaHasta`);
    replacements.fechaHasta = filtros.fechaHasta;
  }
};

const respuestaPaginada = (items, page, limit) => ({
  items: items.map(({ total_rows: totalRowsIgnorado, ...item }) => item),
  totalRows: Number(items[0]?.total_rows ?? 0),
  pagination: {
    page,
    pageSize: limit,
    totalRows: Number(items[0]?.total_rows ?? 0),
  },
});

export default class ReporteInternoPgsQueryAdaptador
  extends ReporteInternoSalidaQueryPuerto {
  async ventas(filtros = {}) {
    const { page, limit, offset } = paginar(filtros);
    const condiciones = ['f.deleted_at IS NULL'];
    const replacements = { limit, offset };
    agregarRango(condiciones, replacements, 'f.fecha', filtros);

    const filtrosSimples = [
      ['sucursalId', 'f.sucursal_id', 'sucursalId'],
      ['usuarioId', 'f.usuario_id', 'usuarioId'],
      ['metodoPago', 'f.metodo_pago', 'metodoPago'],
      ['tipoVenta', 'f.tipo_venta', 'tipoVenta'],
    ];
    filtrosSimples.forEach(([entrada, columna, reemplazo]) => {
      if (filtros[entrada] !== undefined && filtros[entrada] !== '') {
        condiciones.push(`${columna} = :${reemplazo}`);
        replacements[reemplazo] = filtros[entrada];
      }
    });
    if (filtros.estado) {
      condiciones.push('f.estado_pago = :estado');
      replacements.estado = filtros.estado;
    } else {
      condiciones.push("f.estado_pago <> 'ANULADA'");
    }

    const where = condiciones.join(' AND ');
    const items = await sequelize.query(
      `
        WITH cobros AS (
          SELECT
            factura_id,
            COALESCE(SUM(monto_cobrado) FILTER (
              WHERE tipo IN (
                'VENTA_EFECTIVO','VENTA_TRANSFERENCIA','VENTA_MIXTA',
                'COBRO_EFECTIVO','COBRO_TRANSFERENCIA'
              )
            ), 0)::NUMERIC(14,2) AS total_cobrado,
            GREATEST(
              COALESCE(SUM(monto_credito) FILTER (
                WHERE tipo IN ('VENTA_CREDITO','VENTA_MIXTA')
              ), 0)
              - COALESCE(SUM(monto_cobrado) FILTER (
                WHERE tipo IN ('COBRO_EFECTIVO','COBRO_TRANSFERENCIA')
              ), 0),
              0
            )::NUMERIC(14,2) AS saldo_credito
          FROM operaciones_financieras
          WHERE estado = 'APLICADO'
          GROUP BY factura_id
        )
        SELECT
          f.id,
          f.id_personalizado,
          f.cliente_id,
          f.cliente_nombre AS cliente,
          f.fecha,
          f.metodo_pago,
          f.tipo_venta,
          f.subtotal,
          f.iva,
          f.total,
          f.usuario_id,
          f.sucursal_id,
          f.estado_pago AS estado,
          COALESCE(c.total_cobrado, 0)::NUMERIC(14,2) AS total_cobrado,
          COALESCE(c.saldo_credito, 0)::NUMERIC(14,2) AS saldo_credito,
          COUNT(*) OVER() AS total_rows
        FROM facturas f
        LEFT JOIN cobros c ON c.factura_id = f.id
        WHERE ${where}
        ORDER BY f.fecha DESC, f.id DESC
        LIMIT :limit OFFSET :offset
      `,
      { replacements, type: QueryTypes.SELECT },
    );
    const [summary] = await sequelize.query(
      `
        WITH cobros AS (
          SELECT
            factura_id,
            COALESCE(SUM(monto_cobrado) FILTER (
              WHERE tipo IN (
                'VENTA_EFECTIVO','VENTA_TRANSFERENCIA','VENTA_MIXTA',
                'COBRO_EFECTIVO','COBRO_TRANSFERENCIA'
              )
            ), 0)::NUMERIC(14,2) AS total_cobrado,
            GREATEST(
              COALESCE(SUM(monto_credito) FILTER (
                WHERE tipo IN ('VENTA_CREDITO','VENTA_MIXTA')
              ), 0)
              - COALESCE(SUM(monto_cobrado) FILTER (
                WHERE tipo IN ('COBRO_EFECTIVO','COBRO_TRANSFERENCIA')
              ), 0),
              0
            )::NUMERIC(14,2) AS saldo_credito
          FROM operaciones_financieras
          WHERE estado = 'APLICADO'
          GROUP BY factura_id
        )
        SELECT
          COALESCE(SUM(f.total), 0)::NUMERIC(14,2) AS total_ventas,
          COUNT(*)::INTEGER AS total_facturas,
          COALESCE(SUM(c.total_cobrado), 0)::NUMERIC(14,2) AS total_cobrado,
          COALESCE(SUM(c.saldo_credito), 0)::NUMERIC(14,2) AS total_pendiente
        FROM facturas f
        LEFT JOIN cobros c ON c.factura_id = f.id
        WHERE ${where}
      `,
      { replacements, type: QueryTypes.SELECT },
    );
    return { ...respuestaPaginada(items, page, limit), summary };
  }

  async ventasHoy() {
    const [resultado] = await sequelize.query(
      `
        WITH cobros AS (
          SELECT
            factura_id,
            COALESCE(SUM(monto_cobrado) FILTER (
              WHERE tipo IN (
                'VENTA_EFECTIVO','VENTA_TRANSFERENCIA','VENTA_MIXTA',
                'COBRO_EFECTIVO','COBRO_TRANSFERENCIA'
              )
            ), 0)::NUMERIC(14,2) AS total_cobrado,
            GREATEST(
              COALESCE(SUM(monto_credito) FILTER (
                WHERE tipo IN ('VENTA_CREDITO','VENTA_MIXTA')
              ), 0)
              - COALESCE(SUM(monto_cobrado) FILTER (
                WHERE tipo IN ('COBRO_EFECTIVO','COBRO_TRANSFERENCIA')
              ), 0),
              0
            )::NUMERIC(14,2) AS saldo_credito
          FROM operaciones_financieras
          WHERE estado = 'APLICADO'
          GROUP BY factura_id
        )
        SELECT
          COALESCE(SUM(f.total), 0)::NUMERIC(14,2) AS total,
          COALESCE(SUM(c.total_cobrado), 0)::NUMERIC(14,2) AS total_cobrado,
          COALESCE(SUM(c.saldo_credito), 0)::NUMERIC(14,2) AS total_pendiente,
          COUNT(*)::INTEGER AS cantidad
        FROM facturas f
        LEFT JOIN cobros c ON c.factura_id = f.id
        WHERE f.deleted_at IS NULL
          AND f.estado_pago <> 'ANULADA'
          AND (f.fecha AT TIME ZONE 'America/Bogota')::DATE
            = (NOW() AT TIME ZONE 'America/Bogota')::DATE
      `,
      { type: QueryTypes.SELECT },
    );
    return resultado;
  }

  async cobros(filtros = {}) {
    const { page, limit, offset } = paginar(filtros);
    const condiciones = [
      "op.estado = 'APLICADO'",
      "op.tipo IN ('COBRO_EFECTIVO','COBRO_TRANSFERENCIA')",
    ];
    const replacements = { limit, offset };
    agregarRango(condiciones, replacements, 'op.aplicado_en', filtros);
    if (filtros.metodoPago) {
      condiciones.push('op.metodo_cobro = :metodoPago');
      replacements.metodoPago = filtros.metodoPago;
    }
    if (filtros.usuarioId) {
      condiciones.push('op.usuario_id = :usuarioId');
      replacements.usuarioId = filtros.usuarioId;
    }
    const items = await sequelize.query(
      `
        SELECT
          op.operacion_id,
          op.aplicado_en AS fecha,
          op.metodo_cobro AS metodo_pago,
          op.monto_cobrado AS monto,
          op.cuenta_cobrar_id,
          f.id AS factura_id,
          f.id_personalizado AS factura_ref,
          f.cliente_id,
          f.cliente_nombre,
          op.usuario_id,
          COUNT(*) OVER() AS total_rows
        FROM operaciones_financieras op
        JOIN facturas f ON f.id = op.factura_id
        WHERE ${condiciones.join(' AND ')}
        ORDER BY op.aplicado_en DESC, op.id DESC
        LIMIT :limit OFFSET :offset
      `,
      { replacements, type: QueryTypes.SELECT },
    );
    const [summary] = await sequelize.query(
      `
        SELECT
          COALESCE(SUM(op.monto_cobrado), 0)::NUMERIC(14,2) AS total_cobrado,
          COUNT(*)::INTEGER AS cantidad_cobros,
          COUNT(DISTINCT f.cliente_id)::INTEGER AS clientes_unicos
        FROM operaciones_financieras op
        JOIN facturas f ON f.id = op.factura_id
        WHERE ${condiciones.join(' AND ')}
      `,
      { replacements, type: QueryTypes.SELECT },
    );
    return { ...respuestaPaginada(items, page, limit), summary };
  }

  async tarjetas(filtros = {}) {
    const { page, limit, offset } = paginar(filtros);
    const condiciones = ['1 = 1'];
    const replacements = { limit, offset };
    agregarRango(condiciones, replacements, 'vt.fecha_venta', filtros);
    if (filtros.estado) {
      const estados = String(filtros.estado).split(',').filter(Boolean);
      condiciones.push('vt.estado IN (:estados)');
      replacements.estados = estados;
    }
    if (filtros.banco) {
      condiciones.push('vt.banco = :banco');
      replacements.banco = filtros.banco;
    }
    if (filtros.cuentaBancoId) {
      condiciones.push('vt.cuenta_banco_id = :cuentaBancoId');
      replacements.cuentaBancoId = filtros.cuentaBancoId;
    }
    const ventas = await sequelize.query(
      `
        SELECT vt.*, COUNT(*) OVER() AS total_rows
        FROM ventas_tarjeta vt
        WHERE ${condiciones.join(' AND ')}
        ORDER BY vt.fecha_venta DESC, vt.id DESC
        LIMIT :limit OFFSET :offset
      `,
      { replacements, type: QueryTypes.SELECT },
    );
    const ids = ventas.map((venta) => venta.id);
    const abonos = ids.length
      ? await sequelize.query(
        `
          SELECT *
          FROM abonos_ventas_tarjeta
          WHERE venta_tarjeta_id IN (:ids)
          ORDER BY fecha_acreditacion DESC NULLS LAST, id DESC
        `,
        { replacements: { ids }, type: QueryTypes.SELECT },
      )
      : [];
    const porVenta = new Map();
    abonos.forEach((abono) => {
      const lista = porVenta.get(abono.venta_tarjeta_id) ?? [];
      lista.push(abono);
      porVenta.set(abono.venta_tarjeta_id, lista);
    });
    const pagina = respuestaPaginada(ventas, page, limit);
    pagina.items = pagina.items.map((venta) => ({
      ...venta,
      factura_codigo: venta.factura_id_personalizado,
      fecha: venta.fecha_venta,
      abonos: porVenta.get(venta.id) ?? [],
    }));
    const condicionesAbono = ["a.estado = 'APLICADO'"];
    if (filtros.fechaDesde) {
      condicionesAbono.push('a.fecha_acreditacion >= :fechaDesde');
    }
    if (filtros.fechaHasta) {
      condicionesAbono.push('a.fecha_acreditacion <= :fechaHasta');
    }
    const [summary] = await sequelize.query(
      `
        WITH ventas_filtradas AS (
          SELECT vt.id, vt.monto_total
          FROM ventas_tarjeta vt
          WHERE ${condiciones.join(' AND ')}
        ),
        acreditado_total AS (
          SELECT
            a.venta_tarjeta_id,
            COALESCE(SUM(a.monto_bruto) FILTER (
              WHERE a.estado = 'APLICADO'
            ), 0) AS monto_bruto
          FROM abonos_ventas_tarjeta a
          JOIN ventas_filtradas vf ON vf.id = a.venta_tarjeta_id
          GROUP BY a.venta_tarjeta_id
        )
        SELECT
          COUNT(*) FILTER (
            WHERE GREATEST(
              vf.monto_total - COALESCE(at.monto_bruto, 0),
              0
            ) > 0
          )::INTEGER AS pendientes_cantidad,
          COALESCE(SUM(GREATEST(
            vf.monto_total - COALESCE(at.monto_bruto, 0),
            0
          )), 0)::NUMERIC(14,2) AS pendientes_monto,
          (
            SELECT COUNT(*)::INTEGER
            FROM abonos_ventas_tarjeta a
            JOIN ventas_filtradas vf2 ON vf2.id = a.venta_tarjeta_id
            WHERE ${condicionesAbono.join(' AND ')}
          ) AS acreditadas_cantidad,
          (
            SELECT COALESCE(SUM(a.monto_bruto), 0)::NUMERIC(14,2)
            FROM abonos_ventas_tarjeta a
            JOIN ventas_filtradas vf2 ON vf2.id = a.venta_tarjeta_id
            WHERE ${condicionesAbono.join(' AND ')}
          ) AS acreditadas_monto_bruto,
          (
            SELECT COALESCE(SUM(a.comision), 0)::NUMERIC(14,2)
            FROM abonos_ventas_tarjeta a
            JOIN ventas_filtradas vf2 ON vf2.id = a.venta_tarjeta_id
            WHERE ${condicionesAbono.join(' AND ')}
          ) AS total_comisiones,
          (
            SELECT COALESCE(SUM(a.monto_neto), 0)::NUMERIC(14,2)
            FROM abonos_ventas_tarjeta a
            JOIN ventas_filtradas vf2 ON vf2.id = a.venta_tarjeta_id
            WHERE ${condicionesAbono.join(' AND ')}
          ) AS total_monto_neto
        FROM ventas_filtradas vf
        LEFT JOIN acreditado_total at ON at.venta_tarjeta_id = vf.id
      `,
      { replacements, type: QueryTypes.SELECT },
    );
    pagina.summary = summary;
    return pagina;
  }

  dashboardSnapshot() {
    return this.ventasHoy();
  }
}
