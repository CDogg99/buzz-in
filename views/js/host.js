var ip = "localhost";

var token = Cookies.get("token");
if(!token || !jwt_decode(token).gameId){
    window.location.replace("index.html");
}

var decoded = jwt_decode(token);
var socket = io("http://" + ip + "/games", {
    query: {
        token: token
    }
});

var game, response;

window.onload = function(){
    response = document.querySelector("#response");
    initializeGame();
    document.querySelector("#accessCode").innerHTML = decoded.accessCode;
    document.querySelector("#endGameBtn").addEventListener("click", endGame);
    document.querySelector("#beginQuestionBtn").addEventListener("click", beginQuestion);
    document.querySelector("#incorrectAnsBtn").addEventListener("click", continueQuestion);
    document.querySelector("#correctAnsBtn").addEventListener("click", correctAnswer);
    document.querySelector("#endQuestionBtn").addEventListener("click", endQuestion);

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
        renderTeams();
    });

    socket.on("QUESTION_BEGAN", function(gameData, questionData){
        game = JSON.parse(gameData);
        var question = JSON.parse(questionData);
        console.log(question.currentQuestionValue + " point question began");
        renderTeams();
    });

    socket.on("CONTINUE_QUESTION", function(){
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
        renderTeams();
    });
};

function beginQuestion(){
    document.querySelector("#beginQuestionRes").innerHTML = "";
    var questionValue = document.querySelector("#questionVal").value;
    if(isNaN(questionValue) || questionValue == ""){
        document.querySelector("#beginQuestionRes").innerHTML = "Invalid point value";
        document.querySelector("#questionVal").value = "";
    }
    else{
        questionValue = parseInt(questionValue);
        socket.emit("BEGIN_QUESTION", questionValue, function(data){
            var res = JSON.parse(data);
            if(res.success){
                document.querySelector("#beginQuestionDiv").style.display = "none";
                document.querySelector("#questionResponseDiv").style.display = "block";
            }
        });
    }
}

function continueQuestion(){
    socket.emit("CONTINUE_QUESTION", function(data){
        var res = JSON.parse(data);
        if(res.success){
            response.innerHTML = "";
        }
    });
}

function correctAnswer(){
    var team = document.querySelector("#correctAnsSelect").value;
    socket.emit("END_QUESTION", team, function(data){
        var res = JSON.parse(data);
        console.log(res);
        if(res.success){
            document.querySelector("#beginQuestionDiv").style.display = "block";
            document.querySelector("#questionResponseDiv").style.display = "none";
        }
    });
}

function endQuestion(){
    socket.emit("END_QUESTION", null, function(data){
        var res = JSON.parse(data);
        console.log(res);
        if(res.success){
            document.querySelector("#beginQuestionDiv").style.display = "block";
            document.querySelector("#questionResponseDiv").style.display = "none";
        }
    });
}

function endGame(){
    socket.emit("END_GAME", function(data){
        var res = JSON.parse(data);
        if(res.success){
            Cookies.remove("token");
            window.location.replace("index.html");
        }
        else{
            response.innerHTML = res.error;
        }
    });
}

function renderTeams(){
    document.querySelector("#teams").innerHTML = "";
    document.querySelector("#correctAnsSelect").innerHTML = "";
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
        teamDiv.append(playersUL);
        document.querySelector("#teams").append(teamDiv);
        //Append teams to selector in question response segment
        var opt = document.createElement("option");
        opt.value = curTeam.id;
        opt.innerHTML = curTeam.name;
        if(i == 0){
            opt.selected = "selected";
        }
        document.querySelector("#correctAnsSelect").append(opt);
    }
}

function renderControls(){
    if(game.currentQuestionValue){
        document.querySelector("#beginQuestionDiv").style.display = "none";
        document.querySelector("#questionResponseDiv").style.display = "block";
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
                Cookies.remove("token");
                window.location.replace("index.html");
            }
        }
        else{
            game = body.game;
            renderTeams();
            renderControls();
        }
    });
}