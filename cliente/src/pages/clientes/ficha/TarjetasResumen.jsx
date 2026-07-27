import { ShoppingBag, Building2, Receipt, Stethoscope, AlertTriangle, CalendarClock, Eye } from 'lucide-react';
import StatCard from '../../../components/common/StatCard';
import { dinero, fecha } from './fichaUtils';

// Situación comercial y clínica del cliente en una fila de tarjetas.
//
// El total de la empresa solo se muestra al administrador: para el operador la
// cifra relevante —y la única que puede explicar— es la de su sucursal.
export default function TarjetasResumen({ resumen, estadisticas, alcance, esAdmin }) {
  const etiquetaSucursal = alcance.consolidado
    ? 'Total comprado (todas)'
    : `Total comprado (${alcance.sucursalNombre || 'sucursal'})`;

  const tarjetas = [
    {
      icon: <ShoppingBag size={20} />, color: '#3498db',
      label: etiquetaSucursal,
      value: dinero(resumen.totalCompradoSucursal),
      subtext: `${resumen.comprasSucursal} ${resumen.comprasSucursal === 1 ? 'compra' : 'compras'}`,
    },
    // Solo administrador, y solo cuando aporta algo distinto de lo ya mostrado.
    ...(esAdmin && !alcance.consolidado ? [{
      icon: <Building2 size={20} />, color: '#8e44ad',
      label: 'Total comprado (empresa)',
      value: dinero(resumen.totalCompradoEmpresa),
      subtext: `${resumen.comprasEmpresa} compras en total`,
    }] : []),
    {
      icon: <Receipt size={20} />, color: '#16a085',
      label: 'Compras registradas',
      value: resumen.comprasSucursal,
      subtext: `Promedio ${dinero(resumen.promedioCompraSucursal)}`,
    },
    {
      icon: <Stethoscope size={20} />, color: '#9b59b6',
      label: 'Historiales clínicos',
      value: estadisticas.totalHistoriales,
      subtext: estadisticas.ultimoExamen ? `Último: ${fecha(estadisticas.ultimoExamen)}` : 'Sin exámenes',
    },
    {
      icon: <AlertTriangle size={20} />, color: resumen.tieneDeuda ? '#e74c3c' : '#6b7280',
      label: 'Deuda actual',
      value: dinero(resumen.deudaEnCuentas || resumen.deudaSucursal),
      subtext: resumen.tieneDeuda ? 'Requiere gestión de cobro' : 'Sin saldo pendiente',
    },
    {
      icon: <CalendarClock size={20} />, color: '#e67e22',
      label: 'Última compra',
      value: estadisticas.ultimaCompra ? fecha(estadisticas.ultimaCompra) : '—',
      subtext: alcance.consolidado ? 'Consolidado' : 'En esta sucursal',
    },
    {
      icon: <Eye size={20} />, color: estadisticas.controlVencido ? '#e74c3c' : '#27ae60',
      label: 'Último examen visual',
      value: estadisticas.ultimoExamen ? fecha(estadisticas.ultimoExamen) : '—',
      subtext: estadisticas.controlVencido ? 'Control vencido' : 'Al día',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
      {tarjetas.map((tarjeta) => <StatCard key={tarjeta.label} {...tarjeta} />)}
    </div>
  );
}
