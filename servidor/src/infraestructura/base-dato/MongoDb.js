import {MongoClient} from 'mongodb';
const url = 'mongodb://mongo:27017';
const cliente = new MongoClient(url);
const dbNombre = "hexagonalBD";
let db;
const conectarMongo = async() => {
    await cliente.connect();
    db = cliente.db(dbNombre);
}
const conectaBD =() => db;
export {
    conectarMongo,
    conectaBD
}