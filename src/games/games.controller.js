const mongo = require("../mongo");
const util = require("../util");
const types = require("../types");

const gamesController = {
    /**
     * @param {Team[]} teams
     * @param {Function} callback
     */
    create(teams, callback){
        mongo.getConnection((err, db)=>{
            if(err){
                return callback(err, null);
            }
            db.collection("games", (err, collection)=>{
                if(err){
                    return callback(err, null);
                }
                for(let i = 0; i < teams.length; i++){
                    teams[i].id = util.generateId(16);
                    teams[i].name = teams[i].name || "";
                    teams[i].players = [];
                    teams[i].points = 0;
                }
                /**
                 * @type {Game}
                 */
                let game = {
                    id: util.generateId(16),
                    accessCode: util.generateAccessCode(),
                    teams: teams
                };
                collection.insertOne(game, (err, result)=>{
                    if(err){
                        return callback(err, null);
                    }
                    callback(null, result);
                });
            });
        });
    },

    /**
     * @param {String} accessCode 
     * @param {Function} callback
     */
    get(accessCode, callback){
        mongo.getConnection((err, db)=>{
            if(err){
                return callback(err, null);
            }
            db.collection("games", (err, collection)=>{
                if(err){
                    return callback(err, null);
                }
                let query = {
                    accessCode: accessCode
                };
                collection.findOne(query, (err, result)=>{
                    if(err){
                        return callback(err, null);
                    }
                    callback(null, result);
                });
            });
        });
    },

    /**
     * @param {String} accessCode
     * @param {String} teamId 
     * @param {String} playerId
     * @param {Function} callback 
     */
    addPlayerToTeam(accessCode, teamId, playerId, callback){
        this.get(accessCode, (err, result)=>{
            if(err){
                return callback(err, null);
            }
            /**
             * @type {Game}
             */
            let game = result;
            let onTeamAlready = false;
            for(let i = 0; i < game.teams.length; i++){
                let curPlayers = game.teams[i].players;
                if(curPlayers.indexOf(playerId) > -1){
                    onTeamAlready = true;
                    break;
                }
            }
            if(!onTeamAlready){
                for(let i = 0; i < game.teams.length; i++){
                    let curTeam = game.teams[i];
                    if(curTeam.id == teamId){
                        game.teams[i].players.push(playerId);
                    }
                }
            }
            mongo.getConnection((err, db)=>{
                if(err){
                    return callback(err, null);
                }
                db.collection("games", (err, collection)=>{
                    if(err){
                        return callback(err, null);
                    }
                    let query = {
                        accessCode: accessCode
                    };
                    collection.updateOne(query, {$set: {teams: game.teams}}, (err, result)=>{
                        if(err){
                            return callback(err, null);
                        }
                        callback(null, result);
                    });
                });
            });
        });
    }
};

module.exports = gamesController;