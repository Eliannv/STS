// Resolvers de sucursal para subrecursos que heredan la del documento padre.
// Los usa guardaSucursal en modo pre-check, antes de ejecutar el controlador.
import { Factura, VentaTarjeta, DetalleFactura, AbonoTarjeta } from '../modelos/Modelos.js';

const idDe = (req, ...nombres) => {
  for (const nombre of nombres) {
    const valor = Number(req.params?.[nombre]);
    if (valor) return valor;
  }
  return null;
};

export const sucursalDeFactura = async (req) => {
  const id = idDe(req, 'facturaId', 'id');
  if (!id) return null;
  const fila = await Factura.findByPk(id, { attributes: ['sucursal_id'], raw: true });
  return fila?.sucursal_id ?? null;
};

export const sucursalDeVentaTarjeta = async (req) => {
  const id = idDe(req, 'ventaTarjetaId', 'id');
  if (!id) return null;
  const fila = await VentaTarjeta.findByPk(id, { attributes: ['sucursal_id'], raw: true });
  return fila?.sucursal_id ?? null;
};

export const sucursalDeDetalleFactura = async (req) => {
  const id = idDe(req, 'id');
  if (!id) return null;
  const detalle = await DetalleFactura.findByPk(id, { attributes: ['factura_id'], raw: true });
  if (!detalle) return null;
  const factura = await Factura.findByPk(detalle.factura_id, { attributes: ['sucursal_id'], raw: true });
  return factura?.sucursal_id ?? null;
};

export const sucursalDeAbonoTarjeta = async (req) => {
  const id = idDe(req, 'id');
  if (!id) return null;
  const abono = await AbonoTarjeta.findByPk(id, { attributes: ['venta_tarjeta_id'], raw: true });
  if (!abono) return null;
  const venta = await VentaTarjeta.findByPk(abono.venta_tarjeta_id, { attributes: ['sucursal_id'], raw: true });
  return venta?.sucursal_id ?? null;
};
