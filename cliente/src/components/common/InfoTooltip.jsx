import { Info } from 'lucide-react';
import './InfoTooltip.css';

export default function InfoTooltip({ title, children, icon }) {
  return (
    <span className="info-tooltip-container">
      {icon || <Info size={20} className="info-icon" />}
      <span className="info-tooltip">
        {title && <h6 className="tooltip-title">{title}</h6>}
        {typeof children === 'string' ? <p className="tooltip-text">{children}</p> : children}
      </span>
    </span>
  );
}
