#!/usr/bin/env node
/**
 * Rewrites mobile imports to @briefly/* packages. No temporary shims.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', 'apps', 'mobile');

/** @type {Array<[RegExp, string]>} */
const REPLACEMENTS = [
  // Types
  [/from ['"]@\/shared\/types['"]/g, "from '@briefly/types'"],
  [/from ['"]@shared\/types['"]/g, "from '@briefly/types'"],
  [/from ['"]@\/shared\/types\/index['"]/g, "from '@briefly/types'"],

  // Validation (schema + inputSchemas)
  [/from ['"]@\/shared\/security\/schema['"]/g, "from '@briefly/validation'"],
  [/from ['"]@\/shared\/security\/inputSchemas['"]/g, "from '@briefly/validation'"],

  // Utils
  [/from ['"]@\/shared\/utils\/formatting\/formatting['"]/g, "from '@briefly/utils'"],
  [/from ['"]@\/shared\/utils\/formatting['"]/g, "from '@briefly/utils'"],
  [/from ['"]@\/shared\/utils\/providers\/cloudProvider['"]/g, "from '@briefly/utils'"],
  [/from ['"]@\/shared\/utils\/providers['"]/g, "from '@briefly/utils'"],
  [/from ['"]@\/shared\/utils\/list\/flattenRecordingSections['"]/g, "from '@briefly/utils'"],
  [/from ['"]@\/shared\/utils\/list['"]/g, "from '@briefly/utils'"],

  // Config constants
  [/from ['"]@\/shared\/constants\/builtInFolders['"]/g, "from '@briefly/config'"],
  [/from ['"]@\/shared\/constants\/search['"]/g, "from '@briefly/config'"],
  [/from ['"]@\/shared\/constants\/userFolders['"]/g, "from '@briefly/config'"],
  [/from ['"]@\/shared\/constants\/api\/assemblyAI['"]/g, "from '@briefly/config/api/assemblyAI'"],
  [/from ['"]@\/shared\/constants\/api\/openRouter['"]/g, "from '@briefly/config/api/openRouter'"],
  [/from ['"]@\/shared\/constants\/api\/openRouterModel['"]/g, "from '@briefly/config/api/openRouterModel'"],
  [/from ['"]@\/shared\/constants\/api\/openai['"]/g, "from '@briefly/config/api/openai'"],
  [/from ['"]@\/shared\/constants\/api\/gemini['"]/g, "from '@briefly/config/api/gemini'"],
  [/from ['"]@\/shared\/constants\/api['"]/g, "from '@briefly/config'"],
  [/from ['"]@\/shared\/constants['"]/g, "from '@briefly/config'"],

  // Theme — portable + native
  [/from ['"]@\/shared\/theme\/colorPalettes['"]/g, "from '@briefly/theme'"],
  [/from ['"]@\/shared\/theme['"]/g, "from '@briefly/theme/native'"],
  [/from ['"]@\/shared\/theme\/([^'"]+)['"]/g, "from '@briefly/theme/native'"],

  // UI components
  [/from ['"]@\/shared\/components\/ui\/CircularIconButton['"]/g, "from '@briefly/ui/native'"],
  [/from ['"]@\/shared\/components\/ui\/TextInputDialog['"]/g, "from '@briefly/ui/native'"],
  [/from ['"]@\/shared\/components\/ui\/AnchoredOverflowMenu['"]/g, "from '@briefly/ui/native'"],
  [/from ['"]@\/shared\/components\/ui['"]/g, "from '@briefly/ui/native'"],

  // Auth types
  [/from ['"]@\/features\/auth\/types\/auth\.types['"]/g, "from '@briefly/auth'"],

  // Theme preference util moved into theme/native
  [/from ['"]@\/shared\/utils\/theme\/themePreference['"]/g, "from '@briefly/theme/native'"],
];

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.expo') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx|js|jsx)$/.test(name)) acc.push(full);
  }
  return acc;
}

let changed = 0;
for (const file of walk(ROOT)) {
  // Skip files we're about to delete under shared that moved to packages
  let content = readFileSync(file, 'utf8');
  const original = content;
  for (const [re, replacement] of REPLACEMENTS) {
    content = content.replace(re, replacement);
  }
  if (content !== original) {
    writeFileSync(file, content);
    changed += 1;
  }
}
console.log(`Updated ${changed} files under apps/mobile`);
