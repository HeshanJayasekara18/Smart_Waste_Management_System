const { exec } = require('child_process');
const os = require('os');

const url = 'http://localhost:3000';

// Function to open browser
function openBrowser(url) {
  const platform = os.platform();
  let command;

  if (platform === 'win32') {
    command = `start ${url}`;
  } else if (platform === 'darwin') {
    command = `open ${url}`;
  } else {
    command = `xdg-open ${url}`;
  }

  exec(command, (error) => {
    if (error) {
      console.log('Please open browser manually at:', url);
    }
  });
}

// Wait for server to start, then open browser
setTimeout(() => {
  openBrowser(url);
}, 5000); // Wait 5 seconds for server to start