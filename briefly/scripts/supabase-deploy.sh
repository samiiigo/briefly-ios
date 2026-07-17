#!/usr/bin/env bash
# Deploy Briefly Supabase backend (migrations + Edge Functions + secrets).
# Prerequisites:
#   - supabase login  (or SUPABASE_ACCESS_TOKEN)
#   - ASSEMBLYAI_API_KEY and OPENROUTER_SHARED_API_KEY in the environment (for secrets step)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_REF="${SUPABASE_PROJECT_REF:-vcuvfstcobxujjrvqpop}"
SB=(npx supabase)

echo "==> Linking project ${PROJECT_REF}"
"${SB[@]}" link --project-ref "$PROJECT_REF"

echo "==> Pushing database migrations"
"${SB[@]}" db push

echo "==> Deploying Edge Functions"
for fn in summarize assemblyai-stream-token transcription-upload-url transcription-create-job transcription-job-status; do
  echo "    - ${fn}"
  "${SB[@]}" functions deploy "$fn" --project-ref "$PROJECT_REF"
done

if [[ -z "${ASSEMBLYAI_API_KEY:-}" || -z "${OPENROUTER_SHARED_API_KEY:-}" ]]; then
  echo ""
  echo "WARNING: ASSEMBLYAI_API_KEY and/or OPENROUTER_SHARED_API_KEY not set."
  echo "Set them, then run:"
  echo "  npx supabase secrets set ASSEMBLYAI_API_KEY=... OPENROUTER_SHARED_API_KEY=... --project-ref ${PROJECT_REF}"
  exit 0
fi

echo "==> Setting Edge Function secrets"
"${SB[@]}" secrets set \
  "ASSEMBLYAI_API_KEY=${ASSEMBLYAI_API_KEY}" \
  "OPENROUTER_SHARED_API_KEY=${OPENROUTER_SHARED_API_KEY}" \
  --project-ref "$PROJECT_REF"

echo ""
echo "Done."
echo "Public URL: https://${PROJECT_REF}.supabase.co"
echo "Next: copy the anon/publishable key into EAS env as EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
echo "Auth: enable Apple + Google in the dashboard; redirect URL briefly://auth/callback"
