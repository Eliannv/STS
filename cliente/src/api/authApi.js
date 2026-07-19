/**
 * authApi.js — Capa de acceso a datos para autenticación.
 * Separa la lógica de red del componente UI (principio hexagonal:
 * el adaptador de entrada [UI] no habla directo con el servidor).
 *
 * Nota: la creación de usuarios requiere rol ADMINISTRADOR en el backend
 * (POST /api/v1/usuarios protegido por authMiddleware).
 * El token se inyecta automáticamente por api.js desde localStorage.
 */
import { api } from './api';

/**
 * Autentica un usuario y devuelve { token, usuario } en res.data.resultado.
 * @param {string} email
 * @param {string} password
 */
export function loginApi(email, password) {
    return api.post('/usuarios/login', { email, password });
}

/**
 * Crea un nuevo usuario (solo accesible con rol ADMINISTRADOR).
 * @param {{ cedula, nombre, apellido, correo, password, rol, sucursal_id }} datos
 */
export function crearUsuarioApi(datos) {
    return api.post('/usuarios', datos);
}
