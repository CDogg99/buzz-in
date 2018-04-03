var numTeamsSelector;

window.onload = function(){
    numTeamsSelector = document.querySelector("#numTeamsSelector");
    numTeamsSelector.addEventListener("change", function(){
        updateNumInputs(parseInt(this.value));
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