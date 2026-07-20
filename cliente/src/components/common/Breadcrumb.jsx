import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Breadcrumb({ items }) {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 10 }}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <ChevronRight size={13} style={{ color: '#adb5bd' }} />}
            {isLast ? (
              <span style={{ color: '#495057', fontWeight: 600 }}>{item.label}</span>
            ) : (
              <button
                type="button"
                onClick={() => item.href && navigate(item.href)}
                style={{
                  background: 'none', border: 'none', cursor: item.href ? 'pointer' : 'default',
                  color: item.href ? '#1a56db' : '#6c757d', fontWeight: item.href ? 500 : 400,
                  padding: 0, fontSize: 13,
                }}
              >
                {item.label}
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}
