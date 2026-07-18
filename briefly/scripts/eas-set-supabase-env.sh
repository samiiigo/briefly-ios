#!/usr/bin/env bash
# Set EAS public env vars for Briefly (preview + production).
# Prerequisites: eas login, and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the environment.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_REF="${SUPABASE_PROJECT_REF:-vcuvfstcobxujjrvqpop}"
SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-https://${PROJECT_REF}.supabase.co}"

if [[ -z "${EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-}" ]]; then
  echo "Set EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to your Supabase anon/publishable key, then re-run."
  exit 1
fi

EAS=(npx eas-cli)

for ENV_NAME in preview production; do
  echo "==> Setting EAS env for ${ENV_NAME}"
  "${EAS[@]}" env:create --name EXPO_PUBLIC_SUPABASE_URL --value "$SUPABASE_URL" --environment "$ENV_NAME" --visibility plaintext --type string --force 2>/dev/null \
    || "${EAS[@]}" env:update --variable-name EXPO_PUBLIC_SUPABASE_URL --value "$SUPABASE_URL" --environment "$ENV_NAME" --non-interactive 2>/dev/null \
    || echo "Manual: eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value ${SUPABASE_URL} --environment ${ENV_NAME}"

  "${EAS[@]}" env:create --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value "$EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY" --environment "$ENV_NAME" --visibility plaintext --type string --force 2>/dev/null \
    || "${EAS[@]}" env:update --variable-name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value "$EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY" --environment "$ENV_NAME" --non-interactive 2>/dev/null \
    || echo "Manual: eas env:create --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --environment ${ENV_NAME}"
done

echo "Done. Verify with: npx eas-cli env:list"
