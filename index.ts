import express from "express";
import io from "socket.io";
import http from "http";
import { createStoreWithMiddleware } from "./src/logic/game";
import { Action } from "redux";

var app = express();

app.use(express.static("build"));

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/build/index.html");
});

const webServer = http.createServer(app).listen(3001, function() {
  console.log("listening on *:3001");
});

let sendToOthers: (action: Action) => void = () => 0;

const store = createStoreWithMiddleware([
  api => next => action => {
    const result = next(action);
    sendToOthers(action);
    console.log(action, "lead to", api.getState());
    return result;
  }
]);

const socketServer = function(server: http.Server) {
  const socketServer = io(server);
  const connections: io.Socket[] = [];

  socketServer.on("connection", socket => {
    connections.push(socket);

    socket.on("message", data => {
      sendToOthers = action =>
        connections.forEach(connectedSocket => {
          if (connectedSocket !== socket) {
            connectedSocket.emit("message", data);
          }
        });
      const parsed =
        typeof data === "string" && data.startsWith("{") && JSON.parse(data);
      if (parsed && "type" in parsed) {
        store.dispatch(parsed);
      }
    });

    socket.on("disconnect", () => {
      const index = connections.indexOf(socket);
      connections.splice(index, 1);
    });
  });
};

socketServer(webServer);
