import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const TabHistoryContext = createContext(null);

const MAX_HISTORY = 15;

const ROUTE_LABELS = {
  '/': 'Dashboard',
  '/clientes': 'Clientes',
  '/proveedores': 'Proveedores',
  '/empleados': 'Empleados',
  '/usuarios': 'Usuarios',
  '/productos': 'Productos',
  '/ingresos': 'Ingresos',
  '/facturas': 'Facturas',
  '/ventas/venta-tarjeta': 'Venta con Tarjeta',
  '/caja-chica': 'Caja Chica',
  '/caja-banco': 'Caja Banco',
  '/sucursales': 'Sucursales',
};

function getLabel(pathname) {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  if (pathname.startsWith('/clientes/')) return 'Ficha Cliente';
  if (pathname.startsWith('/ingresos/nuevo')) return 'Nuevo Ingreso';
  if (pathname.startsWith('/ingresos/importar')) return 'Importar Ingreso';
  if (pathname.startsWith('/ingresos/')) return 'Ingreso';
  if (pathname.startsWith('/facturas/nueva')) return 'Nueva Venta';
  if (pathname.startsWith('/facturas/cobrar')) return 'Cobrar Deuda';
  if (pathname.startsWith('/facturas/')) return 'Factura';
  if (pathname.startsWith('/ventas/venta-tarjeta/')) return 'Ver Venta Tarjeta';
  if (pathname.startsWith('/caja-chica/')) return 'Ver Caja Chica';
  if (pathname.startsWith('/caja-banco/')) return 'Ver Caja Banco';
  if (pathname.startsWith('/reportes/')) {
    const parts = pathname.split('/');
    if (parts.length >= 4) {
      const report = parts[3].replace(/-/g, ' ');
      return report.charAt(0).toUpperCase() + report.slice(1);
    }
    if (parts.length >= 3) return 'Reportes';
  }
  const last = pathname.split('/').filter(Boolean).pop();
  return last ? last.charAt(0).toUpperCase() + last.slice(1) : 'Dashboard';
}

export function TabHistoryProvider({ children }) {
  const [history, setHistory] = useState(() => {
    const path = window.location.pathname;
    return [{ path, label: getLabel(path) }];
  });
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    const path = location.pathname;
    if (path === prevPathRef.current) return;
    prevPathRef.current = path;

    const label = getLabel(path);
    setHistory(prev => {
      const filtered = prev.filter(p => p.path !== path);
      return [{ path, label }, ...filtered].slice(0, MAX_HISTORY);
    });
  }, [location.pathname]);

  return (
    <TabHistoryContext.Provider value={{ history }}>
      {children}
    </TabHistoryContext.Provider>
  );
}

export function useTabHistory() {
  const ctx = useContext(TabHistoryContext);
  if (!ctx) throw new Error('useTabHistory must be used within TabHistoryProvider');
  return ctx;
}
