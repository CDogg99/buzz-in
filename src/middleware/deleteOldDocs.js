const mongo = require("../mongo");

const deleteOldDocs = async (req, res, next)=>{
    let db;
    try {
        db = await mongo.getConnection();
    } catch (e) {
        next();
    }
    if(db){
        let filter = {
            creationDate: { $lte: Date.now() - 24*1000*60*60}
        }; 
        let collection = db.collection("games");
        let result;
        try {
            result = await collection.deleteMany(filter);
        } catch (e) {
            next();
        }
        if(result){
            next();
        }
    }
};

module.exports = deleteOldDocs;