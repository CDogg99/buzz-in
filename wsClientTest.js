const WebSocket = require("ws");

const options = {
    headers:{
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF5ZXJJZCI6ImpFS2xjUllGcmI3cURHMHkiLCJuYW1lIjoiSm9obiBTbWl0aCIsImlhdCI6MTUyMjQzNTQ1NSwiZXhwIjoxNTIyNTIxODU1fQ.gmGncnBaIUrNF5dOxHBLnXmYqky-AOD3b4MmqyHoiqg"
    }
};

const ws = new WebSocket("ws://localhost", options);

ws.on("message", (message)=>{
    console.log(message);
});

ws.on("error", (err)=>{
    console.log(err.message);
});