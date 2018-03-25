const mongodb = require("mongodb").MongoClient;
const config = require("../config/config");

let connection = null;

const mongo = {

    createConnection: (callback)=>{
        mongodb.connect(config.database.url, (err, db)=>{
            if(err){
                return callback(err);
            }
            connection = db.db();
            callback(null);
        });
    },

    getConnection: (callback)=>{
        if(connection === null){
            mongo.createConnection((err)=>{
                if(err){
                    return callback(err, null);
                }
                callback(null, connection);
            });
        }
        else{
            callback(null, connection);
        }
    }

};

module.exports = mongo;