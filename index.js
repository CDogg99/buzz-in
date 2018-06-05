const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const http = require("http");

const authenticate = require("./src/middleware/authenticate");
const deleteOldDocs = require("./src/middleware/deleteOldDocs");
const routers = require("./src/routers");
const wsHandler = require("./src/wsHandler");

const app = express();
const port = process.env.PORT || 80;

app.use(express.static(path.join(__dirname, "views")));
app.use(cors());
app.use(bodyParser.json());
app.use(deleteOldDocs);
app.use(authenticate);
app.use("/api/games", routers.gamesRouter);
app.use("/", (req, res)=>{
    res.status(404).sendFile(path.join(__dirname+"/views/pageNotFound.html"));
});

const server = http.createServer(app);
wsHandler(server);
server.listen(port, ()=>{
    console.log("Server running on port " + port);
});