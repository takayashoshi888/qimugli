const { spawn } = require('child_process');

const git = spawn('git', ['status'], { shell: false });

git.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

git.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

git.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
