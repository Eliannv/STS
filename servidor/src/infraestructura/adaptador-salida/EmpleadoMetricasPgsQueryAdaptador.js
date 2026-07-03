// src/infraestructura/adaptador-salida/EmpleadoMetricasPgsQueryAdaptador.js
import pool from '../base-dato/Postgresql.js';

/**
 * Consultas SQL para métricas de empleados.
 * Agrega datos de facturas, cobros de deuda y movimientos de caja
 * filtrados por mes/año y (opcionalmente) por usuario.
 */
export default class EmpleadoMetricasPgsQueryAdaptador {

    // ── Resumen global del período: todos los empleados ──────────────────────
    async resumenPorPeriodo(mes, anio) {
        try {
            const { rows: empleados } = await pool.query(`
        SELECT
          u.id,
          u.nombre || ' ' || u.apellido AS nombre_completo,
          u.email,
          u.rol,
          u.activo,
          -- Ventas (facturas creadas en el período)
          COALESCE(v.total_ventas,    0)::int   AS total_ventas,
          COALESCE(v.monto_total,     0)::float AS monto_total_vendido,
          COALESCE(v.monto_abonado,   0)::float AS monto_abonado,
          -- Cobros de deuda (abonos registrados en el período)
          COALESCE(c.cantidad_cobros, 0)::int   AS cantidad_cobros,
          COALESCE(c.monto_cobrado,   0)::float AS monto_cobrado
        FROM usuarios u
        LEFT JOIN (
          SELECT
            usuario_id,
            COUNT(*)         AS total_ventas,
            SUM(total)       AS monto_total,
            SUM(abonado)     AS monto_abonado
          FROM facturas
          WHERE EXTRACT(MONTH FROM created_at) = $1
            AND EXTRACT(YEAR  FROM created_at) = $2
            AND deleted_at IS NULL
          GROUP BY usuario_id
        ) v ON v.usuario_id = u.id
        LEFT JOIN (
          SELECT
            usuario_id,
            COUNT(*)           AS cantidad_cobros,
            SUM(monto_pagado)  AS monto_cobrado
          FROM facturas_deudas
          WHERE EXTRACT(MONTH FROM fecha_pago) = $1
            AND EXTRACT(YEAR  FROM fecha_pago) = $2
          GROUP BY usuario_id
        ) c ON c.usuario_id = u.id
        ORDER BY total_ventas DESC NULLS LAST, u.nombre ASC
      `, [mes, anio]);

            // Rankings
            const rankingVentas = empleados
                .filter(e => e.total_ventas > 0)
                .sort((a, b) => b.total_ventas - a.total_ventas)
                .slice(0, 3)
                .map((e, i) => ({ posicion: i + 1, empleadoNombre: e.nombre_completo, valor: e.total_ventas, textoValor: `${e.total_ventas} venta${e.total_ventas !== 1 ? 's' : ''}` }));

            const rankingMontos = empleados
                .filter(e => e.monto_total_vendido > 0)
                .sort((a, b) => b.monto_total_vendido - a.monto_total_vendido)
                .slice(0, 3)
                .map((e, i) => ({ posicion: i + 1, empleadoNombre: e.nombre_completo, valor: e.monto_total_vendido, textoValor: `$${parseFloat(e.monto_total_vendido).toFixed(2)}` }));

            return { estado: 'ok', resultado: { empleados, rankingVentas, rankingMontos } };
        } catch (err) {
            console.error('Error resumenPorPeriodo:', err.message);
            return { estado: 'error', resultado: 'Error al calcular métricas del período' };
        }
    }

    // ── Detalle completo de un empleado en un período ────────────────────────
    async detallePorEmpleado(usuarioId, mes, anio) {
        try {
            // 1. Ventas
            const { rows: [ventas] } = await pool.query(`
        SELECT
          COUNT(*)                                                AS total_ventas,
          COALESCE(SUM(total),   0)::float                       AS monto_total_vendido,
          COALESCE(SUM(abonado), 0)::float                       AS monto_abonado,
          COALESCE(AVG(total),   0)::float                       AS promedio_por_venta,
          COALESCE(AVG(abonado), 0)::float                       AS promedio_abonado
        FROM facturas
        WHERE usuario_id     = $1
          AND EXTRACT(MONTH FROM created_at) = $2
          AND EXTRACT(YEAR  FROM created_at) = $3
          AND deleted_at IS NULL
      `, [usuarioId, mes, anio]);

            // 2. Cobros de deuda
            const { rows: [cobros] } = await pool.query(`
        SELECT
          COUNT(*)::int                       AS cantidad_cobros,
          COALESCE(SUM(monto_pagado), 0)::float AS monto_cobrado
        FROM facturas_deudas
        WHERE usuario_id = $1
          AND EXTRACT(MONTH FROM fecha_pago) = $2
          AND EXTRACT(YEAR  FROM fecha_pago) = $3
      `, [usuarioId, mes, anio]);

            // 3. Movimientos caja chica registrados por el empleado
            const { rows: [cajaChica] } = await pool.query(`
        SELECT
          COUNT(*)::int                   AS cantidad,
          COALESCE(SUM(
            CASE WHEN tipo = 'INGRESO' THEN monto ELSE 0 END
          ), 0)::float AS monto_ingresado
        FROM movimientos_cajas_chicas
        WHERE usuario_id = $1
          AND EXTRACT(MONTH FROM created_at) = $2
          AND EXTRACT(YEAR  FROM created_at) = $3
      `, [usuarioId, mes, anio]);

            // 4. Movimientos caja banco registrados por el empleado
            const { rows: [cajaBanco] } = await pool.query(`
        SELECT
          COUNT(*)::int                   AS cantidad,
          COALESCE(SUM(
            CASE WHEN tipo = 'INGRESO' THEN monto ELSE 0 END
          ), 0)::float AS monto_ingresado
        FROM movimientos_cajas_banco
        WHERE usuario_id = $1
          AND EXTRACT(MONTH FROM created_at) = $2
          AND EXTRACT(YEAR  FROM created_at) = $3
      `, [usuarioId, mes, anio]);

            return {
                estado: 'ok',
                resultado: {
                    ventas: {
                        totalVentas: parseInt(ventas.total_ventas ? ventas.total_ventas : 0),
                        montoTotalVendido: parseFloat(ventas.monto_total_vendido ? ventas.monto_total_vendido : 0),
                        montoAbonado: parseFloat(ventas.monto_abonado ? ventas.monto_abonado : 0),
                        promedioPorVenta: parseFloat(ventas.promedio_por_venta ? ventas.promedio_por_venta : 0),
                        promedioAbonado: parseFloat(ventas.promedio_abonado ? ventas.promedio_abonado : 0),
                    },
                    cobros: {
                        cantidadCobros: parseInt(cobros.cantidad_cobros ? cobros.cantidad_cobros : 0),
                        montoCobrado: parseFloat(cobros.monto_cobrado ? cobros.monto_cobrado : 0),
                    },
                    cajaChica: {
                        cantidad: parseInt(cajaChica.cantidad ? cajaChica.cantidad : 0),
                        montoIngresado: parseFloat(cajaChica.monto_ingresado ? cajaChica.monto_ingresado : 0),
                    },
                    cajaBanco: {
                        cantidad: parseInt(cajaBanco.cantidad ? cajaBanco.cantidad : 0),
                        montoIngresado: parseFloat(cajaBanco.monto_ingresado ? cajaBanco.monto_ingresado : 0),
                    },
                },
            };
        } catch (err) {
            console.error('Error detallePorEmpleado:', err.message);
            return { estado: 'error', resultado: 'Error al calcular detalle del empleado' };
        }
    }

    // ── Historial mensual (últimos N meses) de un empleado ───────────────────
    async historialMensual(usuarioId, numMeses = 6) {
        try {
            const { rows } = await pool.query(`
        WITH meses AS (
          SELECT
            EXTRACT(YEAR  FROM gs)::int AS anio,
            EXTRACT(MONTH FROM gs)::int AS mes,
            TO_CHAR(gs, 'Mon YYYY')     AS mes_nombre
          FROM generate_series(
            date_trunc('month', NOW()) - ($2 - 1) * INTERVAL '1 month',
            date_trunc('month', NOW()),
            '1 month'::interval
          ) AS gs
        ),
        ventas AS (
          SELECT
            EXTRACT(YEAR  FROM created_at)::int AS anio,
            EXTRACT(MONTH FROM created_at)::int AS mes,
            COUNT(*)::int                        AS total_ventas,
            COALESCE(SUM(total),   0)::float     AS monto_total,
            COALESCE(SUM(abonado), 0)::float     AS monto_abonado
          FROM facturas
          WHERE usuario_id = $1 AND deleted_at IS NULL
          GROUP BY 1, 2
        ),
        cobros AS (
          SELECT
            EXTRACT(YEAR  FROM fecha_pago)::int AS anio,
            EXTRACT(MONTH FROM fecha_pago)::int AS mes,
            COUNT(*)::int                        AS total_cobros,
            COALESCE(SUM(monto_pagado), 0)::float AS monto_cobrado
          FROM facturas_deudas
          WHERE usuario_id = $1
          GROUP BY 1, 2
        )
        SELECT
          m.anio,
          m.mes,
          m.mes_nombre,
          COALESCE(v.total_ventas,  0) AS total_ventas,
          COALESCE(v.monto_total,   0) AS monto_total_vendido,
          COALESCE(v.monto_abonado, 0) AS monto_abonado,
          COALESCE(c.total_cobros,  0) AS total_cobros,
          COALESCE(c.monto_cobrado, 0) AS monto_cobrado
        FROM meses m
        LEFT JOIN ventas  v ON v.anio = m.anio AND v.mes = m.mes
        LEFT JOIN cobros  c ON c.anio = m.anio AND c.mes = m.mes
        ORDER BY m.anio ASC, m.mes ASC
      `, [usuarioId, numMeses]);

            return { estado: 'ok', resultado: rows };
        } catch (err) {
            console.error('Error historialMensual:', err.message);
            return { estado: 'error', resultado: 'Error al calcular historial mensual' };
        }
    }
}