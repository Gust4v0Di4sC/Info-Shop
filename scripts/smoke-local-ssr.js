const { spawn, execFileSync } = require('node:child_process');

const port = process.env.PORT || '4100';
const baseUrl = `http://127.0.0.1:${port}`;
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npmScript = process.env.SMOKE_NPM_SCRIPT || 'start:ssr:dev';
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 180000);
const startedAt = Date.now();
let completed = false;

const child = spawn(npmCommand, ['run', npmScript], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: port,
    PUBLIC_SITE_URL: baseUrl,
  },
  shell: process.platform === 'win32',
  detached: process.platform !== 'win32',
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});

let output = '';

child.stdout.on('data', chunk => {
  output += chunk.toString();
});

child.stderr.on('data', chunk => {
  output += chunk.toString();
});

child.on('exit', code => {
  if (!completed) {
    console.error(output);
    console.error(`Local SSR process exited before health check passed. Exit code: ${code}`);
    process.exit(code || 1);
  }
});

waitForHealth()
  .then(() => {
    completed = true;
    console.log(`Local SSR smoke check passed at ${baseUrl}/api/health.`);
    stopChild();
    process.exit(0);
  })
  .catch(error => {
    completed = true;
    stopChild();
    console.error(output);
    console.error(error.message);
    process.exit(1);
  });

async function waitForHealth() {
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/health`, {
        headers: { accept: 'application/json' },
      });

      if (response.ok) {
        const text = await response.text();
        const body = parseJsonHealthPayload(text, response);

        if (body?.ok === true && body?.runtime === 'express-bff') {
          return;
        }

        throw new Error(`Unexpected health payload: ${JSON.stringify(body)}`);
      }
    } catch (error) {
      lastError = error;
      await delay(1000);
      continue;
    }

    await delay(1000);
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error(`Timed out waiting for ${baseUrl}/api/health after ${timeoutMs}ms.`);
}

function parseJsonHealthPayload(text, response) {
  try {
    return JSON.parse(text);
  } catch (error) {
    const contentType = response.headers.get('content-type') || 'unknown';
    const preview = text.slice(0, 120).replace(/\s+/g, ' ');
    throw new Error(`Health endpoint did not return JSON. Content-Type: ${contentType}. Body: ${preview}`);
  }
}

function stopChild() {
  if (!child.pid || child.killed) {
    return;
  }

  if (process.platform === 'win32') {
    try {
      execFileSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
    } catch {
      child.kill();
    }
    return;
  }

  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    child.kill('SIGTERM');
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
