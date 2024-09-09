const socket = io();
let username;
let currentRoom = 'general';

function login() {
    username = document.getElementById('username').value.trim();
    if (username) {
        socket.emit('new user', { username }, (data) => {
            if (data.success) {
                document.getElementById('login').style.display = 'none';
                document.getElementById('chat').style.display = 'flex';
                updateRoomHeader();
                joinRoom('general');
            } else {
                alert('Username already taken');
            }
        });
    } else {
        alert('Please enter a username');
    }
}

function sendMessage() {
    const input = document.getElementById('m');
    const message = input.value.trim();
    if (message) {
        socket.emit('chat message', { message, room: currentRoom });
        input.value = '';
        addMessage(username, message, 'self');
    }
}

function joinRoom(room) {
    if (room !== currentRoom) {
        socket.emit('leave room', currentRoom);
        socket.emit('join room', room);
        currentRoom = room;
        updateRoomHeader();
        clearMessages();
        document.querySelectorAll('#rooms button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`#rooms button[onclick="joinRoom('${room}')"]`).classList.add('active');
    }
}

function updateRoomHeader() {
    document.getElementById('room-header').textContent = `Pocket Sense - ${currentRoom} Room`;
}

function clearMessages() {
    document.getElementById('messages').innerHTML = '';
}

function addMessage(user, message, type = 'other') {
    const messages = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <div class="username">${user}</div>
        <div class="content">${message}</div>
    `;
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
}

socket.on('chat message', (msg) => {
    if (msg.room === currentRoom && msg.username !== username) {
        addMessage(msg.username, msg.message);
    }
});

socket.on('online users', (users) => {
    const onlineUsers = document.getElementById('online-users');
    onlineUsers.innerHTML = '';
    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user';
        userDiv.textContent = user;
        onlineUsers.appendChild(userDiv);
    });
});

socket.on('room users', (data) => {
    if (data.room === currentRoom) {
        const roomUsers = document.getElementById('room-users');
        roomUsers.innerHTML = '';
        data.users.forEach(user => {
            const userDiv = document.createElement('div');
            userDiv.className = 'user';
            userDiv.textContent = user;
            roomUsers.appendChild(userDiv);
        });
    }
});

let typingTimer;
const input = document.getElementById('m');
input.addEventListener('input', () => {
    clearTimeout(typingTimer);
    socket.emit('typing', currentRoom);
    typingTimer = setTimeout(() => socket.emit('stop typing', currentRoom), 1000);
});

socket.on('typing', (data) => {
    if (data.room === currentRoom) {
        document.getElementById('typing').innerText = `${data.username} is typing...`;
    }
});

socket.on('stop typing', (data) => {
    if (data.room === currentRoom) {
        document.getElementById('typing').innerText = '';
    }
});

input.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#rooms button[onclick="joinRoom(\'general\')"]').classList.add('active');
});
