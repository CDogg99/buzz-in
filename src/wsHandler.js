let io = require("socket.io");
const jwt = require("jsonwebtoken");

const gamesController = require("./games/games.controller");
const config = require("../config/config");

const wsHandler = (server)=>{
    io = io(server);

    const gamesNsp = io.of("/games");

    gamesNsp.use((socket, next)=>{
        const token = socket.handshake.query.token;
        if(token){
            jwt.verify(token, config.jwt.secret, (err, payload)=>{
                if(err){
                    return next(new Error("Not authorized"));
                }
                else{
                    socket.user = payload;
                    return next();
                }
            });
        }
        else{
            return next(new Error("Authorization token not set"));
        }
    });

    gamesNsp.on("connection", (socket)=>{
        const user = socket.user;

        if(user.gameId){
            socket.join(user.accessCode);
        }

        //******************
        //Player sent events
        //******************

        socket.on("JOIN_GAME", async (teamId)=>{
            if(!user.playerId){
                return socket.send(JSON.stringify({error: "Not authorized"}));
            }
            let result;
            try {
                result = await gamesController.movePlayerToTeam(user.accessCode, teamId, user.playerId, user.name);
            } catch(e) {
                return socket.send(JSON.stringify({error: e}));
            }
            if(result.modifiedCount > 0){
                socket.user.teamId = teamId;
                socket.join(user.accessCode);
                gamesNsp.to(user.accessCode).emit("PLAYER_JOINED", JSON.stringify({
                    playerId: user.playerId,
                    teamId: teamId,
                    name: user.name
                }));
                return socket.send(JSON.stringify({success: true, message: `Updated ${result.modifiedCount} document`}));
            }
            else{
                return socket.send(JSON.stringify({error: "Updated 0 documents"}));
            }
        });

        socket.on("BUZZ_IN", async ()=>{
            if(!user.playerId || !user.teamId){
                return socket.send(JSON.stringify({error: "Not authorized"}));
            }
            let result;
            try {
                result = await gamesController.get(user.accessCode);
            } catch (e) {
                return socket.send(JSON.stringify({error: e}));
            }
            if(result.currentQuestionValue == null){
                return socket.send(JSON.stringify({error: "No current question"}));
            }
            gamesNsp.to(user.accessCode).emit("PLAYER_BUZZED", JSON.stringify({
                playerId: user.playerId,
                teamId: user.teamId,
                name: user.name
            }));
        });

        socket.on("LEAVE_GAME", async ()=>{
            if(!user.playerId || !user.teamId){
                return socket.send(JSON.stringify({error: "Not authorized"}));
            }
            let result;
            try {
                result = await gamesController.removePlayer(user.accessCode, user.playerId);
            } catch (e) {
                throw(e);
            }
            if(result.modifiedCount > 0){
                gamesNsp.to(user.accessCode).emit("PLAYER_LEFT", JSON.stringify({
                    
                }));
                return socket.send(JSON.stringify({success: true, message: `Updated ${result.modifiedCount} document`}));
            }
            else{
                return socket.send(JSON.stringify({error: "Updated 0 documents"}));
            }
        });

        //****************
        //Host sent events
        //****************

        socket.on("BEGIN_QUESTION", async (value)=>{
            if(!user.gameId){
                return socket.send(JSON.stringify({error: "Not authorized"}));
            }
            let result;
            try {
                result = await gamesController.updateCurrentQuestion(user.accessCode, value);
            } catch (e) {
                return socket.send(JSON.stringify({error: e}));
            }
            if(result.modifiedCount > 0){
                gamesNsp.to(user.accessCode).emit("QUESTION_BEGAN", JSON.stringify({
                    currentQuestionValue: value
                }));
                return socket.send(JSON.stringify({success: true, message: `Updated ${result.modifiedCount} document`}));
            }
            else{
                return socket.send(JSON.stringify({error: "Updated 0 documents"}));
            }
        });

        socket.on("CONTINUE_QUESTION", async ()=>{
            if(!user.gameId){
                return socket.send(JSON.stringify({error: "Not authorized"}));
            }
            gamesNsp.to(user.accessCode).emit("CONTINUE_QUESTION");
        });

        //If teamId != null, then credit the team the points for the question
        socket.on("END_QUESTION", async (teamId)=>{
            if(!user.gameId){
                return socket.send(JSON.stringify({error: "Not authorized"}));
            }
            let game;
            try {
                game = await gamesController.get(user.accessCode);
            } catch (e) {
                return socket.send(JSON.stringify({error: e}));
            }
            if(teamId != null){
                let result;
                try {
                    result = await gamesController.addPointsToTeam(user.accessCode, teamId, game.currentQuestionValue);
                } catch (e) {
                    return socket.send(JSON.stringify({error: e}));
                }
                if(result.modifiedCount > 0){
                    gamesNsp.to(user.accessCode).emit("POINTS_ADDED", JSON.stringify({
                        teamId: teamId,
                        value: game.currentQuestionValue
                    }));
                }
                else{
                    return socket.send(JSON.stringify({error: "Updated 0 documents"}));
                }
            }
            let results;
            try {
                results = await gamesController.updateCurrentQuestion(user.accessCode, null);
            } catch (e) {
                return socket.send(JSON.stringify({error: e}));
            }
            if(results.modifiedCount > 0){
                gamesNsp.to(user.accessCode).emit("QUESTION_ENDED");
                return socket.send(JSON.stringify({success: true, message: `Updated ${results.modifiedCount} document`}));
            }
            else{
                return socket.send(JSON.stringify({error: "Updated 0 documents"}));
            }
        });

        socket.on("END_GAME", async ()=>{
            if(!user.gameId){
                return socket.send(JSON.stringify({error: "Not authorized"}));
            }
        });
    });
};

module.exports = wsHandler;
