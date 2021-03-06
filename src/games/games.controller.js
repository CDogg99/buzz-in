const mongo = require("../mongo");
const util = require("../util");
require("../types");

const gamesController = {
    /**
     * Creates a new game object and saves it to the database
     * @param {Team[]} teams
     */
    async create(teams){
        let db;
        try {
            db = await mongo.getConnection();
        } catch (e) {
            throw e;
        }
        let collection = db.collection("games");
        for(let i = 0; i < teams.length; i++){
            teams[i].id = await util.generateId(16);
            teams[i].name = teams[i].name || "";
            teams[i].players = [];
            teams[i].points = 0;
        }
        /**
         * @type {Game}
         */
        let game = {
            id: await util.generateId(16),
            creationDate: Date.now(),
            accessCode: await util.generateAccessCode(),
            currentQuestionValue: null,
            teams: teams
        };
        let result;
        try {
            result = await collection.insertOne(game);
        } catch (e) {
            throw e;
        }
        return result;
    },

    async delete(accessCode){
        let db;
        try {
            db = await mongo.getConnection();
        } catch (e) {
            throw e;
        }
        let collection = db.collection("games");
        let query = {
            accessCode: accessCode
        };
        let result;
        try {
            result = await collection.deleteOne(query);
        } catch (e) {
            throw e;
        }
        return result;
    },

    /**
     * Updates the game's current question's point value (null if no question being asked)
     * @param {String} accessCode
     * @param {Number} value 
     */
    async updateCurrentQuestion(accessCode, value){
        let db;
        try {
            db = await mongo.getConnection();
        } catch (e) {
            throw e;
        }
        let collection = db.collection("games");
        let query = {
            accessCode: accessCode
        };
        let result;
        try {
            result = await collection.updateOne(query, {$set: {currentQuestionValue: value}});
        } catch (e) {
            throw(e);
        }
        return result;
    },

    /**
     * Adds points to a team
     * @param {String} accessCode
     * @param {String} teamId
     * @param {Number} value
     */
    async addPointsToTeam(accessCode, teamId, value){
        /**
         * @type {Game}
         */
        let game;
        try {
            game = await this.get(accessCode);
        } catch (e) {
            throw(e);
        }
        for(let i = 0; i < game.teams.length; i++){
            if(game.teams[i].id === teamId){
                game.teams[i].points += value;
                break;
            }
        }
        let db;
        try {
            db = await mongo.getConnection();
        } catch (e) {
            throw e;
        }
        let collection = db.collection("games");
        let query = {
            accessCode: accessCode
        };
        let result;
        try {
            result = await collection.updateOne(query, {$set: {teams: game.teams}});
        } catch (e) {
            throw(e);
        }
        return result;
    },

    /**
     * Gets the game with the given access code
     * @param {String} accessCode
     */
    async get(accessCode){
        let db;
        try {
            db = await mongo.getConnection();
        } catch (e) {
            throw e;
        }
        let collection = db.collection("games");
        let query = {
            accessCode: accessCode
        };
        let result;
        try {
            result = await collection.findOne(query);
        } catch (e) {
            throw e;
        }
        return result;
    },

    /**
     * Gets all games stored in the database
     */
    async getAll(){
        let db;
        try {
            db = await mongo.getConnection();
        } catch (e) {
            throw e;
        }
        let collection = db.collection("games");
        let result;
        try {
            result = await collection.find();
        } catch (e) {
            throw e;
        }
        return result;
    },

    /**
     * Moves a player to the given team
     * @param {String} accessCode
     * @param {String} teamId 
     * @param {String} playerId
     * @param {String} playerName
     */
    async movePlayerToTeam(accessCode, teamId, playerId, playerName){
        /**
         * @type {Game}
         */
        let game;
        try {
            game = await this.get(accessCode);
        } catch (e) {
            throw e;
        }
        for(let i = 0; i < game.teams.length; i++){
            let curPlayers = game.teams[i].players;
            for(let f = 0; f < curPlayers.length; f++){
                let curPlayer = curPlayers[f];
                if(curPlayer.id == playerId){
                    curPlayers.splice(f, 1);
                    break;
                }
            }
        }
        for(let i = 0; i < game.teams.length; i++){
            if(game.teams[i].id == teamId){
                /**
                 * @type {Player}
                 */
                let player = {
                    id: playerId,
                    name: playerName
                };
                game.teams[i].players.push(player);
            }
        }
        let db;
        try {
            db = await mongo.getConnection();
        } catch (e) {
            throw e;
        }
        let collection = db.collection("games");
        let query = {
            accessCode: accessCode
        };
        let result;
        try {
            result = await collection.updateOne(query, {$set: {teams: game.teams}});
        } catch (e) {
            throw e;
        }
        return result;
    },

    /**
     * Removes player from a game
     * @param {String} accessCode
     * @param {String} playerId
     */
    async removePlayer(accessCode, playerId){
        /**
         * @type {Game}
         */
        let game;
        try {
            game = await this.get(accessCode);
        } catch (e) {
            throw(e);
        }
        for(let i = 0; i < game.teams.length; i++){
            for(let f = 0; f < game.teams[i].players.length; f++){
                /**
                 * @type {Player}
                 */
                let curPlayer = game.teams[i].players[f];
                if(curPlayer.id == playerId){
                    game.teams[i].players.splice(f, 1);
                }
            }
        }
        let db;
        try {
            db = await mongo.getConnection();
        } catch (e) {
            throw e;
        }
        let collection = db.collection("games");
        let query = {
            accessCode: accessCode
        };
        let result;
        try {
            result = await collection.updateOne(query, {$set: {teams: game.teams}});
        } catch (e) {
            throw e;
        }
        return result;
    }
};

module.exports = gamesController;