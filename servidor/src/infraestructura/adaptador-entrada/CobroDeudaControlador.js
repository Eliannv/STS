// src/infraestructura/adaptador-entrada/CobroDeudaControlador.js
import CobroDeudaEntradaPuerto from '../../aplicacion/puertos/entrada/CobroDeudaEntradaPuerto.js';

/**
 * Controlador de Cobro de Deuda
 * Maneja las peticiones HTTP y orquesta los use cases
 */
export default class CobroDeudaControlador extends CobroDeudaEntradaPuerto {
  constructor(cobroDeudaCommandUC, cobroDeudaQueryUC, cajaChicaCommandUC, cajaChicaQueryUC) {
    super();
    this.commandUC         = cobroDeudaCommandUC;
    this.queryUC           = cobroDeudaQueryUC;
    this.cajaChicaCommandUC = cajaChicaCommandUC;
    this.cajaChicaQueryUC  = cajaChicaQueryUC;
  }

  /**
   * Registra un abono parcial a una factura
   * POST /cobro-deuda/registrar-abono
   */
  async registrarAbono(req, res) {
    try {
      console.log('📥 [CobroDeuda] Request registrarAbono:');
      console.log('   - montoPagado:', req.body.montoPagado);
      console.log('   - metodoPago:', req.body.metodoPago);
      console.log('   - facturaId:', req.body.facturaId);
      
      const datos = {
        ...req.body,
        usuarioId: req.usuario?.id ?? null,
        fechaPago: req.body.fechaPago || new Date().toISOString()
      };

      // Registrar el abono en la BD
      const respuesta = await this.commandUC.registrarAbono(datos);
      
      console.log('📤 [CobroDeuda] Respuesta del commandUC:', {
        estado: respuesta.estado,
        abonoId: respuesta.resultado?.id,
        montoPagado: respuesta.resultado?.monto_pagado,
      });

      if (respuesta.estado !== 'ok') {
        console.error('❌ [CobroDeuda] Error al registrar abono:', respuesta.resultado);
        return res.status(400).json({ ...respuesta, traceId: req.traceId });
      }

      const resultado = respuesta.resultado;
      const factura = resultado.factura;
      const montoPagado = parseFloat(datos.montoPagado ?? 0);

      // ── Integración con Caja Chica (efectivo del día) ──
      // El cobro de deuda en EFECTIVO va a Caja Chica, NO directamente a Caja Banco
      // Transferencias y Tarjeta van directamente a Caja Banco
      // Cuando se cierra Caja Chica, el monto se transfiere a Caja Banco
      const esEfectivo = datos.metodoPago === 'Efectivo';
      
      if (esEfectivo && this.cajaChicaCommandUC && this.cajaChicaQueryUC) {
        try {
          console.log('🔵 [CobroDeuda] Cobro en EFECTIVO - Buscando Caja Chica abierta...');
          // Buscar caja chica abierta
          const cajaChicaRes = await this.cajaChicaQueryUC.cajaAbierta();
          console.log('📦 [CobroDeuda] Respuesta cajaChicaAbierta:', cajaChicaRes);
          
          if (cajaChicaRes.estado === 'ok' && cajaChicaRes.resultado?.id) {
            console.log('✅ [CobroDeuda] Caja Chica encontrada, registrando movimiento...');
            const movRes = await this.cajaChicaCommandUC.registrarMovimiento({
              cajaChicaId: cajaChicaRes.resultado.id,
              tipo:        'INGRESO',
              descripcion: `Cobro de Deuda - Factura #${factura.id_personalizado || factura.id} - ${factura.cliente_nombre || 'Cliente'}`,
              monto:       montoPagado,
              usuarioId:   req.usuario?.id ?? null,
              usuarioNombre: req.usuario?.nombre ?? null,
              referencia:  `ABONO-${resultado.id}`,
            });
            console.log('📤 [CobroDeuda] Respuesta registrarMovimiento:', movRes);
            
            if (movRes.estado !== 'ok') {
              console.warn('⚠️ [CobroDeuda] Movimiento Caja Chica falló:', movRes.resultado);
            } else {
              console.log('✅ [CobroDeuda] Movimiento de Caja Chica registrado para abono:', resultado.id);
            }
          } else {
            console.warn('⚠️ [CobroDeuda] No hay caja chica abierta - cobro en efectivo registrado pero sin movimiento de caja');
          }
        } catch (e) {
          console.error('❌ [CobroDeuda] Error registrando en caja chica:', e.message);
        }
      } else if (!esEfectivo) {
        console.log('💳 [CobroDeuda] Cobro por', datos.metodoPago, '- No se registra en Caja Chica');
      }

      return res.status(201).json({
        estado: 'ok',
        resultado: respuesta.resultado,
        traceId: req.traceId
      });

    } catch (error) {
      console.error('Error registrarAbono:', error.message);
      return res.status(500).json({
        estado: 'error',
        resultado: 'Error al registrar el abono',
        traceId: req.traceId
      });
    }
  }

  /**
   * Obtiene facturas pendientes (con filtros)
   * GET /cobro-deuda/facturas-pendientes
   * Query params: clienteId, buscar, fechaDesde, fechaHasta
   */
  async facturasPendientes(req, res) {
    try {
      const { clienteId, buscar, fechaDesde, fechaHasta } = req.query;
      const filtros = { buscar, fechaDesde, fechaHasta };

      const respuesta = await this.queryUC.facturasPendientes(
        clienteId ? parseInt(clienteId) : null,
        filtros
      );

      return res.status(200).json({ ...respuesta, traceId: req.traceId });
    } catch (error) {
      console.error('Error facturasPendientes:', error.message);
      return res.status(500).json({
        estado: 'error',
        resultado: 'Error al obtener facturas pendientes',
        traceId: req.traceId
      });
    }
  }

  /**
   * Obtiene abonos de una factura
   * GET /cobro-deuda/facturas/:facturaId/abonos
   */
  async abonosPorFactura(req, res) {
    try {
      const { facturaId } = req.params;
      const respuesta = await this.queryUC.abonosPorFactura(parseInt(facturaId));
      return res.status(200).json({ ...respuesta, traceId: req.traceId });
    } catch (error) {
      console.error('Error abonosPorFactura:', error.message);
      return res.status(500).json({
        estado: 'error',
        resultado: 'Error al obtener abonos',
        traceId: req.traceId
      });
    }
  }

  /**
   * Obtiene detalle de un abono específico
   * GET /cobro-deuda/abonos/:abonoId
   */
  async obtenerAbono(req, res) {
    try {
      const { abonoId } = req.params;
      const respuesta = await this.queryUC.abonoPorId(parseInt(abonoId));
      return res.status(respuesta.estado === 'ok' ? 200 : 404).json({ ...respuesta, traceId: req.traceId });
    } catch (error) {
      console.error('Error obtenerAbono:', error.message);
      return res.status(500).json({
        estado: 'error',
        resultado: 'Error al obtener el abono',
        traceId: req.traceId
      });
    }
  }

  /**
   * Resumen de deuda de un cliente
   * GET /cobro-deuda/cliente/:clienteId/resumen
   */
  async resumenDeuda(req, res) {
    try {
      const { clienteId } = req.params;
      const respuesta = await this.queryUC.resumenClienteDeuda(parseInt(clienteId));
      return res.status(200).json({ ...respuesta, traceId: req.traceId });
    } catch (error) {
      console.error('Error resumenDeuda:', error.message);
      return res.status(500).json({
        estado: 'error',
        resultado: 'Error al obtener resumen de deuda',
        traceId: req.traceId
      });
    }
  }

  /**
   * Lista general de abonos
   * GET /cobro-deuda/lista-abonos
   * Query params: clienteId, fechaDesde, fechaHasta, metodoPago, buscar
   */
  async listaAbonos(req, res) {
    try {
      const { clienteId, fechaDesde, fechaHasta, metodoPago, buscar } = req.query;
      const filtros = { clienteId, fechaDesde, fechaHasta, metodoPago, buscar };

      const respuesta = await this.queryUC.listaAbonos(filtros);
      return res.status(200).json({ ...respuesta, traceId: req.traceId });
    } catch (error) {
      console.error('Error listaAbonos:', error.message);
      return res.status(500).json({
        estado: 'error',
        resultado: 'Error al obtener lista de abonos',
        traceId: req.traceId
      });
    }
  }

  /**
   * Listar deudas pendientes con paginación (para carga inicial en Cobrar Deuda)
   * GET /cobro-deuda/deudas-pagina?pagina=0&limite=5
   * Retorna todas las facturas pendientes ordenadas por fecha DESC
   */
  async deudasPaginadas(req, res) {
    try {
      const pagina = parseInt(req.query.pagina || '0');
      const limite = parseInt(req.query.limite || '5');
      const offset = pagina * limite;

      const respuesta = await this.queryUC.deudasPaginadas(offset, limite);
      return res.status(200).json({ ...respuesta, traceId: req.traceId });
    } catch (error) {
      console.error('Error deudasPaginadas:', error.message);
      return res.status(500).json({
        estado: 'error',
        resultado: 'Error al obtener deudas paginadas',
        traceId: req.traceId
      });
    }
  }
}
