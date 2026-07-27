// Utilidades compartidas por los bloques de la Ficha del Cliente.

export const dinero = (valor) => {
  const numero = parseFloat(valor ?? 0);
  return Number.isNaN(numero) ? '$0.00' : `$${numero.toFixed(2)}`;
};

export const fecha = (valor) => {
  if (!valor) return '—';
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fechaHora = (valor) => {
  if (!valor) return '—';
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const edad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const nacimiento = new Date(fechaNacimiento);
  if (Number.isNaN(nacimiento.getTime())) return null;
  const hoy = new Date();
  let anios = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) anios -= 1;
  return anios >= 0 && anios < 130 ? anios : null;
};

export const iniciales = (nombres, apellidos) =>
  `${(nombres || '').trim().charAt(0)}${(apellidos || '').trim().charAt(0)}`.toUpperCase() || '?';

// Color estable derivado del nombre, para que el avatar no cambie entre visitas.
export const colorAvatar = (texto = '') => {
  const paleta = ['#3498db', '#9b59b6', '#16a085', '#e67e22', '#2980b9', '#8e44ad', '#27ae60'];
  const suma = [...texto].reduce((total, caracter) => total + caracter.charCodeAt(0), 0);
  return paleta[suma % paleta.length];
};

export const badge = (fondo, color) => ({
  display: 'inline-block', padding: '2px 10px', borderRadius: 20,
  fontSize: 11, fontWeight: 700, background: fondo, color, whiteSpace: 'nowrap',
});

export const BADGE_ESTADO_PAGO = {
  PAGADA:    badge('#d4edda', '#155724'),
  PENDIENTE: badge('#fff3cd', '#856404'),
  PARCIAL:   badge('#cce5ff', '#004085'),
  ANULADA:   badge('#f8d7da', '#721c24'),
};

export const BADGE_ESTADO_CUENTA = {
  ACTIVA:    badge('#fff3cd', '#856404'),
  PENDIENTE: badge('#fff3cd', '#856404'),
  PARCIAL:   badge('#cce5ff', '#004085'),
  VENCIDA:   badge('#f8d7da', '#721c24'),
  CANCELADA: badge('#d4edda', '#155724'),
};

// Un teléfono ecuatoriano local (09xxxxxxxx) necesita el prefijo país para wa.me.
export const enlaceWhatsapp = (numero, mensaje = '') => {
  const limpio = String(numero || '').replace(/\D/g, '');
  if (!limpio) return null;
  const internacional = limpio.startsWith('593') ? limpio : `593${limpio.replace(/^0/, '')}`;
  return `https://wa.me/${internacional}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''}`;
};

// Tonos de los indicadores de estado del cliente. El backend decide qué estados
// aplican; aquí solo se traduce el tono a color.
export const TONO = {
  exito:   { bg: '#d4edda', color: '#155724' },
  peligro: { bg: '#f8d7da', color: '#721c24' },
  alerta:  { bg: '#fff3cd', color: '#856404' },
  info:    { bg: '#cce5ff', color: '#004085' },
  neutro:  { bg: '#e9ecef', color: '#495057' },
};

// Identidad visual del método de pago, para leer la tabla de compras de un vistazo.
export const ESTILO_METODO_PAGO = {
  EFECTIVO:      { bg: '#d1fae5', color: '#065f46' },
  TARJETA:       { bg: '#fce8ff', color: '#7c3aed' },
  TRANSFERENCIA: { bg: '#dbeafe', color: '#1e40af' },
  CREDITO:       { bg: '#fef3c7', color: '#92400e' },
  MIXTO:         { bg: '#e0e7ff', color: '#3730a3' },
};

// Agrupa eventos por día y les pone un encabezado relativo legible.
export const agruparPorDia = (eventos) => {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const grupos = new Map();

  eventos.forEach((evento) => {
    const cuando = new Date(evento.fecha);
    if (Number.isNaN(cuando.getTime())) return;
    const dia = new Date(cuando); dia.setHours(0, 0, 0, 0);
    const clave = dia.toISOString().slice(0, 10);
    if (!grupos.has(clave)) grupos.set(clave, { clave, dia, eventos: [] });
    grupos.get(clave).eventos.push(evento);
  });

  return [...grupos.values()]
    .sort((a, b) => b.dia - a.dia)
    .map((grupo) => ({ ...grupo, titulo: tituloRelativo(grupo.dia, hoy) }));
};

const tituloRelativo = (dia, hoy) => {
  const dias = Math.round((hoy - dia) / 86400000);
  if (dias <= 0) return 'Hoy';
  if (dias === 1) return 'Ayer';
  if (dias < 7) return `Hace ${dias} días`;
  if (dias < 30) {
    const semanas = Math.floor(dias / 7);
    return `Hace ${semanas} ${semanas === 1 ? 'semana' : 'semanas'}`;
  }
  if (dias < 365) {
    const meses = Math.floor(dias / 30);
    return `Hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  }
  const anios = Math.floor(dias / 365);
  return `Hace ${anios} ${anios === 1 ? 'año' : 'años'}`;
};
