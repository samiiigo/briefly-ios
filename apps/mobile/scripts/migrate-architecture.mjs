#!/usr/bin/env node
/**
 * One-time architecture migration helper.
 * Moves source files into feature-first layout and rewrites @/ imports.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');

/** @type {Array<[string, string]>} */
const MOVES = [
  // Shared infrastructure
  ['components/ui', 'shared/components/ui'],
  ['theme', 'shared/theme'],
  ['types', 'shared/types'],
  ['security', 'shared/security'],
  ['constants', 'shared/constants'],
  ['hooks/common', 'shared/hooks/common'],
  ['hooks/app', 'shared/hooks/app'],
  ['services/storage', 'shared/services/storage'],
  ['services/api.ts', 'shared/services/api.ts'],
  ['utils/logging', 'shared/utils/logging'],
  ['utils/formatting', 'shared/utils/formatting'],
  ['utils/platform.ts', 'shared/utils/platform.ts'],
  ['utils/platformCapabilities.ts', 'shared/utils/platformCapabilities.ts'],
  ['utils/haptics.ts', 'shared/utils/haptics.ts'],
  ['utils/prompt.ts', 'shared/utils/prompt.ts'],
  ['utils/environment', 'shared/utils/environment'],
  ['utils/binary', 'shared/utils/binary'],
  ['utils/list', 'shared/utils/list'],
  ['utils/navigation', 'shared/utils/navigation'],
  ['utils/providers', 'shared/utils/providers'],
  ['utils/fileSystem', 'shared/utils/fileSystem'],
  ['utils/transcript', 'shared/utils/transcript'],
  ['utils/summary', 'shared/utils/summary'],
  ['utils/theme', 'shared/utils/theme'],
  ['bootstrap', 'shared/bootstrap'],

  // Navigation
  ['components/navigation', 'navigation'],

  // Global store
  ['context/useActiveSwipeableStore.ts', 'store/useActiveSwipeableStore.ts'],

  // Features — recording
  ['components/features/recording', 'features/recording/components'],
  ['hooks/recording', 'features/recording/hooks'],
  ['context/useRecordingStore.ts', 'features/recording/state/useRecordingStore.ts'],
  ['context/useRecordingRetryFlashStore.ts', 'features/recording/state/useRecordingRetryFlashStore.ts'],
  ['services/recording', 'features/recording/services'],
  ['services/audio', 'features/recording/services/audio'],
  ['utils/recording', 'features/recording/utils'],

  // Features — library (includes recents)
  ['components/features/library', 'features/library/components'],
  ['components/features/recents', 'features/library/components/recents'],
  ['hooks/library', 'features/library/hooks'],
  ['context/useUserFolderStore.ts', 'features/library/state/useUserFolderStore.ts'],
  ['context/useLibraryFolderPreferencesStore.ts', 'features/library/state/useLibraryFolderPreferencesStore.ts'],
  ['context/useFolderListLayoutStore.ts', 'features/library/state/useFolderListLayoutStore.ts'],
  ['context/useFolderBrowsePreferencesStore.ts', 'features/library/state/useFolderBrowsePreferencesStore.ts'],
  ['utils/folders', 'features/library/utils'],

  // Features — search
  ['components/features/search', 'features/search/components'],
  ['hooks/search', 'features/search/hooks'],
  ['context/useSearchStore.ts', 'features/search/state/useSearchStore.ts'],
  ['utils/search', 'features/search/utils'],

  // Features — settings
  ['components/settings', 'features/settings/components'],
  ['hooks/settings', 'features/settings/hooks'],
  ['context/useSettingsStore.ts', 'features/settings/state/useSettingsStore.ts'],
  ['services/settings', 'features/settings/services'],

  // Features — processing
  ['services/transcription', 'features/processing/transcription'],
  ['services/summarization', 'features/processing/summarization'],
  ['utils/processing', 'features/processing/utils'],
];

/** @type {Array<[string, string]>} */
const IMPORT_REPLACEMENTS = [
  ['@/components/ui/', '@/shared/components/ui/'],
  ['@/theme', '@/shared/theme'],
  ['@/types', '@/shared/types'],
  ['@/security', '@/shared/security'],
  ['@/constants/', '@/shared/constants/'],
  ['@/constants', '@/shared/constants'],
  ['@/hooks/common/', '@/shared/hooks/common/'],
  ['@/hooks/common', '@/shared/hooks/common'],
  ['@/hooks/app/', '@/shared/hooks/app/'],
  ['@/hooks/app', '@/shared/hooks/app'],
  ['@/services/storage/', '@/shared/services/storage/'],
  ['@/services/storage', '@/shared/services/storage'],
  ['@/services/api', '@/shared/services/api'],
  ['@/utils/logging/', '@/shared/utils/logging/'],
  ['@/utils/formatting/', '@/shared/utils/formatting/'],
  ['@/utils/platformCapabilities', '@/shared/utils/platformCapabilities'],
  ['@/utils/platform', '@/shared/utils/platform'],
  ['@/utils/haptics', '@/shared/utils/haptics'],
  ['@/utils/prompt', '@/shared/utils/prompt'],
  ['@/utils/environment/', '@/shared/utils/environment/'],
  ['@/utils/binary/', '@/shared/utils/binary/'],
  ['@/utils/list/', '@/shared/utils/list/'],
  ['@/utils/navigation/', '@/shared/utils/navigation/'],
  ['@/utils/providers/', '@/shared/utils/providers/'],
  ['@/utils/fileSystem/', '@/shared/utils/fileSystem/'],
  ['@/utils/transcript/', '@/shared/utils/transcript/'],
  ['@/utils/summary/', '@/shared/utils/summary/'],
  ['@/utils/theme/', '@/shared/utils/theme/'],
  ['@/bootstrap/', '@/shared/bootstrap/'],
  ['@/bootstrap', '@/shared/bootstrap'],

  ['@/components/navigation/', '@/navigation/'],
  ['@/components/navigation', '@/navigation'],

  ['@/context/useActiveSwipeableStore', '@/store/useActiveSwipeableStore'],

  ['@/components/features/recording/', '@/features/recording/components/'],
  ['@/components/features/recording', '@/features/recording/components'],
  ['@/hooks/recording/', '@/features/recording/hooks/'],
  ['@/hooks/recording', '@/features/recording/hooks'],
  ['@/context/useRecordingStore', '@/features/recording/state/useRecordingStore'],
  ['@/context/useRecordingRetryFlashStore', '@/features/recording/state/useRecordingRetryFlashStore'],
  ['@/services/recording/', '@/features/recording/services/'],
  ['@/services/recording', '@/features/recording/services'],
  ['@/services/audio/', '@/features/recording/services/audio/'],
  ['@/services/audio', '@/features/recording/services/audio'],
  ['@/utils/recording/', '@/features/recording/utils/'],

  ['@/components/features/library/', '@/features/library/components/'],
  ['@/components/features/library', '@/features/library/components'],
  ['@/components/features/recents/', '@/features/library/components/recents/'],
  ['@/components/features/recents', '@/features/library/components/recents'],
  ['@/hooks/library/', '@/features/library/hooks/'],
  ['@/hooks/library', '@/features/library/hooks'],
  ['@/context/useUserFolderStore', '@/features/library/state/useUserFolderStore'],
  ['@/context/useLibraryFolderPreferencesStore', '@/features/library/state/useLibraryFolderPreferencesStore'],
  ['@/context/useFolderListLayoutStore', '@/features/library/state/useFolderListLayoutStore'],
  ['@/context/useFolderBrowsePreferencesStore', '@/features/library/state/useFolderBrowsePreferencesStore'],
  ['@/utils/folders/', '@/features/library/utils/'],

  ['@/components/features/search/', '@/features/search/components/'],
  ['@/components/features/search', '@/features/search/components'],
  ['@/hooks/search/', '@/features/search/hooks/'],
  ['@/hooks/search', '@/features/search/hooks'],
  ['@/context/useSearchStore', '@/features/search/state/useSearchStore'],
  ['@/utils/search/', '@/features/search/utils/'],

  ['@/components/settings/', '@/features/settings/components/'],
  ['@/components/settings', '@/features/settings/components'],
  ['@/hooks/settings/', '@/features/settings/hooks/'],
  ['@/hooks/settings', '@/features/settings/hooks'],
  ['@/context/useSettingsStore', '@/features/settings/state/useSettingsStore'],
  ['@/services/settings/', '@/features/settings/services/'],

  ['@/services/transcription/', '@/features/processing/transcription/'],
  ['@/services/transcription', '@/features/processing/transcription'],
  ['@/services/summarization/', '@/features/processing/summarization/'],
  ['@/services/summarization', '@/features/processing/summarization'],
  ['@/utils/processing/', '@/features/processing/utils/'],
];

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function moveEntry(fromRel, toRel) {
  const from = path.join(SRC, fromRel);
  const to = path.join(SRC, toRel);
  if (!fs.existsSync(from)) {
    console.warn(`skip missing: ${fromRel}`);
    return;
  }
  ensureParentDir(to);
  fs.renameSync(from, to);
  console.log(`moved ${fromRel} -> ${toRel}`);
}

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      walkFiles(full, acc);
    } else if (/\.(ts|tsx|js|jsx|json)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function rewriteImports() {
  const targets = [
    ...walkFiles(path.join(ROOT, 'src')),
    ...walkFiles(path.join(ROOT, 'app')),
    path.join(ROOT, 'app.config.js'),
  ];
  for (const file of targets) {
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue;
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    for (const [from, to] of IMPORT_REPLACEMENTS) {
      if (content.includes(from)) {
        content = content.split(from).join(to);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(file, content);
    }
  }
}

function cleanupEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) cleanupEmptyDirs(path.join(dir, entry.name));
  }
  if (dir === SRC) return;
  if (fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
  }
}

for (const [from, to] of MOVES) {
  moveEntry(from, to);
}

rewriteImports();
cleanupEmptyDirs(SRC);

try {
  execSync('npm run typecheck', { cwd: ROOT, stdio: 'inherit' });
} catch {
  console.warn('typecheck failed after migration — manual fixes may be needed');
}
