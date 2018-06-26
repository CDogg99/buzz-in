var token = Cookies.get("token");
if(!token || !jwt.decode(token).gameId){
    window.location.replace("index.html");
}

var decoded = jwt_decode(token);
var socket = io("http://localhost/games", {
    query: {
        token: token
    }
});