#!/usr/bin/env node
/**
 * Downloads llama.rn native artifacts with a Windows-safe tar invocation.
 *
 * Git Bash / MSYS GNU tar treats paths like `C:\Users\...` as host "C:" and fails
 * with "Cannot connect to C: resolve failed". Prefer Windows built-in tar.exe.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const llamaScript = path.join(
  __dirname,
  '..',
  'node_modules',
  'llama.rn',
  'install',
  'download-native-artifacts.js',
);

if (!fs.existsSync(llamaScript)) {
  console.error('llama.rn is not installed; run npm install first.');
  process.exit(1);
}

function envForLlamaDownload() {
  const env = { ...process.env };
  delete env.RNLLAMA_SKIP_POSTINSTALL;

  if (typeof env.NODE_OPTIONS === 'string') {
    const cleaned = env.NODE_OPTIONS.split(/\s+/).filter(
      (opt) => !/--require=.*llama-install-env\.cjs/.test(opt),
    );
    if (cleaned.length > 0) env.NODE_OPTIONS = cleaned.join(' ');
    else delete env.NODE_OPTIONS;
  }

  return env;
}

const env = envForLlamaDownload();

if (process.platform === 'win32') {
  const systemRoot = process.env.SystemRoot || 'C:\\Windows';
  const systemTar = path.join(systemRoot, 'System32', 'tar.exe');
  if (fs.existsSync(systemTar)) {
    const system32 = path.join(systemRoot, 'System32');
    env.PATH = `${system32};${env.PATH}`;
  } else {
    console.warn(
      'llama.rn: Windows tar.exe not found; if extraction fails, use WSL or EAS Build.',
    );
  }
}

const result = spawnSync(process.execPath, [llamaScript, ...process.argv.slice(2)], {
  env,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});

if (result.status !== 0) {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
}

process.exit(result.status ?? 1);
