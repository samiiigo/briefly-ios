#!/usr/bin/env node
/**
 * Cross-platform test runner.
 * Expands nested *.test.ts files under src without relying on shell globs
 * or Node 22+ node --test glob support.
 */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function findTestFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const fullPath = join(dir, name);
    if (statSync(fullPath).isDirectory()) {
      findTestFiles(fullPath, acc);
    } else if (name.endsWith('.test.ts')) {
      acc.push(fullPath);
    }
  }
  return acc;
}

const files = findTestFiles('src').sort();
if (files.length === 0) {
  console.error('No test files found under src/');
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ['--import', 'tsx', '--test', ...files],
  { stdio: 'inherit' },
);

process.exit(result.status ?? 1);
