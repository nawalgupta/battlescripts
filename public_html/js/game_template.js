// Game template
module.exports = function () {
  this.state = {
    // Store information about the state of the game/match here
    board : {}
  };
  this.first_player = 0; // Player #1 goes first in the first game, will rotate for next games
  this.current_player = this.first_player;
  this.invalid_move = false;

  this.start_match = function (players, config, scenario) {
    // Return match-level data
    return {};
  };

  this.start_game = function (results) {
    // Initialize the board
    this.state.board = {};
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
      return "[Game Board in text]";
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
        player_number : this.current_player
      }
    };
  };

  // Accept a move from a player
  this.move = function (player_number, move) {
    // Validate move
    if (move === null) {
      this.invalid_move = player_number;
      throw "Invalid Move!";
    }
    // Update the board with the move
    this.state.board[move] = player_number;
  };

  // If the game is over, return the results
  this.is_game_over = function () {
    if (this.invalid_move !== false) {
      // The last move was invalid, game is over
      return {
        winner : (1 - this.invalid_move)
      };
    }
    // There is a winner
    return {
      winner : 0
    };

    // Game is a draw
    return {
      draw : true
    };

    // Game is not over
    return false;
  };

  this.end_game = function (game_results) {};

  this.end_match = function (match_results) {};

};
