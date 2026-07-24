// cliente/src/components/shared/DrawerDetalle.jsx
import { X } from 'lucide-react';

export default function DrawerDetalle({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 720,
}) {
  if (!open) return null;

  return (
    <div className="finance-drawer-overlay" onMouseDown={onClose}>
      <aside
        className="finance-drawer"
        style={{ width }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="finance-drawer__header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="btn-icon" type="button" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>
        <div className="finance-drawer__body">{children}</div>
      </aside>
    </div>
  );
}
