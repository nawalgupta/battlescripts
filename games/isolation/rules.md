# Isolation

The goal of **Isolation** is to trap your opponent so they have no available moves. The first player to become trapped loses.

### Game Play

The game is played on a 6x8 grid, with one player starting at the top and the other at the bottom.

For each player's turn, they take two actions: (1) Move to a square directly connected to the square they are in (in any direction, horizontal, vertical, diagonal), then (2) Make an empty square unplayable.

Your player cannot move to a square that has been made unplayable, and it cannot move to the same square as your opponent. It is important to note that the player move happens first, then the block. This means that you could potentially move your player, then block the square you were just in.

### Game Data

Your player's move() function will be passed an object like this as the first argument:
```
{
  player_number: 0 // 0 or 1 depending on which player you are
  ,my_position: [0,2] // A 2-element array containing the row and column of your player
  ,opponent_position: [7,3] // A 2-element array containing the row and column of your opponent
  ,board: [ // An array of arrays with board data
    [null,null, 0  ,null,null,null],
    [null,null,null,null,null,null],
    [null,null,null,null,null,null],
    [null,null,null,null,null,null],
    [null,null,null,null,null,null],
    [null,null,null,null,null,null],
    [null,null,null,null,null,null],
    [null,null,null, 1  ,null,null],
  ]
}
```

The example above is the starting condition of the game. Player 0's position is `[0,2]` and Player 1's starting position is `[7,3]`. Your player will alternate between being player 0 and player 1 for each game played.

The value of each square on the board will be `null` if it is empty, `-1` if it has been blocked, and `0` or `1` if a player is in the square.

The second argument to your move() function is your player number. You can use this to determine whether each location on the board is your player or your opponent's.

### Making A Move

Your move() fuction must return an array containing two elements: The square you wish to block and the square you wish to move to.

For example: `[ [2,3] , [4,5] ]`

To be a valid move on the board, each must be in the range [0-7,0-5]. If your player returns an invalid move (either off the board, bad syntax, or moving in a square that is not empty) then you lose the game immediately.

### Winning The Game

The game is over when a player has no squares to move to. The other player then wins.

### Player Template

Creating a new player begins with a template that contains the correct syntax and several helpful utility methods. This will simplify the coding aspect of your player and allow you to quickly start coding an algorithm to win!
