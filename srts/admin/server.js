const { exec } = require('child_process');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const pm2 = require('pm2')

// const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const processNames = ['channel_1', 'channel_2', 'channel_3', 'channel_4'];

function checkPm2ProcessStatus() {
  exec(`pm2 list`, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error: ${err}`);
      return;
    }

    const processList = stdout.trim().split('\n').slice(1); // Get list of processes, excluding first line
    const processStatus = {};

    for (const processName of processNames) {

      // Check if process is present in list
      const isPresent = processList.some(line => line.includes(processName));

      // Check if process is running
      let isRunning = false;
      let processInfo;
      if (isPresent) {
        exec(`pm2 describe ${processName}`, (err, stdout, stderr) => {
          if (err) {
            console.error(`Error: ${err}`);
            return;
          }
          processInfo = stdout.trim();
          isRunning = processInfo.includes('online');
          processStatus[processName] = isRunning;
          io.emit(`${processName}-status`, isRunning);

          updateElapsedTime(processName);

        });
      } else {
        processStatus[processName] = false;
        io.emit(`${processName}-status`, false);
      }
    }
  });
}

function updateElapsedTime(processName) {
  
  const startTimeCommand = `pm2 jlist | jq '.[] | select(.name == "${processName}") | .pm2_env.pm_uptime'`;
  io.emit(`${processName}-time`, startTimeCommand); return;
  exec(startTimeCommand, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error: ${err}`);
      return;
    }

    const startTime = parseFloat(stdout.trim()) * 1000;
    const elapsed = Date.now() - startTime;
    
    io.emit(`${processName}-time`, formatTime("elapsed"));
    
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


http.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  
  // Send initial status to clients
  // for (const processName of processNames) {
  //   io.emit(`${processName}-status`, false);
  // }
  
  // Send status updates every 1 seconds
  setInterval(processChecks, 1000);
});
