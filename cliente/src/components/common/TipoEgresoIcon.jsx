// cliente/src/components/common/TipoEgresoIcon.jsx
import {
  AlertTriangle,
  Archive,
  Clock,
  Gift,
  Heart,
  HelpCircle,
  MoreHorizontal,
  PackageX,
  RotateCcw,
  ShieldOff,
  TrendingDown,
  Wrench,
} from 'lucide-react';
import { obtenerEtiquetaTipoEgreso } from './tipoEgreso';

const CONFIGURACION = Object.freeze({
  DEVOLUCION_PROVEEDOR: { icon: RotateCcw, color: '#2980b9' },
  MERMA: { icon: TrendingDown, color: '#e67e22' },
  ROTURA: { icon: PackageX, color: '#e74c3c' },
  ROBO: { icon: AlertTriangle, color: '#e74c3c' },
  PERDIDA: { icon: HelpCircle, color: '#e67e22' },
  VENCIMIENTO: { icon: Clock, color: '#d4a017' },
  CONSUMO_INTERNO: { icon: Wrench, color: '#6c757d' },
  MUESTRA: { icon: Gift, color: '#8e44ad' },
  DONACION: { icon: Heart, color: '#27ae60' },
  OBSOLESCENCIA: { icon: Archive, color: '#6c757d' },
  RETIRO_CALIDAD: { icon: ShieldOff, color: '#e67e22' },
  OTRO: { icon: MoreHorizontal, color: '#6c757d' },
});

export default function TipoEgresoIcon({
  tipo,
  size = 16,
  className,
  mostrarEtiqueta = false,
}) {
  const configuracion = CONFIGURACION[tipo] || CONFIGURACION.OTRO;
  const Icono = configuracion.icon;

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: configuracion.color }}
      title={obtenerEtiquetaTipoEgreso(tipo)}
    >
      <Icono size={size} aria-hidden="true" />
      {mostrarEtiqueta && <span>{obtenerEtiquetaTipoEgreso(tipo)}</span>}
    </span>
  );
}
