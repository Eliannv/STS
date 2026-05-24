import usuarioSalidaQueryPuerto from "../../aplicacion/puertos/salida/UsuarioSalidaQueryPuerto.js";
import { conectaBD, conectarMongo } from '../base-dato/MongoDb.js'

export default class UsuarioPgsQueryAdaptador extends usuarioSalidaQueryPuerto {
    lista = async() => {
        await conectarMongo();
        this.db = conectaBD();
        this.collection = this.db.collection("usuarios");
        const data = await this.collection
            .find()
            .toArray();
        return {
            estado: "ok",
            resultado: data
        }
    }
}