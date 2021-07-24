//INITIALIZE STORAGE GAME VARIABLE
function Continue(){    
    var game_tictactoe = {};
    game_tictactoe.bool_isfirstplayer = 1;
    
    var select_level =  document.getElementById('select_level').value;
    game_tictactoe.n = parseInt(select_level);
    game_tictactoe.firstPlayer = "X";
    
    localStorage.game_tictactoe = JSON.stringify(game_tictactoe);
    
    window.location.href='playGame.html';
}


window.onload = function init(){ 
    if(typeof(localStorage.game_tictactoe) !== "undefined"){ 
        localStorage.clear();    
    } 
}  