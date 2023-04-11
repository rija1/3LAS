const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const pm2 = require('pm2')
const fs = require('fs');
const { start } = require('repl');

const settingsPath = path.join(__dirname, 'settings.json');
const streamServerPath = path.join(__dirname, '3las.server.js');
const Settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
// const exportPath = path.join(__dirname, 'settings.json');

const PORT = process.env.PORT || 3000;

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(__dirname));

function saveSettings() {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(Settings));
        console.log('Settings saved successfully.');
    } catch (err) {
        console.error(err);
    }
}

function processExists(processName) {
    pm2.describe(processName, (err, processDescription) => {
        if (err || !processDescription || !processDescription[0]) {
            return false;
        } else {
            return true;
        }
    });
}

function getSettings() {
    if (!Settings || !Settings["channels"]) {
        console.error(`Error: 'channels' not found in settings file.`);
        return;
    }

    return Settings;
}

function createProcess(processName) {

    if (!Settings || !Settings["channels"] || !Settings["channels"][processName]) {
        console.error(`Error: Channel "${processName}" not found in settings file.`);
        return;
    }

    let channelSettings = Settings["channels"][processName];

    let outputFile = channelSettings.outputFile;
    // To list devices on mac : ffmpeg -f avfoundation -list_devices true -i ""
    let inputDevice = channelSettings.ffmpegInputDevice;
    let port = channelSettings.port;
    let bufSize = 2048;
    // let bufSize = 960;

    // let rtbufsize = 64;
    let rtbufsize = 64;

    // let probesize = 64;
    let probesize = 64;

    let processCommand = 'ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize ' + rtbufsize + ' -probesize ' + probesize + ' -y ' + inputDevice + ' -ar 48000 -ac 1 -f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize ' + bufSize + ' pipe:1 ' + outputFile + ' | node ' + streamServerPath + ' -port ' + port + ' -samplerate 48000 -channels 1';

    pm2.start({
        name: processName,
        script: 'sh',
        args: ['-c', processCommand],
        cwd: path.dirname(__filename),
    }, function (err) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log('Process started successfully');
    });
}

// Start a process
function startProcess(processName) {
    if (processExists(processName)) {
        pm2.start(processName, (err, proc) => {
            if (err) {
                console.error(`Error starting process ${processName}: ${err}`);
                return;
            }
            console.log(`Started process ${processName}`);
        });
    } else {
        createProcess(processName);
    }
}

function deleteProcess(processName) {
    if (processExists(processName)) {
        pm2.delete(processName, (err, proc) => {
            if (err) {
                console.error(`Error deleting process ${processName}: ${err}`);
                return;
            }
            console.log(`Deleted process ${processName}`);
        });
    }
}

// Stop a process
function stopProcess(processName) {
    pm2.stop(processName, (err, proc) => {
        if (err) {
            console.error(`Error stopping process ${processName}: ${err}`);
            return;
        }
        console.log(`Stopped process ${processName}`);
    });
}

// Restart a process
function restartProcess(processName) {
    deleteProcess(processName);
    createProcess(processName);
    // pm2.restart(processName, (err, proc) => {
    //     if (err) {
    //         console.error(`Error restarting process ${processName}: ${err}`);
    //         return;
    //     }
    //     console.log(`Restarted process ${processName}`);
    // });
}


function checkPm2ProcessStatus() {
    pm2.list((err, processList) => {
        if (err) {
            console.error(`Error: ${err}`);
            return;
        }

        const processStatus = {};

        for (const processName in Settings.channels) {

            // Check if process is present in list
            const processInfo = processList.find(info => info.name === processName);

            // Check if process is running
            let isRunning = false;
            if (processInfo) {
                isRunning = processInfo.pm2_env.status === 'online';
                processStatus[processName] = isRunning;
                io.emit(`${processName}-status`, isRunning);

                // updateElapsedTime(processName);
                io.emit(`${processName}-time`, getElapsedTimeFromTimestamp(processInfo.pm2_env.pm_uptime));

            } else {
                processStatus[processName] = false;
                io.emit(`${processName}-status`, false);
            }
        }
    });
}

function getElapsedTimeFromTimestamp(timestamp) {
    const startDate = new Date(timestamp);
    const elapsed = Date.now() - startDate.getTime();
    const minutes = Math.floor(elapsed / 1000 / 60) % 60;
    const hours = Math.floor(elapsed / 1000 / 60 / 60);
    const hoursString = hours > 0 ? `${hours}h ` : '';
    const minutesString = `${minutes}m`;
    return `${hoursString}${minutesString}`;
  }  

function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function processChecks() {
    checkPm2ProcessStatus();
}

// Listen for socket.io connections
io.on('connection', (socket) => {

    // Emit the process status when a client connects
    checkPm2ProcessStatus();

    socket.on('settings-info', () => {
        // Send the response back to the client with the 'settings-info-value' event
        socket.emit('settings-info-value', getSettings());
    });

    // Listen for start/stop events from clients
    socket.on('start-process', (processName) => {
        startProcess(processName);
    });

    socket.on('stop-process', (processName) => {
        stopProcess(processName);
    });

    socket.on('restart-process', (processName) => {
        restartProcess(processName);
    });

    socket.on('update-info', (infoArray) => {
        console.log("Youp1");
        console.log(JSON.stringify(infoArray));
        console.log(infoArray.field);
        Settings.channels[infoArray.channel_id][infoArray.field] = infoArray.value;
        saveSettings();
    });


});

http.listen(PORT, () => {
    //console.log(`Server listening on port ${PORT}`);

    // Send initial status to clients
    // for (const processName of processNames) {
    //   io.emit(`${processName}-status`, false);
    // }

    // Send status updates every 1 seconds

    // Send status updates every 60 seconds
    function updateStatus() {
        setInterval(function() {
            processChecks();
        }, 60000);

    }
    updateStatus();

});
