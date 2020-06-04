var express = require('express');
var app = express();
var server = require('http').Server(app);1
var io = require('socket.io').listen(server);
var fs = require('fs');
//var serveIndex = require('serve-index');

var players = {};

app.use(express.static(__dirname + '/public'));
//app.use('/public', serveIndex(__dirname + '/public'));
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    console.log('a user connected');
    // create a new player and add it to our players object
    players[socket.id] = {
      rotation: 0,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      playerId: socket.id,
      team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue'
    };
    // send the players object to the new player
    socket.emit('currentPlayers', players);
    // update all other players of the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('disconnect', function () {
      console.log('user disconnected');  
      // remove this player from our players object
      delete players[socket.id];
      // emit a message to all players to remove this player
      io.emit('disconnect', socket.id);
    });
});
function onFileContent(filename, content) {
  if (!/\.(js|md|txt)$/.test(filename)) {
      return false;
  }
  var str = filename + '\n\n' + content + '\n\n\n\n\n';
  console.log(str);
}

function onError(error) {
  console.log(error);
}
function readFiles(dirname, onFileContent, onError) {
  fs.readdir(dirname, function(err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function(filename) {
      fs.readFile(dirname + filename, 'utf-8', function(err, content) {
        if (err) {
          onError(err);
          return;
        }
        onFileContent(filename, content);
      });
    });
  });
}
let dirName = __dirname + '/public/src/';
//readFiles(dirName, onFileContent, onError);

server.listen(8081, function () {
  console.log("Listening on",server.address().port);
});