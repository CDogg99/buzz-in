var token = Cookies.get("token");
if(!token || !jwt_decode(token).playerId){
    window.location.replace("index.html");
}

var decoded = jwt_decode(token);
var socket = io("http://localhost/games", {
    query: {
        token: token
    }
});

var game, response, joinTeamBtns;

socket.on("message", function(data){
    console.log(JSON.parse(data));
});

socket.on("error", function(data){
    console.log(JSON.parse(data));
});

window.onload = function(){
    getGame();
    document.querySelector("#welcome").innerHTML = "Welcome, " + decoded.name + ".";
    response = document.querySelector("#response");
    joinTeamBtns = document.querySelector("#joinTeamBtns");
    document.querySelector("#leaveGameBtn").addEventListener("click", leaveGame);
};

//Also close WS connection and make player leave the game and team
function leaveGame(){
    Cookies.remove("token");
    window.location.replace("index.html");
}

function renderTeamSelect(){
    joinTeamBtns.innerHTML = "";
    var info = document.createElement("h3");
    info.innerHTML = "Team selection";
    joinTeamBtns.append(info);
    var teams = game.teams;
    for(var i = 0; i < teams.length; i++){
        var div = document.createElement("div");
        var teamSelectBtn = document.createElement("button");
        teamSelectBtn.setAttribute("class", "teamSelectBtn");
        teamSelectBtn.setAttribute("data-team-id", teams[i].id);
        teamSelectBtn.innerHTML = teams[i].name;
        div.append(teamSelectBtn);
        joinTeamBtns.append(div);
    }
    var btns = document.querySelectorAll(".teamSelectBtn");
    for(var i = 0; i < btns.length; i++){
        btns[i].addEventListener("click", function(){
            var teamId = this.getAttribute("data-team-id");
            socket.emit("JOIN_GAME", teamId);
        });
    }
}

function getGame(){
    var accessCode = decoded.accessCode;
    var options = {
        method: "GET",
        mode: "cors"
    };
    fetch("http://localhost/api/games/"+accessCode, options).then(function(res){
        return res.json();
    }).then(function(body){
        if(body.error){
            response.innerHTML = body.error;
        }
        else{
            game = body.game;
            if(playerOnTeam()){

            }
            else{
                renderTeamSelect();
            }
        }
    });
}

function playerOnTeam(){
    for(var t = 0; t < game.teams.length; t++){
        var curTeam = game.teams[t];
        for(var p = 0; p < curTeam.players.length; p++){
            if(curTeam.players[p].id == decoded.playerId){
                return true;
            }
        }
    }
    return false;
}