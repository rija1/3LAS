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
const profilesPath = path.join(__dirname, 'profiles');
// const exportPath = path.join(__dirname, 'settings.json');

const PORT = process.env.PORT || 3000;

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(__dirname));

function saveSettings() {
    fs.writeFile(settingsPath, JSON.stringify(Settings), { flag: 'w' }, (err) => {
        if (err) throw err;
        console.log('File written successfully!');
    });
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
    // let inputDevice = channelSettings.ffmpegInputDevice;

    let inputDevice = "-f avfoundation -i :" + channelSettings.device;


    let port = channelSettings.port;
    let bufSize = 2048;
    // let bufSize = 960;

    // let rtbufsize = 64;
    let rtbufsize = 64;

    // let probesize = 64;
    let probesize = 64;

    let processCommand = 'ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize ' + rtbufsize + ' -probesize ' + probesize + ' -y ' + inputDevice + ' -ar 48000 -ac 1 -f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize ' + bufSize + ' pipe:1 ' + outputFile + ' | node ' + streamServerPath + ' -port ' + port + ' -samplerate 48000 -channels 1';
    console.log(processCommand);
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
    console.log(`Restarted process ${processName}`);

}

function getAvfoundationDevices() {
    const { exec } = require('child_process');

    // Get AVFoundation devices
    exec('ffmpeg -f avfoundation -list_devices true -i ""', (err, stdout, stderr) => {

        const audioDevices = {};
        parseDevices = false;

        // Parse the output to extract device information
        const lines = stderr.trim().split('\n');


        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.includes('AVFoundation audio devices:')) {
                parseDevices = true;
            }

            if (parseDevices) {
                if (line.startsWith('[AVFoundation')) {

                    const regex = /\[(\d+)\] (.+)/;
                    const matches = line.match(regex);

                    if (matches) {
                        const deviceId = matches[1];
                        const deviceName = matches[2];

                        audioDevices[deviceId] = {
                            id: deviceId.toString(),
                            name: deviceName
                        };

                    }
                }
            }
        }

        // TODO check why it always saves it below
        if(Settings.avfoundationDevices != audioDevices) {
            Settings.avfoundationDevices = audioDevices;
            saveSettings(); 
            // console.log('AVFoundation devices updated.'); 
        }
        
    });
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


function sendProfiles()
{
    const profiles = {};

    fs.readdir(profilesPath, (err, files) => {
      if (err) {
        console.error(`Error reading directory: ${err}`);
        return;
      }
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      jsonFiles.forEach(file => {
        const filePath = `${profilesPath}/${file}`;
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const profile = JSON.parse(fileContent).profile_name;
        profiles[file] = profile;
      });
      
      io.emit('profiles-update', profiles, Settings.current_profile);
    });
}

function createProfile(profileName) {
    
    const profileFilename = profileName.toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '_')
        + ".json";

    const newProfileJsonPath = path.join(profilesPath, profileFilename);

    const newProfileSettings = {
        "profile_name":profileName,
        "teaching_info": Settings.teaching_info,
        "channels": Settings.channels,
        "avfoundationDevices": Settings.avfoundationDevices
    };

    
    fs.writeFile(newProfileJsonPath, JSON.stringify(newProfileSettings), { flag: 'w' }, (err) => {
        if (err) throw err;
        io.emit('profile-new-result','New profile created successfully. Please reload the page to see it.');
    });
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

    socket.on('update-channel-info', (infoArray) => {
        Settings.channels[infoArray.channel_id][infoArray.field] = infoArray.value;
        saveSettings();
    });

    socket.on('update-teaching-info', (infoArray) => {
        Settings.teaching_info[infoArray.field] = infoArray.value;
        saveSettings();
    });

    socket.on('get-profiles', () => {
        sendProfiles();
    });

    socket.on('profile-new', (profileName) => {
        createProfile(profileName);
    });


});

http.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);

    // Send initial status to clients
    // for (const processName of processNames) {
    //   io.emit(`${processName}-status`, false);
    // }

    // Send status updates every 1 seconds

    // Send status updates every 60 seconds
    function updateStatus() {
        setInterval(function () {
            processChecks();
        }, 60000);

    }
    updateStatus();

    // Update current AVFoundation devices in settings file
    getAvfoundationDevices();


});
