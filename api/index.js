const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, '../public')));

io.on('connection', (socket) => {
  console.log('New user connected');

  socket.on('join', (username) => {
    console.log(`User ${username} attempting to join`);
    socket.username = username;
    io.emit('user joined', username);
    socket.emit('join success', username);
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      console.log(`User ${socket.username} disconnected`);
    }
  });
});

module.exports = server;
