const socket = io();
let username;
let currentRoom = 'general';

function login() {
    username = document.getElementById('username').value;
    if (username) {
        socket.emit('new user', { username }, (data) => {
            if (data.success) {
                document.getElementById('login').style.display = 'none';
                document.getElementById('chat').style.display = 'flex';
                updateRoomHeader();
            } else {
                alert('Username already taken');
            }
        });
    }
}

function sendMessage() {
    const input = document.getElementById('m');
    if (input.value) {
        socket.emit('chat message', { message: input.value, room: currentRoom });
        input.value = '';
    }
}

function joinRoom(room) {
    if (room !== currentRoom) {
        socket.emit('leave room', currentRoom);
        socket.emit('join room', room);
        currentRoom = room;
        updateRoomHeader();
        clearMessages();
    }
}

function updateRoomHeader() {
    document.getElementById('room-header').textContent = `Pocket Sense - ${currentRoom} Room`;
}

function clearMessages() {
    document.getElementById('messages').innerHTML = '';
}

socket.on('chat message', (msg) => {
    if (msg.room === currentRoom) {
        const messages = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.innerHTML = `
            <div class="username" style="color: ${msg.color}">${msg.username}</div>
            <div class="content">${msg.message}</div>
        `;
        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
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

// Typing indicator
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
