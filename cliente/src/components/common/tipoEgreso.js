// cliente/src/components/common/tipoEgreso.js
export const TIPOS_EGRESO = Object.freeze([
  { value: 'DEVOLUCION_PROVEEDOR', label: 'Devolución Proveedor' },
  { value: 'MERMA', label: 'Merma' },
  { value: 'ROTURA', label: 'Rotura' },
  { value: 'ROBO', label: 'Robo' },
  { value: 'PERDIDA', label: 'Pérdida' },
  { value: 'VENCIMIENTO', label: 'Vencimiento' },
  { value: 'CONSUMO_INTERNO', label: 'Consumo Interno' },
  { value: 'MUESTRA', label: 'Muestra' },
  { value: 'DONACION', label: 'Donación' },
  { value: 'OBSOLESCENCIA', label: 'Obsolescencia' },
  { value: 'RETIRO_CALIDAD', label: 'Retiro Calidad' },
  { value: 'OTRO', label: 'Otro' },
]);

export function obtenerEtiquetaTipoEgreso(tipo) {
  return TIPOS_EGRESO.find((item) => item.value === tipo)?.label
    || String(tipo || 'Sin tipo').replaceAll('_', ' ');
}
