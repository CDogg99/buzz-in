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
        socket.join(user.accessCode);

        socket.on("disconnect", ()=>{
            //Only send notification of socket disconnect if the player was on a team
            if(user.playerId && user.teamId){
                const promise = gamesController.removePlayer(user.accessCode, user.playerId);
                promise.then((result)=>{
                    if(result.modifiedCount > 0){
                        const gamePromise = gamesController.get(user.accessCode);
                        gamePromise.then((game)=>{
                            game._id = undefined;
                            game.id = undefined;
                            gamesNsp.to(user.accessCode).emit("PLAYER_LEFT", JSON.stringify(game), JSON.stringify({
                                playerId: user.playerId,
                                teamId: user.teamId,
                                name: user.name
                            }));
                        });
                    }
                }, (err)=>{});
            }
        });

        //******************
        //Player sent events
        //******************

        socket.on("JOIN_GAME", (teamId, callback)=>{
            if(!user.playerId){
                return callback(JSON.stringify({error: "Not authorized"}));
            }
            const promise = gamesController.movePlayerToTeam(user.accessCode, teamId, user.playerId, user.name);
            promise.then((result)=>{
                if(result.modifiedCount > 0){
                    socket.user.teamId = teamId;
                    const gamePromise = gamesController.get(user.accessCode);
                    gamePromise.then((game)=>{
                        game._id = undefined;
                        game.id = undefined;
                        gamesNsp.to(user.accessCode).emit("PLAYER_JOINED", JSON.stringify(game), JSON.stringify({
                            playerId: user.playerId,
                            teamId: user.teamId,
                            name: user.name
                        }));
                    });
                    return callback(JSON.stringify({success: true, message: `Updated ${result.modifiedCount} document`}));
                }
                else{
                    return callback(JSON.stringify({error: "Updated 0 documents"}));
                }
            }, (err)=>{
                return callback(JSON.stringify({error: err}));
            });
        });

        socket.on("BUZZ_IN", (callback)=>{
            if(!user.playerId || !user.teamId){
                return callback(JSON.stringify({error: "Not authorized"}));
            }
            const gamePromise = gamesController.get(user.accessCode);
            gamePromise.then((game)=>{
                if(game.currentQuestionValue == null){
                    return callback(JSON.stringify({error: "No current question"}));
                }
                gamesNsp.to(user.accessCode).emit("PLAYER_BUZZED", JSON.stringify(game), JSON.stringify({
                    playerId: user.playerId,
                    teamId: user.teamId,
                    name: user.name
                }));
            }, (err)=>{
                return callback(JSON.stringify({error: err}));
            });
        });

        socket.on("LEAVE_GAME", (callback)=>{
            if(!user.playerId || !user.teamId){
                return callback(JSON.stringify({error: "Not authorized"}));
            }
            const promise = gamesController.removePlayer(user.accessCode, user.playerId);
            promise.then((result)=>{
                if(result.modifiedCount > 0){
                    const gamePromise = gamesController.get(user.accessCode);
                    gamePromise.then((game)=>{
                        game._id = undefined;
                        game.id = undefined;
                        gamesNsp.to(user.accessCode).emit("PLAYER_LEFT", JSON.stringify(game), JSON.stringify({
                            playerId: user.playerId,
                            teamId: user.teamId,
                            name: user.name
                        }));
                    });
                    return callback(JSON.stringify({success: true, message: `Updated ${result.modifiedCount} document`}));
                }
                else{
                    return callback(JSON.stringify({error: "Updated 0 documents"}));
                }
            }, (err)=>{
                return callback(JSON.stringify({error: "Failed to remove player from game"}));
            });
        });

        //****************
        //Host sent events
        //****************

        socket.on("BEGIN_QUESTION", (value, callback)=>{
            if(!user.gameId){
                return callback(JSON.stringify({error: "Not authorized"}));
            }
            const promise = gamesController.updateCurrentQuestion(user.accessCode, value);
            promise.then((result)=>{
                if(result.modifiedCount > 0){
                    const gamePromise = gamesController.get(user.accessCode);
                    gamePromise.then((game)=>{
                        game._id = undefined;
                        game.id = undefined;
                        gamesNsp.to(user.accessCode).emit("QUESTION_BEGAN", JSON.stringify(game), JSON.stringify({
                            currentQuestionValue: value
                        }));
                        return callback(JSON.stringify({success: true, message: `Updated ${result.modifiedCount} document`}));
                    }, (err)=>{
                        return callback(JSON.stringify({error: err}));
                    });
                }
                else{
                    return callback(JSON.stringify({error: "Updated 0 documents"}));
                }
            }, (err)=>{
                return callback(JSON.stringify({error: err}));
            });
        });

        socket.on("CONTINUE_QUESTION", (callback)=>{
            if(!user.gameId){
                return callback(JSON.stringify({error: "Not authorized"}));
            }
            gamesNsp.to(user.accessCode).emit("CONTINUE_QUESTION");
            return callback(JSON.stringify({success: true, message: "Sent question continue message"}));
        });

        //If teamId != null, then credit the team the points for the question
        socket.on("END_QUESTION", (teamId, callback)=>{
            if(!user.gameId){
                return callback(JSON.stringify({error: "Not authorized"}));
            }
            const gamePromise = gamesController.get(user.accessCode);
            gamePromise.then((game)=>{
                if(teamId != null){
                    const addPointsPromise = gamesController.addPointsToTeam(user.accessCode, teamId, game.currentQuestionValue);
                    addPointsPromise.then((result)=>{
                        if(result.modifiedCount > 0){
                            const gamePromise2 = gamesController.get(user.accessCode);
                            gamePromise2.then((game2)=>{
                                game2._id = undefined;
                                game2.id = undefined;
                                gamesNsp.to(user.accessCode).emit("POINTS_ADDED", JSON.stringify(game2), JSON.stringify({
                                    teamId: teamId,
                                    value: game2.currentQuestionValue
                                }));
                                const updateQuestPromise = gamesController.updateCurrentQuestion(user.accessCode, null);
                                updateQuestPromise.then((results)=>{
                                    if(results.modifiedCount > 0){
                                        const gamePromise3 = gamesController.get(user.accessCode);
                                        gamePromise3.then((game3)=>{
                                            game3._id = undefined;
                                            game3.id = undefined;
                                            gamesNsp.to(user.accessCode).emit("QUESTION_ENDED", JSON.stringify(game3));
                                            return callback(JSON.stringify({success: true, message: `Updated ${results.modifiedCount} document`}));
                                        }, (err)=>{
                                            return callback(JSON.stringify({error: err}));
                                        });
                                    }
                                    else{
                                        return callback(JSON.stringify({error: "Updated 0 documents"}));
                                    }
                                }, (err)=>{
                                    return callback(JSON.stringify({error: err}));
                                });
                            }, (err)=>{
                                return callback(JSON.stringify({error: err}));
                            });
                        }
                        else{
                            return callback(JSON.stringify({error: "Updated 0 documents"}));
                        }
                    }, (err)=>{
                        return callback(JSON.stringify({error: err}));
                    });
                }
                else{
                    const updateQuestPromise = gamesController.updateCurrentQuestion(user.accessCode, null);
                    updateQuestPromise.then((results)=>{
                        if(results.modifiedCount > 0){
                            const gamePromise2 = gamesController.get(user.accessCode);
                            gamePromise2.then((game2)=>{
                                game2._id = undefined;
                                game2.id = undefined;
                                gamesNsp.to(user.accessCode).emit("QUESTION_ENDED", JSON.stringify(game2));
                                return callback(JSON.stringify({success: true, message: `Updated ${results.modifiedCount} document`}));
                            }, (err)=>{
                                return callback(JSON.stringify({error: err}));
                            });
                        }
                        else{
                            return callback(JSON.stringify({error: "Updated 0 documents"}));
                        }
                    }, (err)=>{
                        return callback(JSON.stringify({error: err}));
                    });
                }
            }, (err)=>{
                return callback(JSON.stringify({error: err}));
            });
        });

        socket.on("END_GAME", (callback)=>{
            if(!user.gameId){
                return callback(JSON.stringify({error: "Not authorized"}));
            }
            const deletePromise = gamesController.delete(user.accessCode);
            deletePromise.then((result)=>{
                if(result.deletedCount === 1){
                    gamesNsp.to(user.accessCode).emit("GAME_ENDED");
                    return callback(JSON.stringify({success: true, message: "Successfully deleted game"}));
                }
                else{
                    return callback(JSON.stringify({error: "Failed to delete game"}));
                }
            }, (err)=>{
                return callback(JSON.stringify({error: "Failed to delete game"}));
            });
        });
    });
};

module.exports = wsHandler;