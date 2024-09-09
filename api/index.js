document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    
    const socket = io();
    let username;
    let currentRoom = 'general';

    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
    });

    function login() {
        console.log('Login function called');
        const usernameInput = document.getElementById('username');
        if (!usernameInput) {
            console.error('Username input not found');
            return;
        }
        
        username = usernameInput.value.trim();
        if (username) {
            console.log('Emitting new user event');
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
        console.log(`Attempting to join room: ${room}`);
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
            } else {
                console.warn(`Button for room ${room} not found`);
            }
        }
    }

    function updateRoomHeader() {
        const roomHeader = document.getElementById('room-header');
        if (roomHeader) {
            roomHeader.textContent = `Pocket Sense - ${currentRoom} Room`;
        } else {
            console.error('Room header element not found');
        }
    }

    function clearMessages() {
        const messages = document.getElementById('messages');
        if (messages) {
            messages.innerHTML = '';
        } else {
            console.error('Messages element not found');
        }
    }

    function addMessage(user, message, type = 'other') {
        const messages = document.getElementById('messages');
        if (!messages) {
            console.error('Messages element not found');
            return;
        }
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
        updateOnlineUsers(users);
    });

    socket.on('room users', (data) => {
        console.log('Received room users update:', data);
        if (data.room === currentRoom) {
            updateRoomUsers(data.users);
        }
    });

    function updateOnlineUsers(users) {
        const onlineUsers = document.getElementById('online-users');
        if (!onlineUsers) {
            console.error('Online users element not found');
            return;
        }
        onlineUsers.innerHTML = '';
        users.forEach(user => {
            const userDiv = document.createElement('div');
            userDiv.className = 'user';
            userDiv.textContent = user;
            onlineUsers.appendChild(userDiv);
        });
    }

    function updateRoomUsers(users) {
        const roomUsers = document.getElementById('room-users');
        if (!roomUsers) {
            console.error('Room users element not found');
            return;
        }
        roomUsers.innerHTML = '';
        users.forEach(user => {
            const userDiv = document.createElement('div');
            userDiv.className = 'user';
            userDiv.textContent = user;
            roomUsers.appendChild(userDiv);
        });
    }

    // Typing indicator
    let typingTimer;
    const input = document.getElementById('m');
    if (input) {
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
    } else {
        console.error('Message input element not found');
    }

    socket.on('typing', (data) => {
        const typingElement = document.getElementById('typing');
        if (typingElement) {
            if (data.room === currentRoom) {
                typingElement.innerText = `${data.username} is typing...`;
            }
        } else {
            console.error('Typing indicator element not found');
        }
    });

    socket.on('stop typing', (data) => {
        const typingElement = document.getElementById('typing');
        if (typingElement) {
            if (data.room === currentRoom) {
                typingElement.innerText = '';
            }
        } else {
            console.error('Typing indicator element not found');
        }
    });

    // Initialize room buttons
    const generalRoomButton = document.querySelector('#rooms button[onclick="joinRoom(\'general\')"]');
    if (generalRoomButton) {
        generalRoomButton.classList.add('active');
    } else {
        console.warn('General room button not found');
    }

    // Make functions globally accessible
    window.login = login;
    window.sendMessage = sendMessage;
    window.joinRoom = joinRoom;
});
