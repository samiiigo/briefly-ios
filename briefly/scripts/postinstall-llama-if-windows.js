#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const { patchLlamaDownloadForWindows } = require('./patch-llama-download-win');

if (process.platform !== 'win32') {
  process.exit(0);
}

patchLlamaDownloadForWindows();

const result = spawnSync(process.execPath, [path.join(__dirname, 'postinstall-llama.js')], {
  env: process.env,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
