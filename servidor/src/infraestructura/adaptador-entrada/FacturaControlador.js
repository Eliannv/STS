// src/infraestructura/adaptador-entrada/FacturaControlador.js
import FacturaEntradaPuerto from '../../aplicacion/puertos/entrada/FacturaEntradaPuerto.js';

export default class FacturaControlador extends FacturaEntradaPuerto {
  constructor(facturaCommandUsesCase, facturaQueryUsesCase, cajaChicaCommandUC, cajaChicaQueryUC) {
    super();
    this.commandUC         = facturaCommandUsesCase;
    this.queryUC           = facturaQueryUsesCase;
    this.cajaChicaCommandUC = cajaChicaCommandUC;
    this.cajaChicaQueryUC   = cajaChicaQueryUC;
  }

  async crear(req, res) {
    const datos = { ...req.body, usuarioId: req.usuario?.id ?? null };
    const respuesta = await this.commandUC.crear(datos);

    if (respuesta.estado === 'ok') {
      const factura    = respuesta.resultado;
      const abonado    = parseFloat(factura.abonado ?? 0);
      const metodoPago = (req.body.metodoPago ?? '').toLowerCase();

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
    const respuesta = await this.commandUC.eliminar(id);
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({
      ...respuesta, traceId: req.traceId,
    });
  }
}
