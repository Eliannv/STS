// src/aplicacion/puertos/salida/UsuarioSalidaCommandPuerto.js
export default class UsuarioSalidaCommandPuerto {
  buscarPorEmail(email)            { throw new Error('buscarPorEmail no implementado') }
  guardar(usuario)                 { throw new Error('guardar no implementado') }
  actualizar(usuario)              { throw new Error('actualizar no implementado') }
  eliminar(id)                     { throw new Error('eliminar no implementado') }
  actualizarPassword(id, passHash) { throw new Error('actualizarPassword no implementado') }
}