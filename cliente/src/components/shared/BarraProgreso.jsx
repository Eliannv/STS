// cliente/src/components/shared/BarraProgreso.jsx
export default function BarraProgreso({
  completado = 0,
  colorCompletado = '#27ae60',
  colorPendiente = '#e5e7eb',
  compacta = false,
  mostrarPorcentaje = true,
}) {
  const porcentaje = Math.min(100, Math.max(0, Number(completado) || 0));

  return (
    <div style={{ minWidth: compacta ? 90 : 140 }}>
      <div
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={porcentaje}
        style={{
          height: compacta ? 7 : 11,
          borderRadius: 999,
          overflow: 'hidden',
          background: colorPendiente,
        }}
      >
        <div
          style={{
            width: `${porcentaje}%`,
            height: '100%',
            borderRadius: 999,
            background: colorCompletado,
            transition: 'width 180ms ease',
          }}
        />
      </div>
      {mostrarPorcentaje && (
        <div style={{
          marginTop: compacta ? 3 : 6,
          color: '#6c757d',
          fontSize: compacta ? 10 : 12,
          fontWeight: 600,
          textAlign: 'right',
        }}>
          {porcentaje.toFixed(1)}%
        </div>
      )}
    </div>
  );
}
