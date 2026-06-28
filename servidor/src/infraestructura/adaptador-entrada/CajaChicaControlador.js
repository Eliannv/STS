// src/infraestructura/adaptador-entrada/CajaChicaControlador.js
import CajaChicaEntradaPuerto from '../../aplicacion/puertos/entrada/CajaChicaEntradaPuerto.js';
import { CajaChicaDTO, MovimientoCajaChicaDTO } from '../../aplicacion/dto/CajaChicaDTO.js';

export default class CajaChicaControlador extends CajaChicaEntradaPuerto {
    constructor(commandUC, queryUC, cajaBancoCommandUC, cajaBancoQueryUC) {
        super();
        this.commandUC = commandUC;
        this.queryUC = queryUC;
        this.cajaBancoCommandUC = cajaBancoCommandUC;
        this.cajaBancoQueryUC = cajaBancoQueryUC;
    }

    async abrir(req, res) {
        const datos = {...req.body, usuarioId: req.usuario.id };
        const respuesta = await this.commandUC.abrir(datos);
        return res.status(respuesta.estado === 'ok' ? 201 : 400).json({...respuesta, traceId: req.traceId });
    }

    async cerrar(req, res) {
        console.log('📥 Request cerrar Caja Chica recibido:');
        console.log('  - req.body:', req.body);
        console.log('  - req.usuario:', req.usuario);

        const datos = {
            ...req.body,
            // Aceptar tanto "id" como "cajaChicaId"
            id: req.body.id ? req.body.id : req.body.cajaChicaId,
            usuarioId: req.usuario ? req.usuario.id : null,
            cerradoPorId: req.usuario ? req.usuario.id : null,
            cerradoPorNombre: req.usuario ? req.usuario.nombre : null,
        };
        console.log('📝 Datos enviados al commandUC.cerrar():', datos);

        const respuesta = await this.commandUC.cerrar(datos);
        console.log('📤 Respuesta del commandUC.cerrar():', respuesta);

        // Si el cierre fue exitoso, transferir el monto a Caja Banco
        if (respuesta.estado === 'ok') {
            console.log('✅ Caja Chica cerrada:', respuesta.resultado);

            if (respuesta.resultado.monto_actual > 0 && this.cajaBancoCommandUC && this.cajaBancoQueryUC) {
                try {
                    const cajaChicaCerrada = respuesta.resultado;
                    const montoTransferencia = parseFloat(cajaChicaCerrada.monto_actual || 0);

                    console.log('🔵 Buscando Caja Banco abierta...');
                    // Buscar caja banco abierta
                    const cajaRes = await this.cajaBancoQueryUC.cajaAbierta();
                    console.log('📦 Respuesta cajaAbierta:', cajaRes);

                    if (cajaRes.estado === 'ok' && cajaRes.resultado.id) {
                        console.log('✅ Caja Banco encontrada, registrando movimiento...');
                        const movRes = await this.cajaBancoCommandUC.registrarMovimiento({
                            cajaBancoId: cajaRes.resultado.id,
                            tipo: 'INGRESO',
                            categoria: 'CIERRE_CAJA_CHICA',
                            descripcion: `Cierre Caja Chica #${cajaChicaCerrada.id}`,
                            monto: montoTransferencia,
                            usuarioId: req.usuario ? req.usuario.id : null,
                            usuarioNombre: req.usuario ? req.usuario.nombre : null,
                            referencia: `CC-${cajaChicaCerrada.id}`,
                        });
                        console.log('📤 Respuesta registrarMovimiento:', movRes);
                        if (movRes.estado !== 'ok') {
                            console.warn('⚠️ Caja banco movimiento falló al cerrar Caja Chica:', movRes.resultado);
                        } else {
                            console.log('✅ Cierre de Caja Chica registrado en Caja Banco: $' + montoTransferencia);
                        }
                    } else {
                        console.warn('⚠️ No hay caja banco abierta — cierre de caja chica no registrado en banco');
                    }
                } catch (e) {
                    console.error('❌ Error registrando cierre de caja chica en caja banco:', e.message);
                }
            } else {
                console.log('⚠️ No se transferirá a Caja Banco:');
                console.log('  - monto_actual:', respuesta.resultado.monto_actual);
                console.log('  - cajaBancoCommandUC:', !!this.cajaBancoCommandUC);
                console.log('  - cajaBancoQueryUC:', !!this.cajaBancoQueryUC);
            }
        }

        return res.status(respuesta.estado === 'ok' ? 200 : 400).json({...respuesta, traceId: req.traceId });
    }

    async lista(req, res) {
        const filtros = {
            estado: req.query.estado,
            fechaDesde: req.query.fechaDesde,
            fechaHasta: req.query.fechaHasta,
            limit: parseInt(req.query.limit) || 20,
            offset: parseInt(req.query.offset) || 0,
        };
        const respuesta = await this.queryUC.lista(filtros);
        return res.status(respuesta.estado === 'ok' ? 200 : 400).json({...respuesta, traceId: req.traceId });
    }

    async buscarPorId(req, res) {
        const respuesta = await this.queryUC.buscarPorId(req.params.id);
        return res.status(respuesta.estado === 'ok' ? 200 : 404).json({...respuesta, traceId: req.traceId });
    }

    async cajaAbierta(req, res) {
        const respuesta = await this.queryUC.cajaAbierta();
        return res.status(200).json({...respuesta, traceId: req.traceId });
    }

    async registrarMovimiento(req, res) {
        const datos = {...req.body, usuarioId: req.usuario.id };
        const respuesta = await this.commandUC.registrarMovimiento(datos);
        return res.status(respuesta.estado === 'ok' ? 201 : 400).json({...respuesta, traceId: req.traceId });
    }

    async listarMovimientos(req, res) {
        const respuesta = await this.queryUC.listarMovimientos(req.params.id);
        return res.status(200).json({...respuesta, traceId: req.traceId });
    }

    async eliminarMovimiento(req, res) {
        const movimientoId = req.body.movimientoId || req.params.id;
        const respuesta = await this.commandUC.eliminarMovimiento(movimientoId);
        return res.status(respuesta.estado === 'ok' ? 200 : 400).json({...respuesta, traceId: req.traceId });
    }
}