import { Stethoscope, ShoppingCart, Handshake, XCircle, ArrowLeftRight, Circle } from 'lucide-react';
import { useMemo } from 'react';
import { dinero, fechaHora, agruparPorDia } from './fichaUtils';
import { Vacio } from './fichaUI';

// Cada tipo de evento con su identidad visual, para que la línea de tiempo se
// lea de un vistazo sin tener que leer el texto.
const ESTILO_EVENTO = {
  HISTORIAL_CLINICO: { icono: Stethoscope,    color: '#9b59b6', etiqueta: 'Examen visual' },
  VENTA:             { icono: ShoppingCart,   color: '#3498db', etiqueta: 'Venta' },
  VENTA_ANULADA:     { icono: XCircle,        color: '#e74c3c', etiqueta: 'Venta anulada' },
  ABONO:             { icono: Handshake,      color: '#27ae60', etiqueta: 'Abono' },
  PAGO:              { icono: Handshake,      color: '#27ae60', etiqueta: 'Pago' },
  TRANSFERENCIA:     { icono: ArrowLeftRight, color: '#e67e22', etiqueta: 'Transferencia' },
};

const POR_DEFECTO = { icono: Circle, color: '#6c757d', etiqueta: 'Evento' };

export default function TabActividad({ actividad, alcance }) {
  if (actividad.length === 0) {
    return <Vacio mensaje="Sin actividad registrada para este cliente." />;
  }

  // La agrupación es puramente de presentación y depende solo de la lista.
  const grupos = useMemo(() => agruparPorDia(actividad), [actividad]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {grupos.map((grupo) => (
        <div key={grupo.clave} className="card" style={{ padding: '16px 24px' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6,
            color: 'var(--text-muted)', marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            {grupo.titulo}
            <span style={{ flex: 1, height: 1, background: '#e9ecef' }} />
            <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
              {grupo.eventos.length} {grupo.eventos.length === 1 ? 'evento' : 'eventos'}
            </span>
          </div>

          <div style={{ position: 'relative', paddingLeft: 28 }}>
            <div style={{ position: 'absolute', left: 11, top: 6, bottom: 6, width: 2, background: '#e9ecef' }} />
            {grupo.eventos.map((evento, indice) => {
              const estilo = ESTILO_EVENTO[evento.tipo] ?? POR_DEFECTO;
              const Icono = estilo.icono;
              return (
                <div key={`${evento.tipo}-${evento.referenciaId}-${indice}`}
                  style={{ position: 'relative', paddingBottom: indice === grupo.eventos.length - 1 ? 0 : 16 }}>
                  <div style={{
                    position: 'absolute', left: -28, top: 0, width: 24, height: 24, borderRadius: '50%',
                    background: `${estilo.color}1a`, color: estilo.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #fff', boxShadow: '0 0 0 1px #e9ecef',
                  }}>
                    <Icono size={12} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                      color: estilo.color, background: `${estilo.color}14`, padding: '2px 7px', borderRadius: 4,
                    }}>
                      {estilo.etiqueta}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fechaHora(evento.fecha)}</span>
                    {alcance.mostrarColumnaSucursal && evento.sucursalNombre && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {evento.sucursalNombre}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{evento.titulo}</span>
                    {evento.monto != null && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: estilo.color }}>{dinero(evento.monto)}</span>
                    )}
                  </div>

                  {(evento.detalle || evento.metodoPago) && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {evento.metodoPago && <span>Método: {evento.metodoPago}</span>}
                      {evento.detalle && <span>{evento.metodoPago ? ' · ' : ''}{evento.detalle}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
