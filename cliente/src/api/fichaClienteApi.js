/**
 * fichaClienteApi.js — Acceso a la Ficha del Cliente.
 *
 * Toda la ficha se resuelve con una única petición al agregador; el backend
 * consulta en paralelo facturación, caja y usuarios reenviando el token y la
 * sucursal activa. No se debe volver a consultar los endpoints individuales
 * desde esta pantalla.
 */
import { api } from './api';

export function cargarFichaCliente(clienteId) {
  return api.get(`/clientes/${clienteId}/ficha`);
}
