// src/components/common/StatCard.jsx
export default function StatCard({ icon, label, value, color, subtext }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 10, border: '1px solid #e9ecef',
      padding: '14px 18px', display: 'flex', alignItems: 'center', gap: icon ? 14 : 0,
      height: '100%', boxSizing: 'border-box',
    }}>
      {icon && (
        <div style={{ width: 44, height: 44, borderRadius: 10, background: color + '1a',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
          {icon}
        </div>
      )}
      <div>
        <div style={{ fontSize: 11, color: '#6c757d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#2c3e50', marginTop: 2 }}>{value}</div>
        {subtext && <div style={{ fontSize: 11, color: '#6c757d', marginTop: 2 }}>{subtext}</div>}
      </div>
    </div>
  );
}