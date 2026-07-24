// cliente/src/components/shared/ResumenFinanciero.jsx
import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';
import { FMT } from '../../utils/formato';

export default function ResumenFinanciero({
  ingresos = 0,
  egresos = 0,
  balance = Number(ingresos || 0) - Number(egresos || 0),
}) {
  const items = [
    { label: 'Ingresos', valor: ingresos, color: '#27ae60', icono: <ArrowDownLeft size={15} /> },
    { label: 'Egresos', valor: egresos, color: '#e74c3c', icono: <ArrowUpRight size={15} /> },
    { label: 'Balance', valor: balance, color: Number(balance) >= 0 ? '#2980b9' : '#e74c3c', icono: <Scale size={15} /> },
  ];

  return (
    <div className="finance-summary">
      {items.map(({ label, valor, color, icono }) => (
        <div key={label} className="finance-summary__chip" style={{ color }}>
          {icono}
          <span>{label}</span>
          <strong>{FMT(valor)}</strong>
        </div>
      ))}
    </div>
  );
}
