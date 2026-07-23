import { Op } from 'sequelize';
import FacturaSalidaQueryPuerto from '../../aplicacion/puertos/salida/FacturaSalidaQueryPuerto.js';
import { Factura, DetalleFactura } from '../modelos/Modelos.js';

const conDetalles = async(factura) => ({...factura.toJSON(),
    detalles: await DetalleFactura.findAll({
        where: { factura_id: factura.id },
        order: [
            ['id', 'ASC']
        ]
    })
});

export default class FacturaPgsQueryAdaptador extends FacturaSalidaQueryPuerto {
    async listaPorCliente(clienteId) {
        const facturas = await Factura.findAll({
            where: { cliente_id: clienteId, deleted_at: null },
            order: [
                ['created_at', 'DESC']
            ]
        });
        return { estado: 'ok', resultado: await Promise.all(facturas.map(conDetalles)) };
    }

    async buscarPorId(id) {
        const factura = await Factura.findByPk(id);
        return factura ? { estado: 'ok', resultado: await conDetalles(factura) } : { estado: 'error', resultado: 'Factura no encontrada' };
    }

    async resumenPorCliente(clienteId) {
        const facturas = await Factura.findAll({ where: { cliente_id: clienteId, deleted_at: null } });
        const totalFacturado = facturas.reduce((sum, factura) => sum + Number(factura.total || 0), 0);
        const totalPagado = facturas.reduce((sum, factura) => sum + Number(factura.abonado || 0), 0);
        return { estado: 'ok', resultado: { total_facturado: totalFacturado, total_pagado: totalPagado, deuda_total: facturas.reduce((sum, factura) => sum + Number(factura.saldo_pendiente || 0), 0), cantidad_facturas: facturas.length, ultima_factura: facturas[0] ? created_at ? null : promedio_compra : facturas.length ? Number((totalFacturado / facturas.length).toFixed(2)) : 0 } };
    }

    async listaGeneral({ buscar, estado, tipo, fechaDesde, fechaHasta, limit = 15, offset = 0 } = {}) {
        const where = {};
        if (estado) where.estado_pago = estado;
        if (tipo) where.tipo_venta = tipo;
        if (buscar) where[Op.or] = [{
            id_personalizado: {
                [Op.iLike]: `%${buscar}%`
            }
        }, {
            cliente_nombre: {
                [Op.iLike]: `%${buscar}%`
            }
        }];
        if (fechaDesde || fechaHasta) where.created_at = {...(fechaDesde ? {
                [Op.gte]: fechaDesde
            } : {}),
            ...(fechaHasta ? {
                [Op.lte]: fechaHasta
            } : {})
        };
        const facturas = await Factura.findAll({
            where,
            order: [
                ['created_at', 'DESC']
            ],
            limit: Math.min(Number(limit) || 15, 100),
            offset: Math.max(Number(offset) || 0, 0)
        });
        return { estado: 'ok', resultado: facturas };
    }
}