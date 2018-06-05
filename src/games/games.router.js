const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const config = require("../../config/config");
const gamesController = require("./games.controller");
const util = require("../util");
require("../types");

//Gets a game's data
router.get("/:accessCode", async (req, res)=>{
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
    game._id = undefined;
    game.id = undefined;
    return res.json({
        game: game
    });
});

//Creates a player token
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
    return res.json({
        token: token
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
    return res.json({
        token: token
    });
});

module.exports = router;