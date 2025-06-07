document.addEventListener('DOMContentLoaded', () => {
    const socket = io('https://smartapi.trustchainlabs.com/events', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 3,
        upgrade: true
    });

    // Log the current transport method
    socket.on('connect', () => {
        const transport = socket.io.engine.transport.name;
        displayMessage('System', `Connected using transport: ${transport}`);
    });

    const clientId = document.body.dataset.clientId;
    const messageInput = document.getElementById('message');
    const sendButton = document.getElementById('sendButton');

    socket.on('connect', () => {
        console.log(`Connected as ${clientId}`);
        // Subscribe to a shared channel
        socket.emit('subscribe', 'chat-room-1');
        displayMessage('System', 'Connected to server');
    });

    socket.on('hcsMessage', (message) => {
        // Display all messages, showing own messages as "Me"
        if (message.data) {
            const displayName = message.data.sender === clientId ? 'Me' : message.data.sender;
            displayMessage(displayName, message.data.content);
        }
    });

    function sendMessage() {
        const content = messageInput.value;
        
        if (content.trim()) {
            // Send message following your WebSocketMessage interface
            socket.emit('hcsMessage', {
                event: 'message',
                channel: 'chat-room-1',
                data: {
                    sender: clientId,
                    content: content
                },
                timestamp: new Date().toISOString()
            });
            messageInput.value = '';
        }
    }

    function displayMessage(sender, content) {
        const messagesDiv = document.getElementById('messages');
        const messageElement = document.createElement('p');
        messageElement.textContent = `${sender}: ${content}`;
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // Add event listeners
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    // Error handling
    socket.on('connect_error', (error) => {
        displayMessage('System', 'Connection error: ' + error.message);
    });

    socket.on('disconnect', () => {
        displayMessage('System', 'Disconnected from server');
    });
});
