const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const resourcePrefixes = [
  ['/caja-banco', '/cajas-banco'],
  ['/caja-chica', '/cajas-chicas'],
  ['/venta-tarjeta', '/ventas-tarjeta'],
  ['/usuario', '/usuarios'],
  ['/sucursal', '/sucursales'],
  ['/cliente', '/clientes'],
  ['/producto', '/productos'],
  ['/proveedor', '/proveedores'],
  ['/ingreso', '/ingresos'],
  ['/factura', '/facturas'],
];

function normalizeRequest(method, path, body) {
  const separator = path.indexOf('?');
  let pathname = separator >= 0 ? path.slice(0, separator) : path;
  const query = separator >= 0 ? path.slice(separator) : '';

  if (pathname.startsWith('/historial/lista/')) {
    pathname = pathname.replace('/historial/lista/', '/historial-clinico/cliente/');
  } else {
    const prefix = resourcePrefixes.find(([legacy]) => pathname === legacy || pathname.startsWith(`${legacy}/`));
    if (prefix) pathname = `${prefix[1]}${pathname.slice(prefix[0].length)}`;
  }

  if ((pathname === '/usuarios/lista' || pathname === '/sucursales/lista') && method === 'GET') pathname = pathname.slice(0, -6);
  if ((pathname === '/usuarios/crear' || pathname === '/sucursales/crear') && method === 'POST') pathname = pathname.slice(0, pathname.lastIndexOf('/'));

  let normalizedBody = body;
  if ((pathname === '/usuarios/editar' || pathname === '/usuarios/eliminar' || pathname === '/sucursales/editar' || pathname === '/sucursales/eliminar') && body?.id) {
    pathname = `${pathname.slice(0, pathname.lastIndexOf('/'))}/${encodeURIComponent(body.id)}`;
    if (method === 'DELETE') normalizedBody = null;
  }
  if (pathname === '/cajas-banco/cerrar' && body?.cajaBancoId && !body.id) normalizedBody = { ...body, id: body.cajaBancoId };

  return { path: `${pathname}${query}`, body: normalizedBody };
}

function getToken() {
  return localStorage.getItem('token');
}

async function request(method, path, body = null) {
  const normalized = normalizeRequest(method, path, body);
  const headers = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (normalized.body !== null && normalized.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(normalized.body);
  }

  const res = await fetch(`${BASE_URL}${normalized.path}`, config);
  let data = null;
  const contentType = res.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = text ? { mensaje: text } : null;
    }
  } catch {
    data = null;
  }

  if (!data) {
    data = { mensaje: `Error HTTP ${res.status}` };
  }

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
  }

  return { ok: res.ok, status: res.status, data };
}

export const api = {
  get:    (path)        => request('GET', path),
  post:   (path, body)  => request('POST', path, body),
  put:    (path, body)  => request('PUT', path, body),
  delete: (path, body)  => request('DELETE', path, body),
};
