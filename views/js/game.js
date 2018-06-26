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

var hasJoinedTeam = false;
var game, response;

window.onload = function(){
    document.querySelector("#welcome").innerHTML = "Welcome, " + decoded.name;
    document.querySelector("#leaveGameBtn").addEventListener("click", leaveGame);
    response = document.querySelector("#response");
    initializeGame();

    socket.on("PLAYER_JOINED", function(gameData, playerData){
        game = JSON.parse(gameData);
        var player = JSON.parse(playerData);
        console.log(player.name + " joined the game");
        renderLeaderboard();
        renderTeams();
    });

    socket.on("PLAYER_LEFT", function(gameData, playerData){
        game = JSON.parse(gameData);
        var player = JSON.parse(playerData);
        console.log(player.name + " left the game");
        renderLeaderboard();
        renderTeams();
    });

    socket.on("PLAYER_BUZZED", function(gameData, playerData){
        game = JSON.parse(gameData);
        var player = JSON.parse(playerData);
        console.log(player.name + " buzzed in");
        //Display player name above buzz in button and disable the button to prevent further buzzes
        renderLeaderboard();
        renderTeams();
    });
};

//Also close WS connection and make player leave the game and team
function leaveGame(){
    socket.emit("LEAVE_GAME", function(data){
        Cookies.remove("token");
        window.location.replace("index.html");
    });
}

function renderGameHUD(){
    document.querySelector("#gameHUD").innerHTML = "";
    var button = document.createElement("button");
    button.id = "buzzInBtn";
    button.innerHTML = "BUZZ IN";
    button.addEventListener("click", function(){
        socket.emit("BUZZ_IN", function(data){
            var res = JSON.parse(data);
            console.log(res);
        });
    });
    document.querySelector("#gameHUD").append(button);
}

function renderTeams(){
    document.querySelector("#teams").innerHTML = "";
    var teams = game.teams;
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
                        renderGameHUD();
                    }
                });
            });
            teamDiv.append(joinBtn);
        }
        teamDiv.append(playersUL);
        document.querySelector("#teams").append(teamDiv);
    }
}

function renderLeaderboard(){
    document.querySelector("#leaderboard").innerHTML = "";
    var teams = game.teams;
    teams.sort(function(a, b){
        return b.points - a.points;
    });
    var table = document.createElement("table");
    var thead = document.createElement("thead");
    var trHead = document.createElement("tr");
    var rank = document.createElement("th");
    rank.innerHTML = "#";
    var team = document.createElement("th");
    team.innerHTML = "Team";
    var points = document.createElement("th");
    points.innerHTML = "Points";
    trHead.append(rank);
    trHead.append(team);
    trHead.append(points);
    thead.append(trHead);
    table.append(thead);
    var tbody = document.createElement("tbody");
    var curRank = 1;
    var numSkips = 1;
    for(var i = 0; i < teams.length; i++){
        var curTeam = teams[i];
        var tr = document.createElement("tr");
        var rankTd = document.createElement("td");
        if(i == 0){
            rankTd.innerHTML = curRank;
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
            rankTd.innerHTML = curRank;
        }
        var nameTd = document.createElement("td");
        nameTd.innerHTML = curTeam.name;
        var pointsTd = document.createElement("td");
        pointsTd.innerHTML = curTeam.points;
        tr.append(rankTd);
        tr.append(nameTd);
        tr.append(pointsTd);
        tbody.append(tr);
    }
    table.append(tbody);
    document.querySelector("#leaderboard").append(table);
}

function initializeGame(){
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
            if(body.error == "Game not found"){
                leaveGame();
            }
        }
        else{
            game = body.game;
            renderLeaderboard();
            renderTeams();
        }
    });
}