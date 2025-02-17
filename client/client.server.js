const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const path = require('path');
const pm2 = require('pm2')
const fs = require('fs');


const PORT = process.env.PORT || 3001;

const settingsPath = path.join(path.dirname(__dirname), '/admin/settings.json');
const systemSettingsPath = path.join(path.dirname(__dirname), '/admin/system-settings.json');
const userSettingsPath = path.join(path.dirname(__dirname), '/admin/user-settings.json');

let Settings = {};
let SystemSettings = {};
let UserSettings = {};

function getSettings() {
    if (!Settings || !Settings["channels"]) {
        console.error(`Error: 'channels' not found in settings file.`);
        return;
    }
    return Settings;
}

function getSystemSettings() {
    return SystemSettings;
}

function getUserSettings() {
    return UserSettings;
}

function updateSettings() {
    const newSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    Settings = newSettings;
    const newSystemSettings = JSON.parse(fs.readFileSync(systemSettingsPath, 'utf-8'));
    SystemSettings = newSystemSettings;
    const newUserSettings = JSON.parse(fs.readFileSync(userSettingsPath, 'utf-8'));
    UserSettings = newUserSettings;
}

function updateSettingsFrontend() { 
    io.emit(`settings-frontend-update`, Settings, SystemSettings, UserSettings);
}

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(__dirname));

http.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    updateSettings(); // Initialize Settings variable with initial file contents

});

// Listen for socket.io connections
io.on('connection', (socket) => {

    // When settings are changed we want to update them on the frontend
    socket.on('settings-changed', () => {
        updateSettings();
        updateSettingsFrontend();
    });

    socket.on('settings-frontend-req', () => {
        // Send the response back to the client with the 'settings-info-value' event
        socket.emit('settings-frontend-init', getSettings(),getSystemSettings(), getUserSettings());
    });

    socket.on("submit-comment", (comment) => {
        const dateTime = new Date().toISOString().replace(/:/g, "-");
        const fileName = `${dateTime}.txt`;
        const folderName = "comments";
        const filePath = path.join(__dirname, folderName, fileName);

        socket.emit('submit-comment-return', filePath);

        fs.writeFile(filePath, comment, (err) => {
            if (err) {
                console.error(`Error writing file ${filePath}: ${err}`);
                return;
            }

            console.log(`Comment written to file ${filePath}`);
        });
    });
});
