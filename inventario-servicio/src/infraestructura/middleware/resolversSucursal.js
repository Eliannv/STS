// Resolvers de sucursal para subrecursos que no la llevan en su propia respuesta
// (los movimientos de un egreso, por ejemplo, heredan la del documento padre).
// Los usa guardaSucursal en modo pre-check, antes de ejecutar el controlador.
import { Egreso, Ingreso } from '../modelos/Modelos.js';
import { Transferencia } from '../modelos/ModeloTransferencia.js';

const sucursalDe = (modelo, campo = 'sucursal_id') => async (req) => {
  const fila = await modelo.findByPk(Number(req.params.id), { attributes: [campo], raw: true });
  return fila?.[campo] ?? null;
};

export const sucursalDeEgreso = sucursalDe(Egreso);
export const sucursalDeIngreso = sucursalDe(Ingreso);

// Una transferencia involucra dos sucursales: es visible desde cualquiera de ellas.
export const sucursalDeTransferencia = async (req) => {
  const fila = await Transferencia.findByPk(Number(req.params.id), {
    attributes: ['sucursal_origen_id', 'sucursal_destino_id'],
    raw: true,
  });
  if (!fila) return null;
  const scope = req.sucursalScope;
  return [fila.sucursal_origen_id, fila.sucursal_destino_id]
    .find((id) => Number(id) === Number(scope?.filtroLectura)) ?? fila.sucursal_origen_id;
};
