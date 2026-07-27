import { PlusCircle, Stethoscope, Handshake, Pencil, Printer, MessageCircle, Phone } from 'lucide-react';
import { enlaceWhatsapp } from './fichaUtils';

// Barra fija con las acciones del día a día. Todas reutilizan la navegación y los
// modales existentes: la ficha no implementa flujos propios.
export default function BarraAccionesRapidas({ cliente, acciones, navigate, onNuevoHistorial, onEditarCliente, onImprimir }) {
  const whatsapp = enlaceWhatsapp(cliente.whatsapp || cliente.telefono);
  const telefono = cliente.telefono || cliente.whatsapp;

  const botones = [
    { label: 'Nueva venta', icon: <PlusCircle size={15} />, color: '#3498db', onClick: () => navigate(`/facturas/nueva?clienteId=${cliente.id}`), visible: acciones.nuevaVenta },
    { label: 'Nuevo historial', icon: <Stethoscope size={15} />, color: '#9b59b6', onClick: onNuevoHistorial, visible: acciones.nuevoHistorial },
    { label: 'Cobrar deuda', icon: <Handshake size={15} />, color: '#e74c3c', onClick: () => navigate(`/cuentas-cobrar?clienteId=${cliente.id}`), visible: acciones.verCuentaPorCobrar },
    { label: 'Editar cliente', icon: <Pencil size={15} />, color: '#6c757d', onClick: onEditarCliente, visible: true },
    { label: 'Imprimir ficha', icon: <Printer size={15} />, color: '#16a085', onClick: onImprimir, visible: true },
    { label: 'WhatsApp', icon: <MessageCircle size={15} />, color: '#25D366', href: whatsapp, visible: Boolean(whatsapp) },
    { label: 'Llamar', icon: <Phone size={15} />, color: '#2980b9', href: telefono ? `tel:${telefono}` : null, visible: Boolean(telefono) },
  ].filter((boton) => boton.visible);

  const estilo = (color) => ({
    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px',
    borderRadius: 7, border: `1px solid ${color}33`, background: `${color}0f`,
    color, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
    textDecoration: 'none', whiteSpace: 'nowrap',
  });

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 5,
      display: 'flex', gap: 8, flexWrap: 'wrap',
      padding: '10px 14px', marginBottom: 16,
      background: '#fff', border: '1px solid var(--border-color, #e9ecef)', borderRadius: 10,
    }}>
      {botones.map((boton) => boton.href
        ? <a key={boton.label} href={boton.href} target="_blank" rel="noreferrer" style={estilo(boton.color)}>{boton.icon}{boton.label}</a>
        : <button key={boton.label} onClick={boton.onClick} style={estilo(boton.color)}>{boton.icon}{boton.label}</button>
      )}
    </div>
  );
}
