#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const llamaPatchMarker = '// briefly: windows deferred download';
const llamaDownloadScript = path.join(
  __dirname,
  '..',
  'node_modules',
  'llama.rn',
  'install',
  'download-native-artifacts.js',
);

function patchLlamaDownloadForWindows() {
  if (process.platform !== 'win32' || !fs.existsSync(llamaDownloadScript)) return false;

  let src = fs.readFileSync(llamaDownloadScript, 'utf8');
  if (src.includes(llamaPatchMarker)) return true;

  const guard = [
    '  if (process.platform === "win32" && process.env.RNLLAMA_SKIP_POSTINSTALL !== "0") {',
    '    console.log("llama.rn: deferring Windows download to briefly postinstall");',
    '    return;',
    '  }',
    `  ${llamaPatchMarker}`,
  ].join('\n');

  if (!src.includes('async function main() {')) {
    console.warn('briefly: could not patch llama.rn download script (unexpected format)');
    return false;
  }

  src = src.replace('async function main() {', `async function main() {\n${guard}\n`);
  fs.writeFileSync(llamaDownloadScript, src, 'utf8');
  return true;
}

module.exports = { patchLlamaDownloadForWindows };

if (require.main === module) {
  patchLlamaDownloadForWindows();
}
