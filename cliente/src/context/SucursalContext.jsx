import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/api';
import { useAuth } from './AuthContext';

const SucursalContext = createContext(null);

// Clave leída por api.js para enviar la cabecera X-Sucursal-Id en cada petición.
export const SUCURSAL_ACTIVA_KEY = 'sucursalActiva';

export function SucursalProvider({ children }) {
  const { usuario, isAdmin } = useAuth();
  const [sucursales, setSucursales] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Para el operador la sucursal es fija y viene del token; solo el administrador
  // puede cambiarla, y '' significa "consolidado de todas".
  const [sucursalActiva, setSucursalActivaEstado] = useState(() => {
    if (!isAdmin) return '';
    return localStorage.getItem(SUCURSAL_ACTIVA_KEY) || '';
  });

  useEffect(() => {
    if (!usuario) return;
    setCargando(true);
    api.get('/sucursales').then(res => {
      if (res.ok) setSucursales(res.data.resultado || []);
      setCargando(false);
    });
  }, [usuario]);

  const setSucursalActiva = useCallback((valor) => {
    if (!isAdmin) return;
    const normalizado = valor ? String(valor) : '';
    if (normalizado) localStorage.setItem(SUCURSAL_ACTIVA_KEY, normalizado);
    else localStorage.removeItem(SUCURSAL_ACTIVA_KEY);
    setSucursalActivaEstado(normalizado);
    // Los datos en pantalla pertenecen a la sucursal anterior: se recargan.
    window.location.reload();
  }, [isAdmin]);

  // Sucursal sobre la que realmente se opera: la elegida por el admin o la propia.
  const sucursalOperativaId = isAdmin
    ? (sucursalActiva ? Number(sucursalActiva) : usuario?.sucursal_id ?? null)
    : usuario?.sucursal_id ?? null;

  const sucursalOperativa = sucursales.find(s => Number(s.id) === Number(sucursalOperativaId)) || null;

  const nombreSucursalOperativa = sucursalOperativa?.nombre
    || usuario?.sucursal_nombre
    || (sucursalOperativaId ? `Sucursal #${sucursalOperativaId}` : 'Sin sucursal');

  return (
    <SucursalContext.Provider value={{
      sucursales,
      cargando,
      sucursalActiva,
      setSucursalActiva,
      sucursalOperativaId,
      sucursalOperativa,
      nombreSucursalOperativa,
      viendoTodas: isAdmin && !sucursalActiva,
      nombreSucursal: (id) => sucursales.find(s => Number(s.id) === Number(id))?.nombre || (id ? `Sucursal #${id}` : '—'),
    }}>
      {children}
    </SucursalContext.Provider>
  );
}

export function useSucursal() {
  return useContext(SucursalContext) ?? {
    sucursales: [],
    sucursalActiva: '',
    sucursalOperativaId: null,
    viendoTodas: false,
    nombreSucursalOperativa: '—',
    nombreSucursal: () => '—',
    setSucursalActiva: () => {},
  };
}
