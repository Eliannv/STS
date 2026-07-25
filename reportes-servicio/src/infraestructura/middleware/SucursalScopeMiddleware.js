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

// ─────────────────────────────────────────────────────────────────────────────
// Guardia de pertenencia
// ─────────────────────────────────────────────────────────────────────────────

const NOMBRES_CAMPO = ['sucursal_id', 'sucursalId'];

// Recorre la respuesta buscando identificadores de sucursal. Devuelve todos los
// encontrados para que un payload con varios registros se valide entero.
const extraerSucursales = (valor, profundidad = 0) => {
  if (valor == null || profundidad > 4) return [];
  if (Array.isArray(valor)) return valor.flatMap((item) => extraerSucursales(item, profundidad + 1));
  if (typeof valor !== 'object') return [];

  for (const campo of NOMBRES_CAMPO) {
    if (campo in valor) return [valor[campo]];
  }
  // Envolturas habituales del proyecto: {resultado}, {data}, {rows}, {caja}
  return ['resultado', 'data', 'rows', 'caja', 'detalles']
    .filter((clave) => clave in valor)
    .flatMap((clave) => extraerSucursales(valor[clave], profundidad + 1));
};

const permitido = (sucursalId, scope) => {
  // Fail-closed: un recurso sin sucursal identificable no se expone.
  if (sucursalId == null) return false;
  // Administrador consultando el consolidado.
  if (scope.puedeVerTodas && scope.filtroLectura == null) return true;
  return Number(sucursalId) === Number(scope.filtroLectura);
};

// Respuesta idéntica a la de un recurso inexistente: nunca revela que existe
// en otra sucursal, ni con el código de estado ni con el mensaje.
const noEncontrado = (req, res, responder) => {
  res.status(404);
  return responder({ estado: 'error', resultado: 'Recurso no encontrado', traceId: req.traceId });
};

/**
 * Valida que el recurso devuelto pertenezca a la sucursal en curso.
 *
 * Modos:
 *   - Interceptor (por defecto): inspecciona la respuesta del controlador. No
 *     requiere tocar controladores, casos de uso ni adaptadores.
 *   - Pre-check (`resolverPadre`): para subrecursos que no llevan sucursal propia
 *     (movimientos de una caja, abonos de una factura); resuelve la sucursal del
 *     padre y corta antes de ejecutar el controlador.
 *
 * `permitirGlobal` exime a recursos que por diseño no pertenecen a ninguna
 * sucursal: Caja Banco, catálogo, productos, proveedores y clientes.
 *
 * Extensión prevista (garantías/devoluciones entre sucursales): cuando exista ese
 * flujo, la excepción debe entrar por aquí como un permiso explícito y acotado a
 * un documento concreto, registrando el acceso en auditoría. Nunca ampliando
 * `permitirGlobal` ni relajando `permitido`, que convertiría la excepción en
 * acceso libre al historial.
 */
export const guardaSucursal = (opciones = {}) => async (req, res, next) => {
  if (opciones.permitirGlobal) return next();

  const scope = req.sucursalScope;
  if (!scope) return next();
  if (scope.puedeVerTodas && scope.filtroLectura == null) return next();

  const responder = res.json.bind(res);

  if (typeof opciones.resolverPadre === 'function') {
    let sucursalPadre = null;
    try {
      sucursalPadre = await opciones.resolverPadre(req);
    } catch {
      return noEncontrado(req, res, responder);
    }
    if (!permitido(sucursalPadre, scope)) return noEncontrado(req, res, responder);
    return next();
  }

  res.json = (cuerpo) => {
    // Los errores del controlador se dejan pasar tal cual.
    if (res.statusCode >= 400) return responder(cuerpo);
    const sucursales = extraerSucursales(cuerpo);
    if (sucursales.length === 0) return noEncontrado(req, res, responder);
    if (sucursales.every((id) => permitido(id, scope))) return responder(cuerpo);
    return noEncontrado(req, res, responder);
  };

  return next();
};
