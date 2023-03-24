const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);

app.use(express.static("public"));

// SOcket.io setup
const { Server } = require("socket.io");
const io = new Server(server);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const users = [];
const waitingList = [];
const games = [];

// if user gets connected
io.on("connection", (socket) => {
  // new client connected
  const newClient = socket.handshake.headers.clientname;
  users.push(newClient);
  socket.broadcast.emit("new client", {
    msg: `${newClient} connected`,
    clientName: newClient,
  });

  console.log({ users });

  socket.on("init game", (data) => {
    waitingList.push(data.name);
    if (waitingList.length === 2) {
      const game = {};
      game.player1 = waitingList[0];
      game.player2 = waitingList[1];
      game.gameId = Math.floor(Math.random() * 1000);

      game.firstTurn = game.player1;
      if (Math.random() > 0.5) game.firstTurn = game.player2;

      game.state = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      games.push(game);

      waitingList.splice(0, 2);
      socket.broadcast.emit("start game", game);
      socket.emit("start game", game);
    }
  });

  socket.on("state change", (data) => {
    const game = games.find((game) => game.gameId === data.gameId);
    game.state[data.num - 1] = 1;
    socket.broadcast.emit("state change", data);
  });

  // If user gets diconnected
  socket.on("disconnect", (data) => {
    users.splice(users.indexOf(newClient), 1);
    console.log("A user disconnected :(");
  });
});

server.listen(4000, () => {
  console.log("Listening on port 4000");
});
