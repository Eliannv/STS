// src/infraestructura/adaptador-entrada/VentaTarjetaControlador.js
import VentaTarjetaEntradaPuerto from '../../aplicacion/puertos/entrada/VentaTarjetaEntradaPuerto.js';

/**
 * Controlador de Ventas con Tarjeta
 * Maneja las peticiones HTTP y orquesta los use cases
 */
export default class VentaTarjetaControlador extends VentaTarjetaEntradaPuerto {
  constructor(ventaTarjetaCommandUC, ventaTarjetaQueryUC) {
    super();
    this.commandUC = ventaTarjetaCommandUC;
    this.queryUC = ventaTarjetaQueryUC;
  }

  /**
   * GET /listar
   * Lista todas las ventas con tarjeta con filtros opcionales
   */
  async listarVentasTarjeta(req, res) {
    try {
      console.log('📥 [VentaTarjeta] Request listarVentasTarjeta');

      const filtros = {
        estado: req.query.estado || null,
        clienteId: req.query.clienteId ? parseInt(req.query.clienteId) : null,
        buscar: req.query.buscar || null,
        banco: req.query.banco || null,
        fechaDesde: req.query.fechaDesde || null,
        fechaHasta: req.query.fechaHasta || null,
        orden: req.query.orden || 'fecha_venta DESC'
      };

      const respuesta = await this.queryUC.listarVentasTarjeta(filtros);

      console.log('📤 [VentaTarjeta] Respuesta:', {
        estado: respuesta.estado,
        cantidad: respuesta.resultado?.length || 0
      });

      if (respuesta.estado !== 'ok') {
        return res.status(400).json({ ...respuesta, traceId: req.traceId });
      }

      return res.status(200).json({ ...respuesta, traceId: req.traceId });
    } catch (error) {
      console.error('Error listarVentasTarjeta:', error.message);
      return res.status(500).json({
        estado: 'error',
        resultado: 'Error al listar ventas tarjeta',
        traceId: req.traceId
      });
    }
  }

  /**
   * GET /:id
   * Obtiene detalle de una venta tarjeta específica
   */
  async obtenerVentaTarjeta(req, res) {
    try {
      const { id } = req.params;
      console.log('📥 [VentaTarjeta] Request obtenerVentaTarjeta - id:', id);

      if (!id)
        return res.status(400).json({
          estado: 'error',
          resultado: 'ID es requerido',
          traceId: req.traceId
        });

      const respuesta = await this.queryUC.obtenerVentaTarjeta(parseInt(id));

      if (respuesta.estado !== 'ok')
        return res.status(404).json({ ...respuesta, traceId: req.traceId });

      console.log('📤 [VentaTarjeta] Venta encontrada');
      return res.status(200).json({ ...respuesta, traceId: req.traceId });
    } catch (error) {
      console.error('Error obtenerVentaTarjeta:', error.message);
      return res.status(500).json({
        estado: 'error',
        resultado: 'Error al obtener venta tarjeta',
        traceId: req.traceId
      });
    }
  }

  /**
   * POST /:ventaTarjetaId/registrar-abono
   * Registra un abono del banco a una venta tarjeta
   */
  async registrarAbono(req, res) {
    try {
      console.log('📥 [VentaTarjeta] Request registrarAbono');
      console.log('   - ventaTarjetaId:', req.params.ventaTarjetaId);
      console.log('   - monto (raw):', req.body.monto);
      console.log('   - monto (parseFloat):', parseFloat(req.body.monto));
      console.log('   - fecha:', req.body.fecha);
      console.log('   - req.body completo:', JSON.stringify(req.body));

      const datos = {
        ventaTarjetaId: parseInt(req.params.ventaTarjetaId),
        fecha: req.body.fecha || new Date().toISOString(),
        monto: parseFloat(req.body.monto),
        observacion: req.body.observacion || null,
        usuarioId: req.usuario?.id ?? null
      };

      console.log('📝 [VentaTarjeta] Datos construidos:', JSON.stringify(datos));

      const respuesta = await this.commandUC.registrarAbono(datos);

      console.log('📤 [VentaTarjeta] Respuesta comandUC:', {
        estado: respuesta.estado,
        abonoId: respuesta.resultado?.id
      });

      if (respuesta.estado !== 'ok')
        return res.status(400).json({ ...respuesta, traceId: req.traceId });

      return res.status(201).json({
        estado: 'ok',
        resultado: respuesta.resultado,
        traceId: req.traceId
      });
    } catch (error) {
      console.error('Error registrarAbono:', error.message);
      return res.status(500).json({
        estado: 'error',
        resultado: 'Error al registrar abono',
        traceId: req.traceId
      });
    }
  }

  /**
   * GET /:ventaTarjetaId/historial
   * Obtiene historial de todos los abonos de una venta tarjeta
   */
  async obtenerHistorialAbonos(req, res) {
    try {
      const { ventaTarjetaId } = req.params;
      console.log('📥 [VentaTarjeta] Request historialAbonos - id:', ventaTarjetaId);

      if (!ventaTarjetaId)
        return res.status(400).json({
          estado: 'error',
          resultado: 'ventaTarjetaId es requerido',
          traceId: req.traceId
        });

      const respuesta = await this.queryUC.historialAbonos(parseInt(ventaTarjetaId));

      if (respuesta.estado !== 'ok')
        return res.status(400).json({ ...respuesta, traceId: req.traceId });

      console.log('📤 [VentaTarjeta] Historial encontrado - cantidad:', respuesta.resultado?.length || 0);
      return res.status(200).json({ ...respuesta, traceId: req.traceId });
    } catch (error) {
      console.error('Error obtenerHistorialAbonos:', error.message);
      return res.status(500).json({
        estado: 'error',
        resultado: 'Error al obtener historial',
        traceId: req.traceId
      });
    }
  }

  /**
   * GET /resumen
   * Obtiene resumen general de ventas tarjeta
   */
  async resumenVentasTarjeta(req, res) {
    try {
      console.log('📥 [VentaTarjeta] Request resumenVentasTarjeta');

      const respuesta = await this.queryUC.resumenVentasTarjeta();

      if (respuesta.estado !== 'ok')
        return res.status(400).json({ ...respuesta, traceId: req.traceId });

      console.log('📤 [VentaTarjeta] Resumen:', respuesta.resultado);
      return res.status(200).json({ ...respuesta, traceId: req.traceId });
    } catch (error) {
      console.error('Error resumenVentasTarjeta:', error.message);
      return res.status(500).json({
        estado: 'error',
        resultado: 'Error al obtener resumen',
        traceId: req.traceId
      });
    }
  }
}
