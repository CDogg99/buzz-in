var token = Cookies.get("token");
if(token){
    var decoded = jwt_decode(token);
    if(decoded.playerId){
        window.location.replace("game.html");
    }
    else if(decoded.gameId){
        window.location.replace("host.html");
    }
}

var numTeamsSelector, submitButton, response;

window.onload = function(){
    numTeamsSelector = document.querySelector("#numTeamsSelector");
    submitButton = document.querySelector("#submitCreateForm");
    response = document.querySelector("#createFormResponse");

    numTeamsSelector.addEventListener("change", function(){
        updateNumInputs(parseInt(this.value));
    });
    submitButton.addEventListener("click", function(){
        response.innerHTML = "";
        createGame();
    });
};

function updateNumInputs(num){
    var inputs = document.querySelector("#inputs");
    inputs.innerHTML = "";
    for(var i = 1; i <= num; i++){
        var tmp = document.createElement("input");
        tmp.setAttribute("type", "text");
        tmp.setAttribute("id", "team"+i);
        tmp.setAttribute("placeholder", "Team "+i);
        inputs.appendChild(tmp);
    }
}

function createGame(){
    var teams = [];
    for(var i = 1; i <= parseInt(numTeamsSelector.value); i++){
        var curName = document.querySelector("#team"+i).value;
        if(!curName){
            response.innerHTML = "Team name missing";
            return;
        }
        else{
            teams[i-1] = {name: curName};
        }
    }
    var body = {
        teams: teams
    };
    var headers = new Headers({
        "Content-Type": "application/json"
    });
    var options = {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
        mode: "cors"
    };
    fetch("http://localhost/api/games", options).then(function(res){
        return res.json();
    }).then(function(body){
        if(body.error){
            response.innerHTML = body.error;
        }
        else{
            Cookies.set("token", body.token, {expires: 1});
            window.location.replace("host.html");
        }
    });
}