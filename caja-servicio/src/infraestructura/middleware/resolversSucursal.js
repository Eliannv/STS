// Resolvers de sucursal para subrecursos que heredan la del documento padre.
// Los usa guardaSucursal en modo pre-check, antes de ejecutar el controlador.
import ModeloCajaChica from '../modelos/ModeloCajaChica.js';
import ModeloCuenta from '../modelos/ModeloCuenta.js';

const sucursalDe = (modelo) => async (req) => {
  const id = Number(req.params?.id);
  if (!id) return null;
  const fila = await modelo.findByPk(id, { attributes: ['sucursal_id'], raw: true });
  return fila?.sucursal_id ?? null;
};

export const sucursalDeCajaChica = sucursalDe(ModeloCajaChica);
export const sucursalDeCuenta = sucursalDe(ModeloCuenta);
