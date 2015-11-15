Tasks = new Mongo.Collection("tasks");
Boards = new Mongo.Collection("boards");

// Board indices
// 0 1 2
// 3 4 5
// 6 7 8

function isInt(n){
    return Number(n) === n && n % 1 === 0;
}

function checkBoard(array) {
    row_0 = array[0] + array[1] + array[2];
    if(row_0 == -3) return -1;
    if(row_0 == 3) return 1;
    
    row_1 = array[3] + array[4] + array[5];
    if(row_1 == -3) return -1;
    if(row_1 == 3) return 1;
    
    row_2 = array[6] + array[7] + array[8];
    if(row_2 == -3) return -1;
    if(row_2 == 3) return 1;
    
    col_0 = array[0] + array[3] + array[6];
    if(col_0 == -3) return -1;
    if(col_0 == 3) return 1;
    
    col_1 = array[1] + array[4] + array[7];
    if(col_1 == -3) return -1;
    if(col_1 == 3) return 1;
    
    col_2 = array[2] + array[5] + array[8];
    if(col_2 == -3) return -1;
    if(col_2 == 3) return 1;
    
    diag_0 = array[0] + array[4] + array[8];
    if(diag_0 == -3) return -1;
    if(diag_0 == 3) return 1;
    
    diag_1 = array[2] + array[4] + array[6];
    if(diag_1 == -3) return -1;
    if(diag_1 == 3) return 1;

    var marked = 0;
    var i = 0;
    for(i=0; i<9; i++) {
	if(array[i] != 0)
	    marked++;
    }
    if(marked == 9)
	return 2;
    
    return 0;
}

function updateBoard(_id, message) {
    Boards.update({ _id : _id },
		  { $set: {message : message} },
		  function(err, doc) {
		      if(err || !doc) {
			  console.log("Failed to set board: " + err);
		      }
		  });
}

function updateBoard(_id, array, player, message) {
    Boards.update({ _id : _id },
		  { $set: {array : array, message : message, player : player} },
		  function(err, doc) {
		      if(err || !doc) {
			  console.log("Failed to set board: " + err);
		      }
		  });
}

function updateBoard(_id, array, player, winner, message) {
    Boards.update({ _id : _id },
		  { $set: {array : array, message : message, winner : winner, player : player} },
		  function(err, doc) {
		      if(err || !doc) {
			  console.log("Failed to set board: " + err);
		      }
		  });
}

function updateWinner(_id, array, winner) {
    Boards.update({ _id : _id },
		  { $set: {array : array, message : "", winner : winner} },
		  function(err, doc) {
		      if(err || !doc) {
			  console.log("Failed to set board: " + err);
		      }
		  });
}

if (Meteor.isClient) {
    Template.body.helpers({
	squares: function(row) {
	    board = Boards.findOne();
	    squares = [];
	    
	    if(!board) {
		console.log("Failed to find board");
		return squares;
	    }
	    
	    if(row < 0 || row > 2) {
		return squares;
	    }

	    var i = 0;
	    for(i=0; i<3; i++) {
		var position = 3 * row + i;
		switch(board.array[position]) {
		case 1:
		    // Player 1
		    var obj = { x : i, y : row, t : "X"};
		    squares.push(obj);
		    break;
		case -1:
		    // Player 2
		    var obj = { x : i, y : row, t : "O"};
		    squares.push(obj);
		    break;
		default:
		    // Empty
		    var obj = { x : i, y : row, t : " "};
		    squares.push(obj);
		    break;
		}
	    }
	    console.log(squares);
	    return squares;
	},
	message: function() {
	    board = Boards.findOne();
	    if(!board)
		return "";
	    
	    return board.message;
	},
	to_move: function() {
	    board = Boards.findOne();
	    if(!board)
		return "Failed to find board";
	    if(board.winner == -1)
		return "Player 2 wins";
	    if(board.winner == 1)
		return "Player 1 wins";
	    if(board.winner == 2)
		return "Draw";
	    if(board.player == -1)
		return "Player 2 to move";
	    if(board.player == 1)
		return "Player 1 to move";
	    return "";
	}
    });
    
    Template.body.events({
	"submit .new-task": function(event) {
	    event.preventDefault();

	    var text = event.target.text.value;
	    Tasks.insert({
		text : text,
		createdAt : new Date()
	    });

	    event.target.text.value = "";
	}
    });

    Template.task.events({
	"click .toggle-checked": function () {
	    // Set the checked property to the opposite of its current value
	    Tasks.update(this._id, {
		$set: {checked: ! this.checked}
	    });
	},
	"click .delete": function () {
	    Tasks.remove(this._id);
	}
    });

    Template.square.events({
	"click": function() {
	    var player = window.location.pathname;
	    if(player) {
		if(player.length > 1) {
		    if(player[0] = "/")
			player = player.substring(1);
		    Meteor.call("setToken", player, this.x, this.y);	    
		}
	    }
	}
    });

    Template.square.helpers({
	td_attributes : function(x, y) {
	    var c="square center-text";
	    if(x > 0)
		c += " l"
	    if(y > 0)
		c += " t"
	    if(x < 2)
		c += " r"
	    if(y < 2)
		c += " b"
	    return {
		class : c
	    };
	}
    });

    Template.reset.events({
	"click": function() {
	    var player = window.location.pathname;
	    if(player) {
		if(player.length > 1) {
		    if(player[0] = "/")
			player = player.substring(1);
		    Meteor.call("clearBoard", player);	    
		}
	    }
	}
    });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
      // code to run on server at startup
      board = Boards.findOne();
      if(!board) {
	  board = {
	      array : [ 0, 0, 0,
			0, 0, 0,
			0, 0, 0 ],
	      player : 1,
	      winner : 0,
	      message : ""
	  };
	  Boards.insert(board, function(err, doc) {
	      if(err || !doc) {
		  console.log("Failed to create game board: " + err);
	      }
	  });
      }
  });
}

Meteor.methods({
    clearBoard: function(player) {
	if(player == "player1" || player == "player2") {
	    board = Boards.findOne();
	    if(board) {
		if(board.winner != 0) {
		    array = [0, 0, 0,
			     0, 0, 0,
			     0, 0, 0];
		    updateBoard(board._id, array, 1, 0, "Board reset");
		    console.log("ITS SET TO 0");
		}
	    }
	}
    },
    setToken: function(player, x, y) {
	// Find board
	board = Boards.findOne();
	if(!board) {
	    console.log("Board not found");
	    return;
	}
	if(board.winner != 0) {
	    return;
	}
	// Check if ints
	if(!isInt(x) || !isInt(y)) {
	    updateBoard(board._id, "Unknown position");
	    return;
	}
	array = board.array;
	position = 3 * y + x;
	// Check range
	if(position > 8 || position < 0) {
	    updateBoard(board._id, "Unknown position");
	    return;
	}
	// Check player
	if(player == "player1") {
	    if(board.player == 1 && array[position] == 0) {
		array[position] = 1;
		winner = checkBoard(array);
		if(winner != 0) {
		    updateWinner(board._id, array, winner);
		} else {
		    updateBoard(board._id, array, -1, "");
		}
	    }
	} else if(player == "player2") {
	    if(board.player == -1 && array[position] == 0) {
		array[position] = -1;
		winner = checkBoard(array);
		if(winner != 0) {
		    updateWinner(board._id, array, winner);
		} else {
		    updateBoard(board._id, array, 1, "");
		}
	    }
	} else {
	    updateBoard(board._id, "Unknown player")
	    return;
	}
    }
});
