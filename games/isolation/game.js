// Game template
module.exports = function () {
  this.state = {
    // Store information about the state of the game/match here
    board : {}
  };
  this.first_player = 0; // Player #1 goes first in the first game, will rotate for next games
  this.current_player = this.first_player;
  this.invalid_move = false;
  var self = this;

  this.is_valid_square = function(position) {
    if (!position || !position.length || position.length!=2) {
      return false;
    }
    if (position[0]<0 || position[0]>7 || position[1]<0 || position[1]>5) {
    	return false;
    }
    return true;
  };
  this.is_empty_square = function(position) {
    return (this.is_valid_square(position) && this.state.board[ position[0] ][ position[1] ]==null);
  };
  this.available_moves = function(position) {
    var i,moves = [];
    var border=[ [-1,-1],[-1,0],[-1,1], [0,-1],[0,1], [1,-1],[1,0],[1,1] ];
    for (i=0; i<border.length; i++) {
      var sq = [ position[0]+border[i][0], position[1]+border[i][1] ];
      if (this.is_empty_square(sq)) {
        moves.push(sq);
      }
    }
    return moves;
  };
  this.is_valid_move = function(current,move) {
    // Is it empty?
    if (!this.is_empty_square(move)) { return false; }
    // Is it only one square away?
    return (Math.abs(current[0]-move[0])<=1 && Math.abs(current[1]-move[1])<=1);
  };
  this.start_match = function (players, config, scenario) {
    // Return match-level data
    return {};
  };

  this.start_game = function (results) {
    // Initialize the board
    this.state.board = [
        [null,null,0,null,null,null],
        [null,null,null,null,null,null],
        [null,null,null,null,null,null],
        [null,null,null,null,null,null],
        [null,null,null,null,null,null],
        [null,null,null,null,null,null],
        [null,null,null,null,null,null],
        [null,null,null,1,null,null]
      ];
    this.player_positions = [ [0,2],[7,3] ];
    
    this.invalid_move = false;

    // Increment the player to start first next game
    this.first_player = 1 - this.first_player;

    // Return data to pass to the players to tell them
    // about the starting game state, if any.
    return {
      player_data : [{}, {}]
    };
  };

  // Return a json structure to render
  this.render = function (render_type) {
    if ("text/plain" == render_type) {
      // Render a plain text version of the board
      var b="";
      for (var i=0; i<8; i++) {
        for (var j=0; j<6; j++) {
            if (this.state.board[i][j]==null) { b+="."; }
            if (this.state.board[i][j]==0) { b+="X"; }
            if (this.state.board[i][j]==1) { b+="O"; }
            if (this.state.board[i][j]==-1) { b+="#"; }
        }
        b+="\n";
      }
      return b;
    } else {
      // Otherwise return JSON for rendering by the host environment
      return this.state.board;
    }
  };

  // Tell the game controller which player should move next and
  // pass that player the game state
  this.get_next_move = function () {
    // Switch to the next player
    this.current_player = 1 - this.current_player;
    return {
      player_number : this.current_player,
      data : {
        board : this.state.board,
        player_number : this.current_player,
        my_position: this.player_positions[this.current_player],
        opponent_position: this.player_positions[1-this.current_player]
      }
    };
  };

  // Accept a move from a player
  this.move = function (player_number, move) {
    // Validate move
    if (move===null || !move || !move.length || move.length!=2) {
      this.invalid_move = player_number;
      throw "Invalid Move, bad syntax!";
    }
    if (!this.is_valid_square(move[0])) {
      this.invalid_move = player_number;
      throw "Invalid Move - Out of bounds!";
    }
    if (!this.is_valid_square(move[1])) {
      this.invalid_move = player_number;
      throw "Invalid Move - Out of bounds!";
    }

    // Validate the player move and update
    if (!this.is_empty_square(move[1])) {
      this.invalid_move = player_number;
      throw "Invalid Move - Square is not empty!";
    }
    // check to make sure the move is next to the player
    var current_position = this.player_positions[player_number];
    if (!this.is_valid_move(current_position,move[1])) {
      this.invalid_move = player_number;
      throw "Invalid Move - Move is not adjacent to current position!";
    }
    // Update the board to mark the old position as empty
    this.state.board[current_position[0]][current_position[1]] = null;
    // Update the board with the move
    this.state.board[move[1][0]][move[1][1]] = player_number;
    // Update the position of the player
    this.player_positions[player_number] = move[1];
    
    // Validate and update the square to block
    if (!this.is_empty_square(move[0])) {
      this.invalid_move = player_number;
      throw "Invalid Move - Square is not empty!";
    }
    // Update the square to be erased
    this.state.board[move[0][0]][move[0][1]] = -1;
    
  };

  // If the game is over, return the results
  this.is_game_over = function () {
    if (this.invalid_move !== false) {
      // The last move was invalid, game is over
      return {
        winner : (1 - this.invalid_move)
      };
    }
    
    // Did the opponent get isolated?
    var opp = 1-this.current_player;
    var opp_position = this.player_positions[opp];
    if (this.available_moves(opp_position).length==0) {
      // There is a winner
      return {
        winner : this.current_player
      };
    }

    // Game is not over
    return false;
  };

  this.end_game = function (game_results) {};

  this.end_match = function (match_results) {};

};

