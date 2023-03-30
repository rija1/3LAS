const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const pm2 = require('pm2')
const fs = require('fs');

const PORT = process.env.PORT || 3001;

const settingsPath = path.join(path.dirname(__dirname), '/admin/settings.json');

const Settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

function getSettings() {
    if (!Settings || !Settings["channels"]) {
        console.error(`Error: 'channels' not found in settings file.`);
        return;
    }

    return Settings;
}

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(__dirname));

http.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});


// Listen for socket.io connections
io.on('connection', (socket) => {
    socket.on('settings-info', () => {
        // Send the response back to the client with the 'settings-info-value' event
        socket.emit('settings-info-value', getSettings());
      });
});