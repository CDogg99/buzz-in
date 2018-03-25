const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");

const config = require("./config/config");
const routers = require("./src/routers");

const app = express();
const port = process.env.PORT || 80;

app.use(express.static(path.join(__dirname, "views")));
app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next)=>{
    const token = req.header("Authorization");
    if(token){
        jwt.verify(token, config.jwt.secret, (err, payload)=>{
            if(err){
                req.user = null;
                next();
            }
            else{
                req.user = payload;
                next();
            }
        });
    }
    else{
        req.user = null;
        next();
    }
});
app.use("/api/games", routers.gamesRouter);
app.use("/", (req, res)=>{
    //Send back 404 html page later
    res.status(404).send("HTTP 404");
});
app.listen(port, ()=>{
    console.log("Server running on port " + port);
});