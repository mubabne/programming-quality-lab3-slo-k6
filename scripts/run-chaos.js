const { once } = require('events');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const resultsDirectory = path.join(root, 'results');
const outputPath = path.join(resultsDirectory, 'chaos.txt');
const k6Path = process.env.K6_PATH || 'C:\\Program Files\\k6\\k6.exe';

fs.mkdirSync(resultsDirectory, { recursive: true });

const output = fs.createWriteStream(outputPath, { encoding: 'utf8' });
let server;

function write(line) {
  process.stdout.write(line);
  output.write(line);
}

function startServer() {
  server = spawn(process.execPath, ['server.js'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  server.stdout.on('data', (chunk) => process.stdout.write(chunk));
  server.stderr.on('data', (chunk) => process.stderr.write(chunk));
}

async function stopServer() {
  if (!server || server.exitCode !== null) return;
  server.kill();
  await once(server, 'exit');
}

async function main() {
  startServer();
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const k6 = spawn(k6Path, ['run', '--no-color', 'slo-test.js'], {
    cwd: root,
    env: { ...process.env, DURATION: '2m' },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  k6.stdout.on('data', (chunk) => write(chunk.toString()));
  k6.stderr.on('data', (chunk) => write(chunk.toString()));

  await new Promise((resolve) => setTimeout(resolve, 30000));
  await stopServer();
  const stoppedAt = new Date();
  write(`\n[chaos] server stopped: ${stoppedAt.toISOString()}\n`);

  await new Promise((resolve) => setTimeout(resolve, 10000));
  startServer();
  const restartedAt = new Date();
  write(`[chaos] server restarted: ${restartedAt.toISOString()}\n`);
  write(`[chaos] outage: ${((restartedAt - stoppedAt) / 1000).toFixed(3)} seconds\n\n`);

  const [exitCode] = await once(k6, 'exit');
  write(`exit=${exitCode}\n`);
  await stopServer();
  output.end();
}

main().catch(async (error) => {
  console.error(error);
  await stopServer();
  output.end();
  process.exitCode = 1;
});
