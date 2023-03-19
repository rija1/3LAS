const { exec } = require('child_process');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

function checkPm2ProcessStatus() {
  exec(`pm2 list`, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error: ${err}`);
      return;
    }

    // Check if process is present in list
    const isPresent = stdout.includes('srts1');

    // Check if process is running
    let isRunning = false;
    let processInfo;
    if (isPresent) {
      exec(`pm2 describe srts1`, (err, stdout, stderr) => {
        if (err) {
          console.error(`Error: ${err}`);
          return;
        }
        processInfo = stdout.trim();
        // io.emit('process-info', processInfo.includes('online'));
        
        isRunning = processInfo.includes('online');
        // Send status to frontend
        io.emit('status', isRunning);
      });
    } else {
      io.emit('process-info', 'Process is not present in list');
      io.emit('status', isRunning);
    }
  });
}



app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

http.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  
  // Send initial status to clients
  checkPm2ProcessStatus();
  
  // Send status updates every 1 seconds
  setInterval(checkPm2ProcessStatus, 1000);
});
