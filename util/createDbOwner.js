const mongodb = require("mongodb").MongoClient;
const config = require("../config/config");

mongodb.connect("mongodb://localhost:27017/buzzIn", (err, client)=>{
    if(err) throw err;
    client.db().addUser(config.database.username, config.database.password, {roles: [{role: "dbOwner", db: "buzzIn"}]}, (err, result)=>{
        if(err) throw err;
        console.log("Database owner created");
        process.exit();
    });
});