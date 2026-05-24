import usuarioSalidaCommandPuerto from "../../aplicacion/puertos/salida/UsuarioSalidaCommandPuerto.js";
import { conectaBD, conectarMongo } from '../base-dato/MongoDb.js'
import { ObjectId } from 'mongodb';

export default class UsuarioMongoCommandAdaptador extends usuarioSalidaCommandPuerto {
    
    guardar = async (usuario) => {
        try {
            await conectarMongo();
            const db = conectaBD();
            const collection = db.collection("usuarios");
            
            const documento = {
                nombre: usuario.nombre,
                createdAt: new Date()
            };
            
            const result = await collection.insertOne(documento);
            
            // Asignar el _id generado como id del usuario
            usuario.id = result.insertedId.toString();
            
            console.log('Usuario guardado en MongoDB: ', usuario.nombre);
            
            return {
                estado: "ok",
                resultado: "Se guardó con éxito en MongoDB: " + usuario.nombre
            };
            
        } catch (error) {
            console.error('Error al guardar usuario en MongoDB:', error);
            return {
                estado: "error",
                resultado: "Error al guardar en MongoDB: " + error.message
            };
        }
    }
    
    actualizar = async (usuario) => {
        try {
            await conectaBD();
            const db = conectaBD();
            const collection = db.collection("usuarios");
            
            // Verificar si el usuario existe
            const existe = await collection.findOne({_id: new ObjectId(usuario.id)});
            
            if (!existe) {
                return {
                    estado: "error",
                    resultado: `No se encontró el usuario con ID ${usuario.id}`
                };
            }
            
            // Actualizar el usuario
            await collection.updateOne(
                { _id: new ObjectId(usuario.id) },
                { 
                    $set: { 
                        nombre: usuario.nombre,
                        updatedAt: new Date()
                    } 
                }
            );
            
            console.log('Usuario actualizado en MongoDB: ', usuario.nombre);
            return {
                estado: "ok",
                resultado: `Usuario con ID ${usuario.id} actualizado a: ${usuario.nombre}`
            };
            
        } catch (error) {
            console.error('Error al actualizar usuario en MongoDB:', error);
            return {
                estado: "error",
                resultado: "Error al actualizar en MongoDB: " + error.message
            };
        }
    }
    
    eliminar = async (id) => {
        try {
            await conectaBD();
            const db = conectaBD();
            const collection = db.collection("usuarios");
            
            // Verificar si el usuario existe
            const existe = await collection.findOne({ _id: new ObjectId(id) });
            
            if (!existe) {
                return {
                    estado: "error",
                    resultado: `No se encontró el usuario con ID ${id}`
                };
            }
            
            // Eliminar el usuario
            await collection.deleteOne({ _id: new ObjectId(id) });
            
            console.log('Usuario eliminado de MongoDB, ID:', id);
            return {
                estado: "ok",
                resultado: `Usuario con ID ${id} eliminado exitosamente`
            };
            
        } catch (error) {
            console.error('Error al eliminar usuario de MongoDB:', error);
            return {
                estado: "error",
                resultado: "Error al eliminar en MongoDB: " + error.message
            };
        }
    }
}