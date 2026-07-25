// cliente/src/components/shared/EstadoBadge.jsx
const ESTADOS = {
  ABIERTA: ['Abierta', '#dcfce7', '#166534'],
  CERRADA: ['Cerrada', '#e5e7eb', '#4b5563'],
  PENDIENTE: ['Pendiente', '#fef3c7', '#92400e'],
  PROCESANDO: ['Procesando', '#dbeafe', '#1d4ed8'],
  PARCIAL: ['Parcial', '#dbeafe', '#1d4ed8'],
  PARCIALMENTE_ACREDITADA: ['Parcialmente acreditada', '#dbeafe', '#1d4ed8'],
  ACREDITADA: ['Acreditada', '#dcfce7', '#166534'],
  PAGADA: ['Pagada', '#dcfce7', '#166534'],
  VENCIDA: ['Vencida', '#fee2e2', '#b91c1c'],
  RECHAZADA: ['Rechazada', '#fee2e2', '#b91c1c'],
  ANULADA: ['Anulada', '#fee2e2', '#b91c1c'],
  LEGACY_LIQUIDADA: ['Liquidada histórica', '#e5e7eb', '#4b5563'],
  LIQUIDADA_HISTORICA: ['Liquidada histórica', '#e5e7eb', '#4b5563'],
  APLICADO: ['Aplicado', '#dcfce7', '#166534'],
  ERROR: ['Error', '#fee2e2', '#b91c1c'],
  REVERTIDO: ['Revertido', '#e5e7eb', '#4b5563'],
  BORRADOR: ['Borrador', '#fef3c7', '#92400e'],
  CONFIRMADO: ['Confirmado', '#dcfce7', '#166534'],
  DESCARTADO: ['Descartado', '#e5e7eb', '#4b5563'],
  NO_APLICA: ['No aplica', '#f3f4f6', '#6b7280'],
  INGRESO: ['Ingreso', '#dcfce7', '#166534'],
  EGRESO: ['Egreso', '#fee2e2', '#b91c1c'],
};

export default function EstadoBadge({ estado, title }) {
  const clave = String(estado || '').toUpperCase();
  const [label, background, color] = ESTADOS[clave]
    || [estado || 'Sin estado', '#e5e7eb', '#4b5563'];

  return (
    <span
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 9px',
        borderRadius: 999,
        background,
        color,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
