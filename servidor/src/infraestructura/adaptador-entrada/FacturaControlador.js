// src/infraestructura/adaptador-entrada/FacturaControlador.js
import FacturaEntradaPuerto from '../../aplicacion/puertos/entrada/FacturaEntradaPuerto.js';

export default class FacturaControlador extends FacturaEntradaPuerto {
  constructor(facturaCommandUsesCase, facturaQueryUsesCase, cajaChicaCommandUC, cajaChicaQueryUC, cajaBancoCommandUC, cajaBancoQueryUC) {
    super();
    this.commandUC          = facturaCommandUsesCase;
    this.queryUC            = facturaQueryUsesCase;
    this.cajaChicaCommandUC = cajaChicaCommandUC;
    this.cajaChicaQueryUC   = cajaChicaQueryUC;
    this.cajaBancoCommandUC = cajaBancoCommandUC;
    this.cajaBancoQueryUC   = cajaBancoQueryUC;
  }

  async crear(req, res) {
    const datos = { ...req.body, usuarioId: req.usuario?.id ?? null };
    const respuesta = await this.commandUC.crear(datos);

    if (respuesta.estado === 'ok') {
      const factura    = respuesta.resultado;
      const abonado    = parseFloat(factura.abonado ?? 0);
      const total      = parseFloat(factura.total ?? 0);
      const metodoPago = (req.body.metodoPago ?? '').toLowerCase();

      // ── Integración con Caja Chica (EFECTIVO) ──
      if (metodoPago === 'efectivo' && abonado > 0 && this.cajaChicaQueryUC && this.cajaChicaCommandUC) {
        try {
          const cajaRes = await this.cajaChicaQueryUC.cajaAbierta();
          if (cajaRes.estado === 'ok' && cajaRes.resultado?.id) {
            const movRes = await this.cajaChicaCommandUC.registrarMovimiento({
              cajaChicaId:   cajaRes.resultado.id,
              tipo:          'INGRESO',
              descripcion:   `Factura #${factura.id_personalizado || factura.id} - ${factura.cliente_nombre || 'Cliente'}`,
              monto:         abonado,
              usuarioId:     req.usuario?.id ?? null,
              usuarioNombre: req.usuario?.nombre ?? null,
              referencia:    String(factura.id),
            });
            if (movRes.estado !== 'ok') {
              console.warn('Caja chica movimiento falló:', movRes.resultado);
            }
          } else {
            console.warn('No hay caja chica abierta — movimiento no registrado para factura', factura.id);
          }
        } catch (e) {
          console.warn('No se pudo registrar movimiento en caja chica:', e.message);
        }
      }

      // ── Integración con Caja Banco (TRANSFERENCIA) ──
      if (metodoPago === 'transferencia' && total > 0 && this.cajaBancoQueryUC && this.cajaBancoCommandUC) {
        try {
          console.log('🔵 Buscando caja banco abierta para transferencia...');
          const cajaRes = await this.cajaBancoQueryUC.cajaAbierta();
          console.log('📦 Respuesta cajaAbierta:', cajaRes);
          
          if (cajaRes.estado === 'ok' && cajaRes.resultado?.id) {
            console.log('✅ Caja banco encontrada:', cajaRes.resultado.id);
            
            const movimientoData = {
              cajaBancoId:   cajaRes.resultado.id,
              tipo:          'INGRESO',
              categoria:     'TRANSFERENCIA_CLIENTE',
              descripcion:   `Venta por transferencia - ${factura.cliente_nombre || 'Cliente'}`,
              monto:         total,
              ventaId:       factura.id,
              usuarioId:     req.usuario?.id ?? null,
              usuarioNombre: req.usuario?.nombre ?? null,
              referencia:    factura.id_personalizado || String(factura.id),
            };
            console.log('📝 Datos del movimiento:', movimientoData);
            
            const movRes = await this.cajaBancoCommandUC.registrarMovimiento(movimientoData);
            console.log('📤 Respuesta registrarMovimiento:', movRes);
            
            if (movRes.estado !== 'ok') {
              console.warn('❌ Caja banco movimiento falló:', movRes.resultado);
            } else {
              console.log('✅ Movimiento de caja banco registrado exitosamente');
            }
          } else {
            console.warn('⚠️ No hay caja banco abierta — movimiento no registrado para factura', factura.id);
            console.warn('   cajaRes:', cajaRes);
          }
        } catch (e) {
          console.error('❌ Error registrando movimiento en caja banco:', e.message);
          console.error('   Stack:', e.stack);
        }
      }
    }

    return res.status(respuesta.estado === 'ok' ? 201 : 400).json({
      ...respuesta, traceId: req.traceId,
    });
  }

  async listaPorCliente(req, res) {
    const { clienteId } = req.params;
    const respuesta = await this.queryUC.listaPorCliente(clienteId);
    return res.status(200).json({ ...respuesta, traceId: req.traceId });
  }

  async buscarPorId(req, res) {
    const { id } = req.params;
    const respuesta = await this.queryUC.buscarPorId(id);
    return res.status(respuesta.estado === 'ok' ? 200 : 404).json({
      ...respuesta, traceId: req.traceId,
    });
  }

  async resumenPorCliente(req, res) {
    const { clienteId } = req.params;
    const respuesta = await this.queryUC.resumenPorCliente(clienteId);
    return res.status(200).json({ ...respuesta, traceId: req.traceId });
  }

  async editar(req, res) {
    const datos = { ...req.body, usuarioId: req.usuario?.id ?? null };
    const respuesta = await this.commandUC.editar(datos);
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({
      ...respuesta, traceId: req.traceId,
    });
  }

  async cobrar(req, res) {
    const { id } = req.params;
    const respuesta = await this.commandUC.cobrar(id);
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({
      ...respuesta, traceId: req.traceId,
    });
  }

  async listaGeneral(req, res) {
    const { buscar, estado, tipo, fechaDesde, fechaHasta } = req.query;
    const respuesta = await this.queryUC.listaGeneral({ buscar, estado, tipo, fechaDesde, fechaHasta });
    return res.status(200).json({ ...respuesta, traceId: req.traceId });
  }

  async eliminar(req, res) {
    const { id } = req.body;
    
    // Buscar movimientos de Caja Banco asociados a esta factura
    let movimientoCajaBanco = null;
    if (this.cajaBancoQueryUC) {
      try {
        const busRes = await this.cajaBancoQueryUC.buscarMovimientoPorVentaId(id);
        if (busRes.estado === 'ok' && busRes.resultado && busRes.resultado.length > 0) {
          movimientoCajaBanco = busRes.resultado[0];
        }
      } catch (e) {
        console.warn('No se pudo buscar movimiento de caja banco:', e.message);
      }
    }
    
    const respuesta = await this.commandUC.eliminar(id);
    
    // Si se eliminó correctamente y hay movimiento de Caja Banco, eliminarlo también
    if (respuesta.estado === 'ok' && movimientoCajaBanco && this.cajaBancoCommandUC) {
      try {
        const delRes = await this.cajaBancoCommandUC.eliminarMovimiento(movimientoCajaBanco.id);
        if (delRes.estado !== 'ok') {
          console.warn('No se pudo eliminar movimiento de caja banco:', delRes.resultado);
        }
      } catch (e) {
        console.warn('Error eliminando movimiento de caja banco:', e.message);
      }
    }
    
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({
      ...respuesta, traceId: req.traceId,
    });
  }
}
