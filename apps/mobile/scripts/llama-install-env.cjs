'use strict';

/**
 * Preloaded via .npmrc `node-options` during npm install on Windows.
 * Skips only llama.rn's upstream download hook (GNU tar breaks on C:\ paths in Git Bash).
 */
const main = (process.argv[1] || '').replace(/\\/g, '/');
const isUpstreamLlamaInstall = main.includes('llama.rn/install/download-native-artifacts');

if (process.platform === 'win32' && isUpstreamLlamaInstall) {
  process.env.RNLLAMA_SKIP_POSTINSTALL = '1';
}
