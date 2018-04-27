// Player template
module.exports = function () {

  // Required method - move()
  // This is an example move() method to get you started. You will need to
  // add code to avoid error conditions, and to implement an algorithm 
  // better than "random"!
  this.move = function (game, player_number) {
    var self = this;
    
    // Pick the first available move
    var valid_moves = this.available_moves(game.my_position, game.board);
    var move = valid_moves[0];
    
    // Pick a random available square to block
    // TODO: There are some problems with this code. Think carefully!
    var i,j;
    for (i of self.shuffleArray([0,1,2,3,4,5,6,7])) {
      for (j of self.shuffleArray([0,1,2,3,4,5])) {
        if (self.is_empty_square([i,j],game.board)) {
          // MAKE THE MOVE!
          // return [ [block], [move] ]
          return [ [i,j], move ];
        }
      };
    };
  };
  
  // Optional methods
  this.start_match = function(data) {   };
  this.start_game = function(data) {   };
  this.end_game = function(results) {   };
  this.end_match = function(results) {   };

  // Utility Functions!
  // ==================
  // These functions may help you in writing game logic!

  // Return a random integer up to and including max
  this.random = function(max) {
    return Math.floor(Math.random() * (max+1));
  };
  
  // Randomly shuffle an array in-place
  this.shuffleArray = function(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };
  
  // Given a [row,col] position, return true if it's in the bounds of the board, else false
  this.is_valid_square = function(position) {
    if (!position || !position.length || position.length!=2) {
      return false;
    }
    if (position[0]<0 || position[0]>7 || position[1]<0 || position[1]>5) {
      return false;
    }
    return true;
  };
  
  // Given a [row,col] position and the board JSON, return true if the position is empty (available), else false
  this.is_empty_square = function(position, board) {
    return (this.is_valid_square(position) && board[ position[0] ][ position[1] ]==null);
  };
  
  // Given a [row,col] position, return the possible [row,col] moves you can make
  this.available_moves = function(position, board) {
    var i,moves = [];
    var border=[ [-1,-1],[-1,0],[-1,1], [0,-1],[0,1], [1,-1],[1,0],[1,1] ];
    for (i=0; i<border.length; i++) {
      var sq = [ position[0]+border[i][0], position[1]+border[i][1] ];
      if (this.is_empty_square(sq, board)) {
        moves.push(sq);
      }
    }
    return moves;
  };
  
}
