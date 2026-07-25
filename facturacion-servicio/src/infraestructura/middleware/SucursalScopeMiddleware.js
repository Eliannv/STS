// Resuelve la sucursal efectiva de la petición a partir del token.
//
//   sucursalId     → sucursal sobre la que se escribe (siempre concreta)
//   filtroLectura  → sucursal por la que se filtran los listados; null = todas
//
// El OPERADOR queda anclado a su sucursal: cualquier intento de sobrescribirla
// por cabecera o query se ignora. El ADMINISTRADOR puede consultar una sucursal
// concreta o el consolidado de todas.
//
// Se invoca desde AuthMiddleware para que ninguna ruta autenticada quede sin scope.
export const resolverSucursalScope = (req) => {
  const usuario = req.usuario;
  if (!usuario) return;

  const esAdmin = usuario.rol === 'ADMINISTRADOR';
  const propia = Number(usuario.sucursalId) || null;
  const solicitada = Number(req.headers['x-sucursal-id'] ?? req.query?.sucursalId) || null;
  const sucursalId = esAdmin ? (solicitada ?? propia) : propia;

  req.sucursalScope = {
    sucursalId,
    filtroLectura: esAdmin ? solicitada : propia,
    puedeVerTodas: esAdmin,
    // El nombre solo se conoce con certeza para la sucursal del propio token. Si el
    // administrador opera sobre otra, se deja nulo y los reportes lo resuelven por catálogo:
    // aceptarlo por cabecera permitiría falsificar el nombre en los registros.
    sucursalNombre: sucursalId && sucursalId === propia ? (usuario.sucursalNombre ?? null) : null,
  };
};

// Para operaciones que mutan stock o dinero: sin sucursal no se puede registrar nada.
export const exigirSucursal = (req, res, next) => {
  if (!req.sucursalScope?.sucursalId) {
    return res.status(400).json({
      estado: 'error',
      mensaje: 'La operación requiere una sucursal asignada',
      traceId: req.traceId,
    });
  }
  return next();
};
