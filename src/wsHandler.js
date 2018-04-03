const WebSocket = require("ws");
const jwt = require("jsonwebtoken");

const config = require("../config/config");

const webSocket = (server)=>{
    const wss = new WebSocket.Server({ 
        server: server,
        verifyClient: (info, callback)=>{
            const token = info.req.headers.token;
            if(token){
                jwt.verify(token, config.jwt.secret, (err, payload)=>{
                    if(err){
                        callback(false, 500, "Internal server error occured when verifying token");
                    }
                    else if(payload){
                        info.req.user = payload;
                        callback(true);
                    }
                });
            }
            else{
                callback(false, 401, "Unauthorized");
            }
        }
    });
    
    wss.on("connection", (ws, req) => {
        const user = req.user;
        ws.on("message", (message) => {
            console.log('received: %s', message);
            ws.send(`Hello, you sent -> ${message}`);
        });
        ws.send(`Connected as ${user.playerId}`);
    });
    
    wss.on("error", (err)=>{
        console.log(err.message);
    });
};

module.exports = webSocket;