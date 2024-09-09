const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 8282;

app.use(express.static(path.join(__dirname, 'public')));

const users = new Map();
const chatRooms = new Map();

io.on('connection', (socket) => {
  console.log('New user connected');

  socket.on('new user', (data, callback) => {
    if (users.has(data.username)) {
      callback({ success: false });
    } else {
      callback({ success: true });
      socket.username = data.username;
      socket.userColor = getRandomColor();
      users.set(data.username, socket);
      updateOnlineUsers();
      socket.join('general');
      chatRooms.set('general', (chatRooms.get('general') || []).concat(socket.username));
      updateRoomUsers('general');
    }
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      users.delete(socket.username);
      updateOnlineUsers();
      for (const [room, users] of chatRooms.entries()) {
        const index = users.indexOf(socket.username);
        if (index !== -1) {
          users.splice(index, 1);
          updateRoomUsers(room);
        }
      }
    }
  });

  socket.on('chat message', (msg) => {
    io.to(msg.room).emit('chat message', {
      username: socket.username,
      color: socket.userColor,
      message: msg.message,
      room: msg.room
    });
  });

  socket.on('typing', (room) => {
    socket.to(room).emit('typing', { username: socket.username, room });
  });

  socket.on('stop typing', (room) => {
    socket.to(room).emit('stop typing', { username: socket.username, room });
  });

  socket.on('join room', (room) => {
    socket.join(room);
    chatRooms.set(room, (chatRooms.get(room) || []).concat(socket.username));
    updateRoomUsers(room);
  });

  socket.on('leave room', (room) => {
    socket.leave(room);
    const users = chatRooms.get(room) || [];
    const index = users.indexOf(socket.username);
    if (index !== -1) {
      users.splice(index, 1);
      chatRooms.set(room, users);
      updateRoomUsers(room);
    }
  });
});

function updateOnlineUsers() {
  io.emit('online users', Array.from(users.keys()));
}

function updateRoomUsers(room) {
  io.to(room).emit('room users', { room, users: chatRooms.get(room) || [] });
}

function getRandomColor() {
  return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
