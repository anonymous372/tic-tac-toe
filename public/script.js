var name = prompt("Enter your name");
var isWaiting = false;
var isMyTurn = false;
var gameId = null;
var mySign = "";

const gameState = [[], [], []];

document.getElementById("username").innerHTML = name;

var socket = io("http://localhost:4000", {
  extraHeaders: {
    clientName: name,
  },
});

// ======================================
// ======================================
// Start game event

function startGame() {
  if (isWaiting) return;
  isWaiting = true;
  socket.emit("init game", { name });
  waitingForGameToStart();
}

socket.on("start game", (data) => {
  if (!isWaiting) return;
  console.log("Game Started", data);

  if (data.firstTurn === name) isMyTurn = true;
  else isMyTurn = false;

  // set all buttons to active
  for (let i = 1; i <= 9; i++) {
    document.getElementById(`btn-${i}`).classList.remove("inactive");
  }
  // set mySign on basis of first turn
  if (isMyTurn) mySign = "X";
  else mySign = "O";
  // set username with mysign
  document.getElementById("username").innerHTML = `${name} (${mySign})`;

  // set button text to "Your Turn" or "Opponent's Turn"
  if (isMyTurn) document.getElementById("btn-start").innerHTML = "Your Turn";
  else document.getElementById("btn-start").innerHTML = "Opponent's Turn";

  gameId = data.gameId;
  isWaiting = false;

  console.log("GAME IS ON!!!", data);
});

function waitingForGameToStart() {
  document.getElementById("btn-start").classList.add("btn-start-inactive");
  document.getElementById("btn-start").innerHTML = "Waiting...";
  document.getElementById("btn-start").disabled = true;
}

// ======================================
// ======================================
// State Change Event

// fire event on button click
function fireEvent(num) {
  if (document.getElementById(`btn-${num}`).classList.contains("inactive"))
    return;
  if (!isMyTurn) return;
  setGameState(num);
  deactivate(num);
  isMyTurn = false;
  document.getElementById("btn-start").innerHTML = "Opponent's Turn";
  socket.emit("state change", { gameId, num });
  if (checkGameOver(mySign)) {
    document.getElementById("btn-start").innerHTML = `You Won!`;
    return;
  }
}

// catch state change event from server
socket.on("state change", (data) => {
  if (data.gameId !== gameId) return;
  console.log(data);
  setGameState(data.num);
  deactivate(data.num);
  isMyTurn = true;
  if (checkGameOver(mySign === "X" ? "O" : "X")) {
    // set text to the winners name
    document.getElementById("btn-start").innerHTML = `You Lost`;
    isMyTurn = false;
    return;
  }
  document.getElementById("btn-start").innerHTML = "Your Turn";
});

// Change state of a button
function deactivate(num) {
  document.getElementById(`btn-${num}`).classList.add("inactive");
  // set button text to "X" or "O" using turn
  if (isMyTurn) document.getElementById(`btn-${num}`).innerHTML = mySign;
  else
    document.getElementById(`btn-${num}`).innerHTML =
      mySign === "X" ? "O" : "X";
}

// function to break number into x, y indexes
function getXY(num) {
  const x = Math.floor((num - 1) / 3);
  const y = (num - 1) % 3;
  return { x, y };
}

// function to set gameState by x, y
function setGameState(num) {
  const { x, y } = getXY(num);
  // set game state to "X" or "O" using turn
  if (isMyTurn) gameState[x][y] = mySign;
  else gameState[x][y] = mySign === "X" ? "O" : "X";
}

// function to check if game is over
function checkGameOver(sign) {
  // check rows
  for (let i = 0; i < 3; i++) {
    if (
      gameState[i][0] === sign &&
      gameState[i][1] === sign &&
      gameState[i][2] === sign
    )
      return true;
  }

  // check columns
  for (let i = 0; i < 3; i++) {
    if (
      gameState[0][i] === sign &&
      gameState[1][i] === sign &&
      gameState[2][i] === sign
    )
      return true;
  }

  // check diagonals
  if (
    gameState[0][0] === sign &&
    gameState[1][1] === sign &&
    gameState[2][2] === sign
  )
    return true;
  if (
    gameState[0][2] === sign &&
    gameState[1][1] === sign &&
    gameState[2][0] === sign
  )
    return true;

  return false;
}
