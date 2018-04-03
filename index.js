const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const http = require("http");

const authenticate = require("./src/authenticate");
const routers = require("./src/routers");
const mongo = require("./src/mongo");
const wsHandler = require("./src/wsHandler");

const app = express();
const port = process.env.PORT || 80;

app.use(express.static(path.join(__dirname, "views")));
app.use(cors());
app.use(bodyParser.json());
app.use(authenticate);
app.use("/api/games", routers.gamesRouter);
app.use("/", (req, res)=>{
    //Send back 404 html page later
    res.status(404).send("HTTP 404");
});
const server = http.createServer(app);
wsHandler(server);
server.listen(port, async ()=>{
    try {
        await mongo.createConnection();
    } catch (e) {
        console.log("Failed to connect to MongoDB database");
    }
    console.log("Server running on port " + port);
});