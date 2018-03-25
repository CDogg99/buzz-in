const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const config = require("../../config/config");
const gamesController = require("./games.controller");
const util = require("../util");
const types = require("../types");

//Allows player to place themselves in a team
router.put("/team/join", (req, res)=>{
    if(req.user === null || !req.user.playerId || !req.user.accessCode){
        return res.json({error: "Not authorized"});
    }
    let teamId = req.body.teamId;
    if(!teamId){
        return res.json({error: "Team ID not set"});
    }
    gamesController.addPlayerToTeam(req.user.accessCode, teamId, req.user.playerId, (err, result)=>{
        if(err){
            return res.json({error: err.message});
        }
        if(result.modifiedCount == 1){
            res.json({success: true, message: "Updated 1 document"});
        }
        else{
            res.json({success: false, message: "Updated 0 documents"});
        }
    });
});

//Allows player to join a game
router.post("/join", (req, res)=>{
    let accessCode = req.body.accessCode;
    if(!accessCode){
        return res.json({error: "Access code not set"});
    }
    gamesController.get(accessCode, (err, result)=>{
        if(err){
            return res.json({error: err.message});
        }
        /**
         * @type {Game}
         */
        let game = result;
        let payload = {
            playerId: util.generateId(16),
            accessCode: game.accessCode
        };
        let options = {
            expiresIn: "24h"
        };
        jwt.sign(payload, config.jwt.secret, options, (err, token)=>{
            if(err){
                return res.json({error: err.message});
            }
            game._id = undefined;
            game.id = undefined;
            for(let i = 0; i < game.teams.length; i++){
                game.teams[i].players = undefined;
            }
            res.json({
                token: token,
                game: game
            });
        });
    });
});

//Creates a new game
router.post("/", (req, res)=>{
    let teams = req.body.teams;
    if(!teams){
        return res.json({error: "Teams not set"});
    }
    gamesController.create(teams, (err, result)=>{
        if(err){
            return res.json({error: err.message});
        }
        else if(result.insertedCount < 1){
            return res.json({error: "Failed to insert document"});
        }
        /**
         * @type {Game}
         */
        let game = result.ops[0];
        let payload = {
            gameId: game.id
        };
        let options = {
            expiresIn: "24h"
        };
        jwt.sign(payload, config.jwt.secret, options, (err, token)=>{
            if(err){
                return res.json({error: err.message});
            }
            game._id = undefined;
            game.id = undefined;
            res.json({
                token: token,
                game: game
            });
        });
    });
});

module.exports = router;