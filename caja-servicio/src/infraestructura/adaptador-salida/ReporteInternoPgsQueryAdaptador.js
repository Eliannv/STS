// caja-servicio/src/infraestructura/adaptador-salida/ReporteInternoPgsQueryAdaptador.js
import { QueryTypes } from 'sequelize';
import ReporteInternoSalidaQueryPuerto from '../../aplicacion/puertos/salida/ReporteInternoSalidaQueryPuerto.js';
import sequelize from '../base-dato/Postgresql.js';

const UNION_MOVIMIENTOS = `
  SELECT
    'BANCO'::TEXT AS caja_tipo,
    mb.id,
    mb.caja_banco_id AS caja_id,
    mb.fecha,
    mb.fecha_operacion,
    mb.tipo::TEXT,
    mb.categoria::TEXT,
    mb.origen::TEXT,
    mb.monto,
    mb.saldo_anterior,
    mb.saldo_nuevo,
    mb.descripcion,
    mb.referencia_tipo,
    mb.referencia_id,
    mb.referencia_codigo,
    mb.operacion_id,
    mb.afecta_flujo_operativo,
    mb.usuario_id,
    mb.usuario_nombre
  FROM movimientos_cajas_banco mb
  UNION ALL
  SELECT
    'CHICA'::TEXT AS caja_tipo,
    mc.id,
    mc.caja_chica_id AS caja_id,
    mc.fecha,
    mc.fecha_operacion,
    mc.tipo::TEXT,
    mc.categoria::TEXT,
    mc.origen::TEXT,
    mc.monto,
    mc.saldo_anterior,
    mc.saldo_nuevo,
    mc.descripcion,
    mc.referencia_tipo,
    mc.referencia_id,
    mc.referencia_codigo,
    mc.operacion_id,
    mc.afecta_flujo_operativo,
    mc.usuario_id,
    mc.usuario_nombre
  FROM movimientos_cajas_chicas mc
`;

const paginar = (filtros = {}) => {
  const page = Math.max(0, Number.parseInt(filtros.page, 10) || 0);
  const limit = Math.min(
    500,
    Math.max(1, Number.parseInt(filtros.limit, 10) || 50),
  );
  return { page, limit, offset: page * limit };
};

const filtrosMovimientos = (filtros = {}) => {
  const condiciones = ['1 = 1'];
  const replacements = {};
  const simples = [
    ['cajaId', 'm.caja_id', 'cajaId'],
    ['cajaTipo', 'm.caja_tipo', 'cajaTipo'],
    ['tipo', 'm.tipo', 'tipo'],
    ['categoria', 'm.categoria', 'categoria'],
    ['origen', 'm.origen', 'origen'],
  ];
  simples.forEach(([entrada, columna, reemplazo]) => {
    if (filtros[entrada] !== undefined && filtros[entrada] !== '') {
      condiciones.push(`${columna} = :${reemplazo}`);
      replacements[reemplazo] = filtros[entrada];
    }
  });
  if (
    filtros.afectaFlujoOperativo !== undefined
    && filtros.afectaFlujoOperativo !== ''
  ) {
    condiciones.push('m.afecta_flujo_operativo = :afectaFlujoOperativo');
    replacements.afectaFlujoOperativo =
      String(filtros.afectaFlujoOperativo).toLowerCase() === 'true';
  }
  if (filtros.categorias) {
    condiciones.push('m.categoria IN (:categorias)');
    replacements.categorias = String(filtros.categorias)
      .split(',')
      .filter(Boolean);
  }
  if (filtros.fechaDesde) {
    condiciones.push('m.fecha_operacion >= :fechaDesde');
    replacements.fechaDesde = filtros.fechaDesde;
  }
  if (filtros.fechaHasta) {
    condiciones.push('m.fecha_operacion <= :fechaHasta');
    replacements.fechaHasta = filtros.fechaHasta;
  }
  return { condiciones, replacements };
};

const filtrosCuenta = (tipo, filtros = {}) => {
  const condiciones = ['c.tipo = :tipo'];
  const replacements = { tipo };
  const terceroId = tipo === 'COBRAR'
    ? filtros.clienteId
    : filtros.proveedorId;
  if (terceroId) {
    condiciones.push('c.tercero_id = :terceroId');
    replacements.terceroId = terceroId;
  }
  if (filtros.tipo && tipo === 'PAGAR') {
    condiciones.push('c.tipo_cuenta_por_pagar = :tipoCuenta');
    replacements.tipoCuenta = filtros.tipo;
  }
  if (filtros.estado) {
    const estados = String(filtros.estado).split(',').filter(Boolean);
    if (estados.includes('VENCIDA')) {
      condiciones.push(`(
        c.estado IN (:estados)
        OR (
          c.estado IN ('PENDIENTE','PARCIAL')
          AND c.fecha_vencimiento < (NOW() AT TIME ZONE 'America/Bogota')::DATE
        )
      )`);
    } else {
      condiciones.push('c.estado IN (:estados)');
    }
    replacements.estados = estados;
  }
  if (filtros.fechaDesde) {
    condiciones.push('c.fecha_emision >= (:fechaDesde)::DATE');
    replacements.fechaDesde = filtros.fechaDesde;
  }
  if (filtros.fechaHasta) {
    condiciones.push('c.fecha_emision <= (:fechaHasta)::DATE');
    replacements.fechaHasta = filtros.fechaHasta;
  }
  if (String(filtros.vencidas).toLowerCase() === 'true') {
    condiciones.push(
      "c.estado IN ('PENDIENTE','PARCIAL','VENCIDA')"
      + " AND c.fecha_vencimiento < (NOW() AT TIME ZONE 'America/Bogota')::DATE",
    );
  }
  return { condiciones, replacements };
};

export default class ReporteInternoPgsQueryAdaptador
  extends ReporteInternoSalidaQueryPuerto {
  async movimientos(filtros = {}) {
    const { page, limit, offset } = paginar(filtros);
    const { condiciones, replacements } = filtrosMovimientos(filtros);
    const items = await sequelize.query(
      `
        WITH movimientos AS (${UNION_MOVIMIENTOS})
        SELECT m.*, COUNT(*) OVER() AS total_rows
        FROM movimientos m
        WHERE ${condiciones.join(' AND ')}
        ORDER BY m.fecha_operacion DESC, m.id DESC
        LIMIT :limit OFFSET :offset
      `,
      {
        replacements: { ...replacements, limit, offset },
        type: QueryTypes.SELECT,
      },
    );
    const [summary] = await sequelize.query(
      `
        WITH movimientos AS (${UNION_MOVIMIENTOS})
        SELECT
          COALESCE(SUM(m.monto), 0)::NUMERIC(14,2) AS total_monto,
          COUNT(*)::INTEGER AS cantidad
        FROM movimientos m
        WHERE ${condiciones.join(' AND ')}
      `,
      { replacements, type: QueryTypes.SELECT },
    );
    const totalRows = Number(items[0]?.total_rows ?? 0);
    return {
      items: items.map(({ total_rows: ignorado, ...item }) => item),
      summary,
      totalRows,
      pagination: { page, pageSize: limit, totalRows },
    };
  }

  async flujo(filtros = {}) {
    const { page, limit, offset } = paginar(filtros);
    const { condiciones, replacements } = filtrosMovimientos(filtros);
    const consolidado = !filtros.cajaId && !filtros.cajaTipo;
    if (consolidado) {
      condiciones.push(
        "m.categoria NOT IN ('TRANSFERENCIA_ENTRADA','TRANSFERENCIA_SALIDA')",
      );
    }
    const where = condiciones.join(' AND ');
    const items = await sequelize.query(
      `
        WITH movimientos AS (${UNION_MOVIMIENTOS}),
        filtrados AS (
          SELECT m.*
          FROM movimientos m
          WHERE ${where}
        )
        SELECT
          (fecha_operacion AT TIME ZONE 'America/Bogota')::DATE AS fecha,
          categoria,
          tipo,
          afecta_flujo_operativo,
          SUM(monto)::NUMERIC(14,2) AS monto,
          MIN(descripcion) AS descripcion,
          COUNT(*) OVER() AS total_rows
        FROM filtrados
        GROUP BY
          (fecha_operacion AT TIME ZONE 'America/Bogota')::DATE,
          categoria,
          tipo,
          afecta_flujo_operativo
        ORDER BY fecha DESC, categoria
        LIMIT :limit OFFSET :offset
      `,
      {
        replacements: { ...replacements, limit, offset },
        type: QueryTypes.SELECT,
      },
    );
    const [summary] = await sequelize.query(
      `
        WITH movimientos AS (${UNION_MOVIMIENTOS}),
        filtrados AS (
          SELECT m.*
          FROM movimientos m
          WHERE ${where}
        ),
        primeros AS (
          SELECT DISTINCT ON (caja_tipo, caja_id)
            caja_tipo, caja_id, saldo_anterior
          FROM filtrados
          ORDER BY caja_tipo, caja_id, fecha_operacion ASC, id ASC
        ),
        ultimos AS (
          SELECT DISTINCT ON (caja_tipo, caja_id)
            caja_tipo, caja_id, saldo_nuevo
          FROM filtrados
          ORDER BY caja_tipo, caja_id, fecha_operacion DESC, id DESC
        )
        SELECT
          COALESCE(SUM(monto) FILTER (
            WHERE tipo = 'INGRESO' AND afecta_flujo_operativo = TRUE
          ), 0)::NUMERIC(14,2) AS ingresos_operativos,
          COALESCE(SUM(monto) FILTER (
            WHERE tipo = 'EGRESO' AND afecta_flujo_operativo = TRUE
          ), 0)::NUMERIC(14,2) AS egresos_operativos,
          (
            COALESCE(SUM(monto) FILTER (
              WHERE tipo = 'INGRESO' AND afecta_flujo_operativo = FALSE
            ), 0)
            - COALESCE(SUM(monto) FILTER (
              WHERE tipo = 'EGRESO' AND afecta_flujo_operativo = FALSE
            ), 0)
          )::NUMERIC(14,2) AS no_operativos_neto,
          COALESCE((SELECT SUM(saldo_anterior) FROM primeros), 0)
            ::NUMERIC(14,2) AS saldo_inicial_periodo,
          COALESCE((SELECT SUM(saldo_nuevo) FROM ultimos), 0)
            ::NUMERIC(14,2) AS saldo_final_periodo
        FROM filtrados
      `,
      { replacements, type: QueryTypes.SELECT },
    );
    const totalRows = Number(items[0]?.total_rows ?? 0);
    return {
      items: items.map(({ total_rows: ignorado, ...item }) => item),
      summary,
      totalRows,
      pagination: { page, pageSize: limit, totalRows },
    };
  }

  async saldoActual() {
    const [saldos] = await sequelize.query(
      `
        SELECT
          COALESCE((
            SELECT SUM(saldo_actual)
            FROM cajas_banco
            WHERE estado = 'ABIERTA' AND activo = TRUE
          ), 0)::NUMERIC(14,2) AS saldo_banco,
          COALESCE((
            SELECT SUM(monto_actual)
            FROM cajas_chicas
            WHERE estado = 'ABIERTA' AND activo = TRUE
          ), 0)::NUMERIC(14,2) AS saldo_chica
      `,
      { type: QueryTypes.SELECT },
    );
    const [movimientos] = await sequelize.query(
      `
        WITH movimientos AS (${UNION_MOVIMIENTOS})
        SELECT
          COALESCE(SUM(monto) FILTER (
            WHERE tipo = 'INGRESO'
              AND afecta_flujo_operativo = TRUE
              AND categoria NOT IN ('TRANSFERENCIA_ENTRADA','TRANSFERENCIA_SALIDA')
          ), 0)::NUMERIC(14,2) AS ingresos_hoy,
          COALESCE(SUM(monto) FILTER (
            WHERE tipo = 'EGRESO'
              AND afecta_flujo_operativo = TRUE
              AND categoria NOT IN ('TRANSFERENCIA_ENTRADA','TRANSFERENCIA_SALIDA')
          ), 0)::NUMERIC(14,2) AS egresos_hoy
        FROM movimientos
        WHERE (fecha_operacion AT TIME ZONE 'America/Bogota')::DATE
          = (NOW() AT TIME ZONE 'America/Bogota')::DATE
      `,
      { type: QueryTypes.SELECT },
    );
    return { ...saldos, ...movimientos };
  }

  cuentasCobrar(filtros = {}) {
    return this._cuentas('COBRAR', filtros);
  }

  cuentasPagar(filtros = {}) {
    return this._cuentas('PAGAR', filtros);
  }

  async _cuentas(tipo, filtros = {}) {
    const { page, limit, offset } = paginar(filtros);
    const { condiciones, replacements } = filtrosCuenta(tipo, filtros);
    const where = condiciones.join(' AND ');
    const items = await sequelize.query(
      `
        SELECT
          c.*,
          CASE
            WHEN c.estado IN ('PENDIENTE','PARCIAL')
              AND c.fecha_vencimiento < (NOW() AT TIME ZONE 'America/Bogota')::DATE
            THEN 'VENCIDA'
            ELSE c.estado::TEXT
          END AS estado_calculado,
          COUNT(*) OVER() AS total_rows
        FROM cuentas c
        WHERE ${where}
        ORDER BY c.fecha_vencimiento ASC NULLS LAST, c.id DESC
        LIMIT :limit OFFSET :offset
      `,
      {
        replacements: { ...replacements, limit, offset },
        type: QueryTypes.SELECT,
      },
    );
    const [summary] = await sequelize.query(
      `
        SELECT
          COALESCE(SUM(c.saldo), 0)::NUMERIC(14,2) AS total_pendiente,
          COALESCE(SUM(c.saldo) FILTER (
            WHERE c.estado IN ('PENDIENTE','PARCIAL','VENCIDA')
              AND c.fecha_vencimiento < (NOW() AT TIME ZONE 'America/Bogota')::DATE
          ), 0)::NUMERIC(14,2) AS total_vencido,
          COUNT(*)::INTEGER AS cantidad
        FROM cuentas c
        WHERE ${where}
      `,
      { replacements, type: QueryTypes.SELECT },
    );
    const [terceroMayor] = await sequelize.query(
      `
        SELECT
          c.tercero_nombre,
          SUM(c.saldo)::NUMERIC(14,2) AS monto
        FROM cuentas c
        WHERE ${where}
        GROUP BY c.tercero_nombre
        ORDER BY SUM(c.saldo) DESC
        LIMIT 1
      `,
      { replacements, type: QueryTypes.SELECT },
    );
    const [vencimiento] = await sequelize.query(
      `
        SELECT MIN(c.fecha_vencimiento) AS vencimiento_proximo
        FROM cuentas c
        WHERE ${where}
          AND c.fecha_vencimiento >= (NOW() AT TIME ZONE 'America/Bogota')::DATE
      `,
      { replacements, type: QueryTypes.SELECT },
    );
    const totalRows = Number(items[0]?.total_rows ?? 0);
    return {
      items: items.map(({ total_rows: ignorado, estado_calculado, ...item }) => ({
        ...item,
        estado: estado_calculado,
      })),
      summary: {
        ...summary,
        tercero_mayor_deuda: terceroMayor ?? null,
        vencimiento_proximo: vencimiento?.vencimiento_proximo ?? null,
      },
      totalRows,
      pagination: { page, pageSize: limit, totalRows },
    };
  }
}
