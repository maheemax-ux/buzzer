// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve the HTML files
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/buzzer.html');
});

app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/public/admin.html');
});

// Game State
let isLocked = false;
let firstPlayer = null;

io.on('connection', (socket) => {
    console.log('A device connected: ' + socket.id);

    // 1. Player presses buzzer
    socket.on('press_buzzer', (playerName) => {
        if (!isLocked) {
            isLocked = true;
            firstPlayer = playerName;
            
            // Send alert to Admin Screen
            io.emit('buzzer_pressed', playerName);
            
            // Lock the buzzers on all phones
            io.emit('lock_state', true);
        }
    });

    // 2. Admin resets the game
    socket.on('reset_game', () => {
        isLocked = false;
        firstPlayer = null;
        io.emit('lock_state', false); // Unlock all phones
        io.emit('buzzer_pressed', null); // Clear the display
    });
});

// Helper to get local IP address
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`--------------------------------`);
    console.log(`Server running!`);
    console.log(`Open ADMIN view on laptop: http://localhost:${PORT}/admin`);
    console.log(`Open BUZZER on phones: http://${getLocalIP()}:${PORT}`);
    console.log(`--------------------------------`);
});