const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const pm2 = require('pm2')
const fs = require('fs');
const auth = require('basic-auth');
const { start } = require('repl');

const settingsPath = path.join(__dirname, 'settings.json');
const systemSettingsPath = path.join(__dirname, 'system-settings.json');
let Settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
let SystemSettings = JSON.parse(fs.readFileSync(systemSettingsPath, 'utf-8'));
const streamServerPath = path.join(__dirname, '3las.server.js');
const profilesPath = path.join(__dirname, 'profiles');
const exportPath = path.join(__dirname, 'export'); 

// Watch for changes to the settings.json file
// fs.watch(settingsPath, (eventType, settingFilename) => {
//     if (settingFilename) {
//         console.log(`${settingFilename} file changed`);
//         // Reload the settings file
//         Settings = JSON.parse(fs.readFileSync(settingsPath)); 
//         console.log(JSON.parse(fs.readFileSync(settingsPath)));
//         console.log('Settings reloaded:', Settings);
//     }
// });

const PORT = process.env.PORT || 3000;

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(__dirname));

function saveSettings() {
    fs.writeFile(settingsPath, JSON.stringify(Settings), { flag: 'w' }, (err) => {
        if (err) throw err;
        console.log('Settings saved successfully!');
    });
}

function saveSystemSettings() {
    fs.writeFile(systemSettingsPath, JSON.stringify(SystemSettings), { flag: 'w' }, (err) => {
        if (err) throw err;
        console.log('System settings saved successfully!');
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

function getSystemSettings() {
    return SystemSettings;
}

function getSettings() {

    updateAvfoundationDevices();

    if (!Settings || !Settings["channels"]) {
        console.error(`Error: 'channels' not found in settings file.`);
        return;
    }

    return Settings;
}

function updateExportFilename(channelId, filename) {
    io.emit('update-export-filename', channelId, filename);
}

function createProcess(processName) {

    if (!Settings || !Settings["channels"] || !Settings["channels"][processName]) {
        console.error(`Error: Channel "${processName}" not found in settings file.`);
        return;
    }

    let channelSettings = Settings["channels"][processName];

    let outputFileParam = "";

    // We will determine here the mp3 file name and path
    if (channelSettings.export) {

        const today = new Date(); // create a new Date object with the current system date and time
        const year = today.getFullYear(); // get the year value (4 digits)
        const month = (today.getMonth() + 1).toString().padStart(2, '0'); // get the month value (1-12) and pad with leading zero if needed
        const day = today.getDate().toString().padStart(2, '0'); // get the day value (1-31) and pad with leading zero if needed
        const formattedDate = `${year}${month}${day}`; // concatenate the year, month, and day values into a string in the YYYYMMDD format

        const extraInfo = Settings.teaching_info.extra_info;
        let extraInfoText = '';
        if (extraInfo !== '') {
            extraInfoText = '_' + extraInfo;
        }

        const lama = Settings.teaching_info.lama;
        let lamaText = '';
        if (lama !== '') {
            lamaText = '_' + lama;
        }

        const teaching = Settings.teaching_info.teaching;
        let teachingText = '';
        if (teaching !== '') {
            teachingText = '_' + teaching;
        }

        const language = channelSettings.language;
        let languageText = '';
        if (language !== '') {
            languageText = '_' + language;
        }

        const outputFilename = formattedDate + lamaText + extraInfoText + teachingText + languageText + '.mp3';

        let outputPath = path.join(exportPath, outputFilename);

        let suffix = '';

        while (fs.existsSync(outputPath)) {
            suffix = `_${parseInt(suffix.split('_').pop() || '1') + 1}`;
            outputPath = path.join(exportPath, outputFilename.replace('.mp3', `${suffix}.mp3`));
        }

        channelSettings.export_filename = outputFilename;
        updateExportFilename(processName, outputFilename);

        outputFileParam = "-f mp3 " + outputPath;
        // outputFileParam = "-c:a aac -b:a 96k" + outputPath;

    }


    // To list devices on mac : ffmpeg -f avfoundation -list_devices true -i ""
    // let inputDevice = channelSettings.ffmpegInputDevice;

    let audioPan = '';
    if (channelSettings.pan == "left") {
        audioPan = ' -af "pan=mono|c0=c0" ';
    }
    if (channelSettings.pan == "right") {
        audioPan = ' -af "pan=mono|c0=c1" ';
    }

    let inputDevice = "-f avfoundation -i :" + channelSettings.device;

    let port = channelSettings.port;
    let bufSize = 2048;
    // let bufSize = 960;

    // let rtbufsize = 64;
    let rtbufsize = 512;

    // let probesize = 64;
    let probesize = 512;

    // 
    let processCommand = 'ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize ' + rtbufsize + ' -probesize ' + probesize + ' -y ' + inputDevice + audioPan + ' -ar 48000 -ac 1 -f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize ' + bufSize + ' pipe:1 ' + outputFileParam + ' | node ' + streamServerPath + ' -port ' + port + ' -samplerate 48000 -channels 1';
    //

    // let processCommand = 'ffmpeg ' + inputDevice + audioPan + ' pipe:1 ' + outputFileParam + ' | node ' + streamServerPath + ' -port ' + port + ' -samplerate 48000 -channels 1';

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

    saveSettings();

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
    io.emit('settings-info-update', getSettings());
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
    io.emit('settings-info-update', getSettings());
}

// Stop a process
function stopProcess(processName) {
    const { exec } = require('child_process');

    // Not using the PM2 API which doesn't do a graceful stop and so makes the MP3 file unplayable.
    exec('pm2 stop ' + processName);
    console.log(`Stopped process ${processName}`);

    io.emit('settings-info-update', getSettings());
}

// Restart a process
function restartProcess(processName) {
    deleteProcess(processName);
    createProcess(processName);
    console.log(`Restarted process ${processName}`);
    io.emit('settings-info-update', getSettings());
}

function updateAvfoundationDevices() {
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
        if (Settings.avfoundationDevices != audioDevices) {
            Settings.avfoundationDevices = audioDevices;
            saveSettings();
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

                // Get Elapsed time
                if (isRunning) {
                    io.emit(`${processName}-time`, getElapsedTimeFromTimestamp(processInfo.pm2_env.pm_uptime));
                }
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

function loadProfile(profileFilename, profileName, notif = true) {
    const loadProfilePath = path.join(profilesPath, profileFilename);
    Settings = JSON.parse(fs.readFileSync(loadProfilePath, 'utf-8'));

    saveSettings();
    io.emit('settings-info-update', getSettings());
    sendProfiles();
    if (notif) {
        io.emit('profile-result', '<span class="fa-valid"></span>The profile "' + profileName + '" has been loaded.');
    }
}

function deleteProfile(profileFilename, profileName) {
    const profileJsonPath = path.join(profilesPath, profileFilename);

    fs.unlink(profileJsonPath, (err) => {
        if (err) {
            console.error(err);
            return;
        }

        console.log(`The profile ${profileName} has been deleted.`);
        io.emit('profile-result', '<span class="fa-valid"></span>The profile "' + profileName + '" has been deleted.');
        sendProfiles();

    });
}

function saveProfile(profileFilename, profileName) {
    const profileJsonPath = path.join(profilesPath, profileFilename);
    const profileSettings = { ...Settings, "profile_name": profileName, "profile_filename": profileFilename };

    fs.writeFile(profileJsonPath, JSON.stringify(profileSettings), { flag: 'w' }, (err) => {
        if (err) throw err;
        io.emit('profile-result', '<span class="fa-valid"></span>Profile "' + profileName + '" saved successfully.');
        loadProfile(profileFilename, profileName, false);
    });
}

function sendProfiles() {
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

        io.emit('profiles-update', profiles, Settings.profile_filename);
    });
}

function delayCheckPm2ProcessStatus() {
    setTimeout(function () {
        checkPm2ProcessStatus();
    }, 1500);
}

function createProfile(profileName) {

    const profileFilename = profileName.toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '_')
        + ".json";

    const newProfileJsonPath = path.join(profilesPath, profileFilename);
    const newProfileSettings = { ...Settings, "profile_name": profileName, "profile_filename": profileFilename };

    fs.writeFile(newProfileJsonPath, JSON.stringify(newProfileSettings), { flag: 'w' }, (err) => {
        if (err) throw err;
        io.emit('profile-result', '<span class="fa-valid"></span>The profile "' + profileName + '" has been created successfully.');
        loadProfile(profileFilename,profileName,false);
    });
}

// Listen for socket.io connections
io.on('connection', (socket) => {

    // Emit the process status when a client connects
    checkPm2ProcessStatus();

    socket.on('settings-info', () => {
        // Send the response back to the client with the 'settings-info-value' event
        socket.emit('settings-info-init', getSettings(),getSystemSettings());
    });

    // Listen for start/stop events from clients
    socket.on('start-process', (processName) => {
        startProcess(processName);
        delayCheckPm2ProcessStatus();
    });

    socket.on('stop-process', (processName) => {
        stopProcess(processName);
        delayCheckPm2ProcessStatus();
    });

    socket.on('restart-process', (processName) => {
        restartProcess(processName);
        delayCheckPm2ProcessStatus();
    });

    socket.on('settings-info-req', () => {
        io.emit('settings-info-update', getSettings());
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

    socket.on('profile-new', (profileFilename) => {
        createProfile(profileFilename);
    });

    socket.on('profile-load', (profileFilename, profileName) => {
        loadProfile(profileFilename, profileName);
    });

    socket.on('profile-save', (profileFilename, profileName) => {
        saveProfile(profileFilename, profileName);
    });

    socket.on('profile-delete', (profileFilename, profileName) => {
        deleteProfile(profileFilename, profileName);
    });


});

http.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);

    // Send status updates every 60 seconds
    function updateStatus() {
        setInterval(function () {
            processChecks();
            io.emit('settings-info-update', getSettings());
        }, 10000);
        // }, 60000);
    }
    updateStatus();

    // Update current AVFoundation devices in settings file
    updateAvfoundationDevices();


});
