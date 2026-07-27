import { useState, useEffect, useCallback, useMemo } from 'react';
import { cargarFichaCliente } from '../api/fichaClienteApi';

/**
 * Estado de la Ficha del Cliente.
 *
 * Una sola petición al montar. La ficha no guarda copias de los bloques: todo se
 * lee del documento que devuelve el agregador, y tras una mutación (nuevo
 * historial, edición del cliente) se recarga ese mismo documento.
 */
export default function useFichaCliente(clienteId) {
  const [ficha, setFicha] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    if (!clienteId) return;
    setCargando(true);
    setError('');
    try {
      const res = await cargarFichaCliente(clienteId);
      if (res.ok && res.data?.resultado) setFicha(res.data.resultado);
      else setError(res.data?.resultado || 'No se pudo cargar la ficha del cliente');
    } catch {
      setError('Error de conexión al cargar la ficha');
    } finally {
      setCargando(false);
    }
  }, [clienteId]);

  useEffect(() => { cargar(); }, [cargar]);

  // Derivados de uso frecuente. Se memoizan para no recalcular en cada render de
  // pestaña; los bloques se devuelven tal cual llegan del agregador.
  const derivados = useMemo(() => {
    if (!ficha) return {};
    const compras = ficha.compras ?? [];
    const historiales = ficha.historialClinico ?? [];
    return {
      ultimaCompra: compras[0] ?? null,
      // El agregador ordena los historiales por fecha descendente.
      ultimoHistorial: historiales[0] ?? null,
      puedeCompararHistoriales: historiales.length > 1,
      tieneCompras: compras.length > 0,
      tieneCuentas: (ficha.cuentasPorCobrar ?? []).length > 0,
    };
  }, [ficha]);

  return { ficha, cargando, error, recargar: cargar, ...derivados };
}
