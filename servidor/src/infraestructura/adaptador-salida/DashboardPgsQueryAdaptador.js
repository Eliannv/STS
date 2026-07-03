// src/infraestructura/adaptador-salida/DashboardPgsQueryAdaptador.js
import pool from '../base-dato/Postgresql.js';

/**
 * Una sola consulta paralela que agrega todos los KPIs necesarios para el Dashboard.
 * Evita múltiples round-trips al servidor.
 */
export default class DashboardPgsQueryAdaptador {

    async resumen() {
        try {
            const [
                { rows: [ventas] },
                { rows: [clientes] },
                { rows: [deudas] },
                { rows: [ingresos] },
                { rows: [productos] },
                { rows: [cajaChicaAbierta] },
                { rows: [cajaChicaStats] },
                { rows: [cajaBancoAbierta] },
                { rows: [cajaBancoStats] },
                { rows: ventasRecientes },
            ] = await Promise.all([

                // ── Ventas del mes actual ──────────────────────────────────────────
                pool.query(`
          SELECT
            COUNT(*)::int                          AS total_ventas_mes,
            COALESCE(SUM(total),   0)::float       AS monto_total_mes,
            COALESCE(SUM(abonado), 0)::float       AS monto_abonado_mes,
            COUNT(CASE WHEN estado_pago = 'PENDIENTE' THEN 1 END)::int AS ventas_pendientes
          FROM facturas
          WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
            AND EXTRACT(YEAR  FROM created_at) = EXTRACT(YEAR  FROM NOW())
            AND deleted_at IS NULL
        `),

                // ── Clientes activos + nuevos este mes ────────────────────────────
                pool.query(`
          SELECT
            COUNT(*)::int AS total_activos,
            COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
                        AND EXTRACT(YEAR  FROM created_at) = EXTRACT(YEAR  FROM NOW())
                       THEN 1 END)::int AS nuevos_mes
          FROM clientes
          WHERE activo = true
        `),

                // ── Deudas pendientes ─────────────────────────────────────────────
                pool.query(`
          SELECT
            COUNT(*)::int                        AS facturas_con_deuda,
            COALESCE(SUM(saldo_pendiente), 0)::float AS total_deuda
          FROM facturas
          WHERE saldo_pendiente > 0.01
            AND estado_pago <> 'PAGADA'
            AND deleted_at IS NULL
        `),

                // ── Ingresos del mes ──────────────────────────────────────────────
                pool.query(`
          SELECT
            COUNT(*)::int                    AS total_ingresos_mes,
            COALESCE(SUM(total), 0)::float   AS monto_ingresos_mes,
            COUNT(CASE WHEN estado = 'BORRADOR' THEN 1 END)::int AS borradores
          FROM ingresos
          WHERE EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM NOW())
            AND EXTRACT(YEAR  FROM fecha) = EXTRACT(YEAR  FROM NOW())
        `),

                // ── Productos activos / con stock ─────────────────────────────────
                pool.query(`
          SELECT
            COUNT(*)::int AS total_activos,
            COUNT(CASE WHEN stock > 0 THEN 1 END)::int    AS con_stock,
            COUNT(CASE WHEN stock = 0 THEN 1 END)::int    AS sin_stock
          FROM productos
          WHERE activo = true
        `),

                // ── Caja Chica: datos de la caja abierta ───────────────────────────────────────────────
                pool.query(`
          SELECT id, monto_actual::float, monto_inicial::float, fecha
          FROM cajas_chicas
          WHERE estado = 'ABIERTA' AND activo = true
          ORDER BY created_at DESC LIMIT 1
        `),

                // ── Caja Chica: estadísticas de movimientos del mes ──────────────────────
                pool.query(`
          SELECT
            COUNT(*)::int                                                         AS total_movimientos,
            COALESCE(SUM(CASE WHEN tipo = 'INGRESO' THEN monto ELSE 0 END), 0)::float AS total_ingresos,
            COALESCE(SUM(CASE WHEN tipo = 'EGRESO'  THEN monto ELSE 0 END), 0)::float AS total_egresos
          FROM movimientos_cajas_chicas
          WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
            AND EXTRACT(YEAR  FROM created_at) = EXTRACT(YEAR  FROM NOW())
        `),

                // ── Caja Banco: datos de la caja abierta ─────────────────────────────────────────────
                pool.query(`
          SELECT id, saldo_actual::float, saldo_inicial::float, fecha
          FROM cajas_banco
          WHERE estado = 'ABIERTA' AND activo = true
          ORDER BY created_at DESC LIMIT 1
        `),

                // ── Caja Banco: estadísticas de movimientos del mes ───────────────────────
                pool.query(`
          SELECT
            COUNT(*)::int                                                         AS total_movimientos,
            COALESCE(SUM(CASE WHEN tipo = 'INGRESO' THEN monto ELSE 0 END), 0)::float AS total_ingresos,
            COALESCE(SUM(CASE WHEN tipo = 'EGRESO'  THEN monto ELSE 0 END), 0)::float AS total_egresos
          FROM movimientos_cajas_banco
          WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
            AND EXTRACT(YEAR  FROM created_at) = EXTRACT(YEAR  FROM NOW())
        `),

                // ── Últimas 5 ventas ──────────────────────────────────────────────
                pool.query(`
          SELECT
            f.id, f.id_personalizado,
            c.nombres || ' ' || c.apellidos AS cliente_nombre,
            f.total::float, f.estado_pago, f.tipo_venta,
            f.created_at
          FROM facturas f
          JOIN clientes c ON c.id = f.cliente_id
          WHERE f.deleted_at IS NULL
          ORDER BY f.created_at DESC
          LIMIT 5
        `),
            ]);

            return {
                estado: 'ok',
                resultado: {
                    ventas: {
                        totalVentasMes: ventas.total_ventas_mes ? ventas.total_ventas_mes : 0,
                        montoTotalMes: ventas.monto_total_mes ? ventas.monto_total_mes : 0,
                        montoAbonadoMes: ventas.monto_abonado_mes ? ventas.monto_abonado_mes : 0,
                        ventasPendientes: ventas.ventas_pendientes ? ventas.ventas_pendientes : 0,
                    },
                    clientes: {
                        totalActivos: clientes.total_activos ? clientes.total_activos : 0,
                        nuevosMes: clientes.nuevos_mes ? clientes.nuevos_mes : 0,
                    },
                    deudas: {
                        facturasConDeuda: deudas.facturas_con_deuda ? deudas.facturas_con_deuda : 0,
                        totalDeuda: deudas.total_deuda ? deudas.total_deuda : 0,
                    },
                    ingresos: {
                        totalIngresosMes: ingresos.total_ingresos_mes ? ingresos.total_ingresos_mes : 0,
                        montoIngresosMes: ingresos.monto_ingresos_mes ? ingresos.monto_ingresos_mes : 0,
                        borradores: ingresos.borradores ? ingresos.borradores : 0,
                    },
                    productos: {
                        totalActivos: productos.total_activos ? productos.total_activos : 0,
                        conStock: productos.con_stock ? productos.con_stock : 0,
                        sinStock: productos.sin_stock ? productos.sin_stock : 0,
                    },
                    cajaChica: cajaChicaAbierta ? {
                        id: cajaChicaAbierta.id,
                        montoActual: cajaChicaAbierta.monto_actual,
                        montoInicial: cajaChicaAbierta.monto_inicial,
                        fecha: cajaChicaAbierta.fecha,
                        abierta: true,
                    } : null,
                    cajaChicaStats: {
                        totalMovimientos: parseInt(cajaChicaStats.total_movimientos ? cajaChicaStats.total_movimientos : 0),
                        totalIngresos: parseFloat(cajaChicaStats.total_ingresos ? cajaChicaStats.total_ingresos : 0),
                        totalEgresos: parseFloat(cajaChicaStats.total_egresos ? cajaChicaStats.total_egresos : 0),
                    },
                    cajaBanco: cajaBancoAbierta ? {
                        id: cajaBancoAbierta.id,
                        saldoActual: cajaBancoAbierta.saldo_actual,
                        saldoInicial: cajaBancoAbierta.saldo_inicial,
                        fecha: cajaBancoAbierta.fecha,
                        abierta: true,
                    } : null,
                    cajaBancoStats: {
                        totalMovimientos: parseInt(cajaBancoStats.total_movimientos ? cajaBancoStats.total_movimientos : 0),
                        totalIngresos: parseFloat(cajaBancoStats.total_ingresos ? cajaBancoStats.total_ingresos : 0),
                        totalEgresos: parseFloat(cajaBancoStats.total_egresos ? cajaBancoStats.total_egresos : 0),
                    },
                    ventasRecientes,
                },
            };
        } catch (err) {
            console.error('Error dashboard resumen:', err.message);
            return { estado: 'error', resultado: 'Error al cargar el dashboard' };
        }
    }
}