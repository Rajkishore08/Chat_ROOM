document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');

    const socket = io();

    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
    });

    let username;
    let currentRoom = 'general';

    const joinButton = document.getElementById('joinButton');
    joinButton.addEventListener('click', login);

    function login() {
        console.log('Login function called');
        username = document.getElementById('username').value.trim();
        if (username) {
            console.log('Attempting to join with username:', username);
            socket.emit('new user', { username }, (data) => {
                console.log('Received response from server:', data);
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
            console.log('Sending message:', message);
            socket.emit('chat message', { message, room: currentRoom });
            input.value = '';
            addMessage(username, message, 'self');
        }
    }

    function joinRoom(room) {
        console.log('Joining room:', room);
        if (room !== currentRoom) {
            socket.emit('leave room', currentRoom);
            socket.emit('join room', room);
            currentRoom = room;
            updateRoomHeader();
            clearMessages();
            document.querySelectorAll('#rooms button').forEach(btn => {
                btn.classList.remove('active');
            });
            const activeButton = document.querySelector(`#rooms button[onclick="joinRoom('${room}')"]`);
            if (activeButton) {
                activeButton.classList.add('active');
            }
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
        console.log('Received chat message:', msg);
        if (msg.room === currentRoom && msg.username !== username) {
            addMessage(msg.username, msg.message);
        }
    });

    socket.on('online users', (users) => {
        console.log('Received online users update:', users);
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
        console.log('Received room users update:', data);
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

    input.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
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
});
