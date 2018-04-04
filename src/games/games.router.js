const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const config = require("../../config/config");
const gamesController = require("./games.controller");
const util = require("../util");
require("../types");

//Allows player to place themselves in a team
router.put("/:accessCode/:teamId", async (req, res)=>{
    if(req.user === null || req.user.gameId){
        return res.json({error: "Not authorized"});
    }
    let accessCode = req.params.accessCode;
    let teamId = req.params.teamId;
    let result;
    try {
        result = await gamesController.movePlayerToTeam(accessCode, teamId, req.user.playerId, req.user.name);
    } catch (e) {
        return res.json({error: e.message});
    }
    if(result.modifiedCount > 0){
        return res.json({success: true, message: `Updated ${result.modifiedCount} document`});
    }
    else{
        return res.json({error: "Updated 0 documents"});
    }
});

//Allows player to join a game
router.post("/:accessCode", async (req, res)=>{
    let name = req.body.name;
    if(!name || name === ""){
        return res.json({error: "Name not set"});
    }
    let accessCode = req.params.accessCode;
    /**
     * @type {Game}
     */
    let game;
    try {
        game = await gamesController.get(accessCode);
    } catch (e) {
        return res.json({error: e.message});
    }
    if(!game){
        return res.json({error: "Game not found"});
    }
    let payload = {
        playerId: await util.generateId(16),
        name: name,
        accessCode: accessCode
    };
    let options = {
        expiresIn: "24h"
    };
    let token = jwt.sign(payload, config.jwt.secret, options);
    game._id = undefined;
    game.id = undefined;
    return res.json({
        token: token,
        game: game
    });
});

//Creates a new game
router.post("/", async (req, res)=>{
    let teams = req.body.teams;
    if(!teams){
        return res.json({error: "Teams not set"});
    }
    let result;
    try {
        result = await gamesController.create(teams);
    } catch (e) {
        return res.json({error: e.message});
    }
    if(result.insertedCount < 1){
        return res.json({error: "Failed to insert document"});
    }
    /**
     * @type {Game}
     */
    let game = result.ops[0];
    let payload = {
        gameId: game.id,
        accessCode: game.accessCode
    };
    let options = {
        expiresIn: "24h"
    };
    let token = jwt.sign(payload, config.jwt.secret, options);
    game._id = undefined;
    game.id = undefined;
    return res.json({
        token: token,
        game: game
    });
});

module.exports = router;