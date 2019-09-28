const express = require('express');

var app = express();
var http = require('http').createServer(app);

app.use(express.static('build'))

app.get('/', function(req, res){
  res.sendFile(__dirname + '/build/index.html');
});

const webServer = http.listen(3001, function(){
  console.log('listening on *:3001');
});

const io = require('socket.io');
 
const socketServer = function (server) {
  const socketServer = io(server);
  const connections = [];
 
  socketServer.on('connection', socket => {
    connections.push(socket);
 
    socket.on('message', data => {
      connections.forEach(connectedSocket => {
        if (connectedSocket !== socket) {
          connectedSocket.emit('message', data);
        }
      });
    });
 
    socket.on('disconnect', () => {
      const index = connections.indexOf(socket);
      connections.splice(index, 1);
    });
  });
}
 
socketServer(webServer);