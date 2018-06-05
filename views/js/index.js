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

var submitButton, response;

window.onload = function(){
    submitButton = document.querySelector("#submitJoinForm");
    response = document.querySelector("#joinFormResponse");

    submitButton.addEventListener("click", function(){
        response.innerHTML = "";
        joinGame();
    });
};

function joinGame(){
    var name = document.querySelector("#name").value;
    var accessCode = document.querySelector("#accessCode").value;
    if(!name || !accessCode){
        response.innerHTML = "Please fill out all fields";
        return;
    }
    var body = {
        name: name
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
    fetch("http://localhost/api/games/"+accessCode, options).then(function(res){
        return res.json();
    }).then(function(body){
        if(body.error){
            response.innerHTML = body.error;
        }
        else{
            Cookies.set("token", body.token, {expires: 1});
            window.location.replace("game.html");
        }
    });
}