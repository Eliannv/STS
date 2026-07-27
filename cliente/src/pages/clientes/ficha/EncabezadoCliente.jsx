import { Phone, Mail, MessageCircle, Briefcase, IdCard, MapPin, Building2 } from 'lucide-react';
import { edad, iniciales, colorAvatar, badge, TONO } from './fichaUtils';
import { Dato } from './fichaUI';

// Identidad del cliente de un vistazo: quién es, cómo contactarlo y en qué
// estado está. Lo primero que necesita el empleado al atenderlo.
export default function EncabezadoCliente({ cliente, alcance, esAdmin, estados = [] }) {
  const nombre = `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`.trim();
  const anios = edad(cliente.fecha_nacimiento);
  const color = colorAvatar(nombre);

  return (
    <div className="card" style={{ padding: 20, display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
        background: `${color}1a`, color, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 22, fontWeight: 700,
      }}>
        {iniciales(cliente.nombres, cliente.apellidos)}
      </div>

      <div style={{ flex: 1, minWidth: 260 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{nombre || 'Cliente'}</h1>
          {/* Los estados los calcula el agregador con sus propios umbrales;
              aquí solo se pintan. */}
          {estados.map((estado) => {
            const tono = TONO[estado.tono] ?? TONO.neutro;
            return <span key={estado.clave} style={badge(tono.bg, tono.color)}>{estado.etiqueta}</span>;
          })}
          {cliente.es_consumidor_final && <span style={badge('#e9ecef', '#495057')}>Consumidor final</span>}
        </div>

        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
          {cliente.cedula && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><IdCard size={13} /> {cliente.cedula}</span>}
          {anios != null && <span>{anios} años</span>}
          {cliente.ocupacion && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Briefcase size={13} /> {cliente.ocupacion}</span>}
          {cliente.ciudad && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={13} /> {cliente.ciudad}</span>}
          {/* La sucursal en curso solo interesa al administrador: el operador
              siempre está en la suya y mostrarla sería ruido. */}
          {esAdmin && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Building2 size={13} /> {alcance.consolidado ? 'Todas las sucursales' : (alcance.sucursalNombre || '—')}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
          <Dato label="Teléfono">
            {cliente.telefono
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={12} /> {cliente.telefono}</span>
              : '—'}
          </Dato>
          <Dato label="WhatsApp">
            {cliente.whatsapp
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#25D366', fontWeight: 600 }}><MessageCircle size={12} /> {cliente.whatsapp}</span>
              : '—'}
          </Dato>
          <Dato label="Correo">
            {cliente.email
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Mail size={12} /> {cliente.email}</span>
              : '—'}
          </Dato>
          <Dato label="Contacto preferido">{cliente.preferencia_contacto || '—'}</Dato>
        </div>

        {cliente.observaciones && (
          <div style={{
            marginTop: 12, padding: '8px 12px', background: '#fffbeb',
            border: '1px solid #fde68a', borderRadius: 6, fontSize: 12, color: '#92400e',
          }}>
            <strong>Observaciones:</strong> {cliente.observaciones}
          </div>
        )}
      </div>
    </div>
  );
}
