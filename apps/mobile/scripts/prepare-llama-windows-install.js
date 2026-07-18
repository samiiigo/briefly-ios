#!/usr/bin/env node
'use strict';

/**
 * Windows: patch llama.rn on disk (when present) and refresh .npmrc with a
 * Node-resolved absolute path. Git Bash ${PWD} is /d/... and breaks when npm
 * runs install scripts under cmd.exe; path.resolve works from bash and cmd.
 */
const fs = require('fs');
const path = require('path');
const { patchLlamaDownloadForWindows } = require('./patch-llama-download-win');

const projectRoot = path.join(__dirname, '..');
const npmrcPath = path.join(projectRoot, '.npmrc');
const marker = '# llama.rn windows install (generated — do not edit)';
const envModulePath = path.resolve(__dirname, 'llama-install-env.cjs').replace(/\\/g, '/');
const generatedLine = `node-options=--require=${envModulePath}`;

function readNpmrc() {
  if (!fs.existsSync(npmrcPath)) return '';
  return fs.readFileSync(npmrcPath, 'utf8');
}

function stripGenerated(content) {
  const lines = content.split(/\r?\n/);
  const out = [];
  let skipping = false;

  for (const line of lines) {
    if (line.trim() === marker) {
      skipping = true;
      continue;
    }
    if (skipping) {
      if (line.startsWith('node-options=')) continue;
      skipping = false;
    }
    out.push(line);
  }

  return out.join('\n').replace(/\n+$/, '');
}

function writeNpmrc(content) {
  const body = content.length > 0 ? `${content}\n\n` : '';
  fs.writeFileSync(npmrcPath, `${body}${marker}\n${generatedLine}\n`, 'utf8');
}

if (process.platform !== 'win32') {
  const stripped = stripGenerated(readNpmrc());
  fs.writeFileSync(npmrcPath, stripped.length > 0 ? `${stripped}\n` : '', 'utf8');
  process.exit(0);
}

writeNpmrc(stripGenerated(readNpmrc()));
patchLlamaDownloadForWindows();
