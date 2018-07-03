var ip = "localhost";

var token = Cookies.get("token");
if(!token || !jwt_decode(token).playerId){
    window.location.replace("index.html");
}

var decoded = jwt_decode(token);
var socket = io("http://" + ip + "/games", {
    query: {
        token: token
    }
});

var hasJoinedTeam = false;
var game, response;

window.onload = function(){
    response = document.querySelector("#response");
    initializeGame();
    document.querySelector("#welcome").innerHTML = "Welcome, " + decoded.name;
    document.querySelector("#leaveGameBtn").addEventListener("click", leaveGame);
    document.querySelector("#buzzInBtn").addEventListener("click", buzzIn);

    socket.on("PLAYER_JOINED", function(gameData, playerData){
        game = JSON.parse(gameData);
        var player = JSON.parse(playerData);
        console.log(player.name + " joined the game");
        renderTeams();
    });

    socket.on("PLAYER_LEFT", function(gameData, playerData){
        game = JSON.parse(gameData);
        var player = JSON.parse(playerData);
        console.log(player.name + " left the game");
        renderTeams();
    });

    socket.on("PLAYER_BUZZED", function(gameData, playerData){
        game = JSON.parse(gameData);
        var player = JSON.parse(playerData);
        console.log(player.name + " buzzed in");
        response.innerHTML = player.name + " buzzed in!";
        document.querySelector("#buzzInBtn").disabled = "disabled";
        renderTeams();
    });

    socket.on("QUESTION_BEGAN", function(gameData, questionData){
        game = JSON.parse(gameData);
        var question = JSON.parse(questionData);
        console.log(question.currentQuestionValue + " point question began");
        response.innerHTML = question.currentQuestionValue + " point question began";
        if(document.querySelector("#buzzInBtn").disabled){
            document.querySelector("#buzzInBtn").removeAttribute("disabled");
        }
        renderTeams();
    });

    socket.on("CONTINUE_QUESTION", function(){
        if(document.querySelector("#buzzInBtn").disabled){
            document.querySelector("#buzzInBtn").removeAttribute("disabled");
        }
        response.innerHTML = "";
        console.log("Continue question");
    });

    socket.on("POINTS_ADDED", function(gameData, pointData){
        game = JSON.parse(gameData);
        var points = JSON.parse(pointData);
        console.log(points);
        console.log(points.value + " points added to " + points.teamId);
        renderTeams();
    });

    socket.on("QUESTION_ENDED", function(gameData){
        game = JSON.parse(gameData);
        document.querySelector("#buzzInBtn").disabled = "disabled";
        response.innerHTML = "";
        renderTeams();
    });

    socket.on("GAME_ENDED", function(){
        Cookies.remove("token");
        window.location.replace("index.html");
    });
};

function buzzIn(){
    socket.emit("BUZZ_IN", function(data){
        var res = JSON.parse(data);
        console.log(res);
    });
}

function leaveGame(){
    socket.emit("LEAVE_GAME", function(data){
        Cookies.remove("token");
        window.location.replace("index.html");
    });
}

function renderTeams(){
    document.querySelector("#teams").innerHTML = "";
    var teams = game.teams;
    teams.sort(function(a, b){
        return b.points - a.points;
    });
    var curRank = 1;
    var numSkips = 1;
    for(var i = 0; i < teams.length; i++){
        var curTeam = teams[i];
        var teamDiv = document.createElement("div");
        var nameH2 = document.createElement("h2");
        nameH2.innerHTML = curTeam.name;
        var playersUL = document.createElement("ul");
        for(var f = 0; f < curTeam.players.length; f++){
            var curPlayer = curTeam.players[f].name;
            var nameLI = document.createElement("li");
            nameLI.innerHTML = curPlayer;
            playersUL.append(nameLI);
        }
        teamDiv.append(nameH2);
        var rankH2 = document.createElement("h2");
        if(i == 0){
            rankH2.innerHTML = "#" + curRank + " - " + curTeam.points + " points";
        }
        else{
            var prevPoints = teams[i-1].points;
            if(prevPoints != curTeam.points){
                curRank += numSkips;
                numSkips = 1;
            }
            else{
                numSkips++;
            }
            rankH2.innerHTML = "#" + curRank + " - " + curTeam.points + " points";
        }
        teamDiv.append(rankH2);
        //Only player needs a join button
        if(!hasJoinedTeam){
            var joinBtn = document.createElement("button");
            joinBtn.setAttribute("class", "teamSelectBtn");
            joinBtn.setAttribute("data-team-id", curTeam.id);
            joinBtn.innerHTML = "Join";
            joinBtn.addEventListener("click", function(){
                var teamId = this.getAttribute("data-team-id");
                socket.emit("JOIN_GAME", teamId, function(data){
                    var res = JSON.parse(data);
                    if(res.success){
                        hasJoinedTeam = true;
                        document.querySelector("#buzzInBtn").removeAttribute("hidden");
                    }
                });
            });
            teamDiv.append(joinBtn);
        }
        teamDiv.append(playersUL);
        document.querySelector("#teams").append(teamDiv);
    }
}

function initializeGame(){
    var accessCode = decoded.accessCode;
    var options = {
        method: "GET",
        mode: "cors"
    };
    fetch("http://" + ip + "/api/games/"+accessCode, options).then(function(res){
        return res.json();
    }).then(function(body){
        if(body.error){
            response.innerHTML = body.error;
            if(body.error == "Game not found"){
                leaveGame();
            }
        }
        else{
            game = body.game;
            renderTeams();
        }
    });
}