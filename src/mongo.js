const mongodb = require("mongodb").MongoClient;
const config = require("../config/config");

let connection = null;

const mongo = {

    async createConnection(){
        let db;
        try {
            db = await mongodb.connect(config.database.url);
        } catch (e) {
            throw e;
        }
        connection = db.db("buzzIn");
    },

    async getConnection(){
        if(connection !== null){
            return connection;
        }
        else {
            try {
                await this.createConnection();
            } catch (e) {
                throw e;
            }
            return connection;
        }
    }

};

module.exports = mongo;