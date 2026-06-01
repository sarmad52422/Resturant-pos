const { spawn } = require('node:child_process');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const command = process.platform === 'win32' ? 'electron-vite.cmd' : 'electron-vite';
const child = spawn(command, ['dev'], {
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
