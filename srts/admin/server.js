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

// Start a process
function startProcess(processName) {
  pm2.start(processName, (err, proc) => {
    if (err) {
      console.error(`Error starting process ${processName}: ${err}`);
      return;
    }
    console.log(`Started process ${processName}`);
  });
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
