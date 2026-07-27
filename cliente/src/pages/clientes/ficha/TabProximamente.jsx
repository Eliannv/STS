import { Clock } from 'lucide-react';

// Pestañas cuyo backend aún no existe. El estado se lee de accionesDisponibles
// del agregador: no se inventan datos ni se simulan flujos.
export default function TabProximamente({ titulo, descripcion, estado }) {
  return (
    <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%', background: '#f1f3f5',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
      }}>
        <Clock size={24} color="#adb5bd" />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{titulo}</div>
      <div style={{
        display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
        background: '#eef2ff', color: '#4338ca', padding: '3px 10px', borderRadius: 4, marginBottom: 12,
      }}>
        PRÓXIMAMENTE
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto' }}>
        {descripcion}
      </div>
      {estado?.motivo && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, fontStyle: 'italic' }}>
          {estado.motivo}
        </div>
      )}
    </div>
  );
}
