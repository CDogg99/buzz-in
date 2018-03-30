const mongodb = require("mongodb").MongoClient;
const config = require("../config/config");

let connection = null;

const mongo = {

    /**
     * Creates a new connection to the MongoDB database
     * @return {Promise<undefined>}
     */
    async createConnection(){
        try {
            const db = await mongodb.connect(config.database.url);
            connection = db.db("buzzIn");
        } catch (e) {
            throw e;
        }
    },

    async getConnection(){
        if(connection === null){
            try {
                await this.createConnection();
            } catch (e) {
                throw e;
            }
            return connection;
        }
        else{
            return connection;
        }
    }

};

module.exports = mongo;