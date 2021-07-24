window.onload = function init(){
    //alert(localStorage.game_tictactoe);
    if(typeof(localStorage.game_tictactoe) !== "undefined"){ 
        var game_tictactoe = localStorage.getItem("game_tictactoe");
        game_tictactoe = JSON.parse(game_tictactoe);
        if(game_tictactoe.bool_isfirstplayer){
            document.getElementById("instructions").innerHTML = "Player 1 will start first: player 1 click below to start gaining your moves!";
        }
        else{
            document.getElementById("instructions").innerHTML = "Player 2 click below to start gaining your moves!";
        }
    } 
}


function gainMovesLoader(){
    window.location.href='gain_moves_game.html';
}


  