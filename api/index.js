const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 8282;

app.use(express.static(path.join(__dirname, '../public')));

const users = new Set();
const chatRooms = new Map();

io.on('connection', (socket) => {
  console.log('New user connected');

  socket.on('new user', (data, callback) => {
    console.log('New user attempt:', data.username);
    if (users.has(data.username)) {
      callback({ success: false });
    } else {
      users.add(data.username);
      socket.username = data.username;
      callback({ success: true });
      console.log('User added:', data.username);
      socket.join('general');
      if (!chatRooms.has('general')) {
        chatRooms.set('general', new Set());
      }
      chatRooms.get('general').add(data.username);
      updateOnlineUsers();
      updateRoomUsers('general');
    }
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      users.delete(socket.username);
      for (const [room, users] of chatRooms.entries()) {
        if (users.has(socket.username)) {
          users.delete(socket.username);
          updateRoomUsers(room);
        }
      }
      updateOnlineUsers();
      console.log('User disconnected:', socket.username);
    }
  });

  socket.on('chat message', (msg) => {
    io.to(msg.room).emit('chat message', {
      username: socket.username,
      message: msg.message,
      room: msg.room
    });
  });

  socket.on('join room', (room) => {
    socket.join(room);
    if (!chatRooms.has(room)) {
      chatRooms.set(room, new Set());
    }
    chatRooms.get(room).add(socket.username);
    updateRoomUsers(room);
  });

  socket.on('leave room', (room) => {
    socket.leave(room);
    if (chatRooms.has(room)) {
      chatRooms.get(room).delete(socket.username);
      updateRoomUsers(room);
    }
  });

  socket.on('typing', (room) => {
    socket.to(room).emit('typing', { username: socket.username, room });
  });

  socket.on('stop typing', (room) => {
    socket.to(room).emit('stop typing', { username: socket.username, room });
  });

  function updateOnlineUsers() {
    io.emit('online users', Array.from(users));
  }

  function updateRoomUsers(room) {
    io.to(room).emit('room users', { room, users: Array.from(chatRooms.get(room) || []) });
  }
});

module.exports = server;
