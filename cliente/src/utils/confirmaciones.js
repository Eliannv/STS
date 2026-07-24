// cliente/src/utils/confirmaciones.js
import Swal from 'sweetalert2';

export function extraerMensajeError(respuesta, fallback = 'Error inesperado') {
  return respuesta?.data?.mensaje
    || respuesta?.data?.resultado
    || respuesta?.data?.error?.message
    || fallback;
}

function normalizarConfirmacion(configuracion, titulo, boton, valoresIniciales) {
  if (typeof configuracion === 'string') {
    return {
      ...valoresIniciales,
      text: configuracion,
      title: titulo || valoresIniciales.title,
      confirmButtonText: boton || valoresIniciales.confirmButtonText,
    };
  }
  return { ...valoresIniciales, ...(configuracion || {}) };
}

export async function confirmarAccionDestructiva(configuracion, titulo, boton) {
  const {
    title,
    text,
    confirmButtonText,
  } = normalizarConfirmacion(configuracion, titulo, boton, {
    title: '¿Confirmar acción?',
    text: 'Esta acción requiere confirmación.',
    confirmButtonText: 'Confirmar',
  });
  const resultado = await Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonColor: '#e74c3c',
    cancelButtonColor: '#6c757d',
    confirmButtonText,
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
  });
  return resultado.isConfirmed;
}

export async function confirmarAccion(configuracion, titulo, boton) {
  const {
    title,
    html,
    text,
    confirmButtonText,
  } = normalizarConfirmacion(configuracion, titulo, boton, {
    title: '¿Continuar?',
    confirmButtonText: 'Confirmar',
  });
  const resultado = await Swal.fire({
    icon: 'question',
    title,
    html,
    text,
    showCancelButton: true,
    confirmButtonColor: '#2980b9',
    cancelButtonColor: '#6c757d',
    confirmButtonText,
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
  });
  return resultado.isConfirmed;
}

export function notificarExito(mensaje, titulo = 'Operación completada') {
  return Swal.fire({
    icon: 'success',
    title: titulo,
    text: mensaje,
    timer: 2600,
    showConfirmButton: false,
  });
}

export function notificarError(error, fallback = 'Error inesperado') {
  const mensaje = typeof error === 'string'
    ? error
    : error?.message || extraerMensajeError(error, fallback);
  return Swal.fire({ icon: 'error', title: 'Error', text: mensaje || fallback });
}

export function notificarAdvertencia(mensaje, titulo = 'Atención') {
  return Swal.fire({ icon: 'warning', title: titulo, text: mensaje });
}
