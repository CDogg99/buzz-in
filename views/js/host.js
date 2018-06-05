var token = Cookies.get("token");
if(!token || !jwt.decode(token).gameId){
    window.location.replace("index.html");
}