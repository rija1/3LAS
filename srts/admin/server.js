const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const pm2 = require('pm2')

const PORT = process.env.PORT || 3000;

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const processNames = ['channel_1', 'channel_2', 'channel_3', 'channel_4'];

function processExists(processName) {
    pm2.describe(processName, (err, processDescription) => {
        if (err || !processDescription || !processDescription[0]) {
            return false;
        } else {
            return true;
        }
    });
}

function createProcess(processName) {
// To finish
    // let outputFile = '/Users/reedz/Desktop/output.mp3';
    let outputFile = '';
    let streamServerPath = '';
    let processCommand = 'ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f avfoundation -i :3 -ar 48000 -ac 1 -f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960 pipe:1 -f mp3 ' + outputFile + ' | node ' + streamServerPath + ' -port 3101 -samplerate 48000 -channels 1';

    pm2.start({
        name: processName,
        script: 'sh',
        args: ['-c', processCommand],
        cwd: path.dirname(__filename),
      }, function(err) {
        if (err) {
          console.error(err);
          process.exit(1);
        }
    
        console.log('Process started successfully');
    
        pm2.disconnect();
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
    pm2.restart(processName, (err, proc) => {
        if (err) {
            console.error(`Error restarting process ${processName}: ${err}`);
            return;
        }
        console.log(`Restarted process ${processName}`);
    });
}


function checkPm2ProcessStatus() {
    pm2.list((err, processList) => {
        if (err) {
            console.error(`Error: ${err}`);
            return;
        }

        const processStatus = {};

        for (const processName of processNames) {

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
    const seconds = Math.floor(elapsed / 1000) % 60;
    const minutes = Math.floor(elapsed / 1000 / 60) % 60;
    const hours = Math.floor(elapsed / 1000 / 60 / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}


function updateElapsedTime(processName) {

    const startTimeCommand = `pm2 jlist | jq '.[] | select(.name == "${processName}") | .pm2_env.pm_uptime'`;
    io.emit(`${processName}-time`, startTimeCommand); return;

    pm2.describe(processName, (err, processInfo) => {
        if (err) {
            console.error(`Error: ${err}`);
            return;
        }

        const startTime = processInfo.pm2_env.pm_uptime;
        const elapsed = Date.now() - startTime;

        io.emit(`${processName}-time`, formatTime(elapsed));

    });
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

});

http.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);

    // Send initial status to clients
    // for (const processName of processNames) {
    //   io.emit(`${processName}-status`, false);
    // }

    // Send status updates every 1 seconds

    // Send status updates every 1 seconds
    function updateStatus() {
        processChecks();
        setTimeout(updateStatus, 1500);
    }
    updateStatus();

});
