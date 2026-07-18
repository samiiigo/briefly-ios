#!/usr/bin/env bash
# Deploy Briefly Supabase backend (migrations + Edge Functions + secrets).
#
# Prerequisites:
#   - Migrations: SUPABASE_DB_PASSWORD (project database password)
#   - Functions/secrets: supabase login  OR  SUPABASE_ACCESS_TOKEN=sbp_...
#   - Secrets values: ASSEMBLYAI_API_KEY, OPENROUTER_SHARED_API_KEY
#
# Project is in ca-central-1; direct DB host is IPv6-only, so we use the
# IPv4 transaction pooler for db push when SUPABASE_DB_PASSWORD is set.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_REF="${SUPABASE_PROJECT_REF:-vcuvfstcobxujjrvqpop}"
POOL_REGION="${SUPABASE_POOL_REGION:-ca-central-1}"
SB=(npx supabase)

python_urlencode() {
  python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "$1"
}

echo "==> Pushing database migrations"
if [[ -n "${SUPABASE_DB_URL:-}" ]]; then
  "${SB[@]}" db push --db-url "$SUPABASE_DB_URL" --yes
elif [[ -n "${SUPABASE_DB_PASSWORD:-}" ]]; then
  ENC="$(python_urlencode "$SUPABASE_DB_PASSWORD")"
  DB_URL="postgresql://postgres.${PROJECT_REF}:${ENC}@aws-0-${POOL_REGION}.pooler.supabase.com:6543/postgres"
  "${SB[@]}" db push --db-url "$DB_URL" --yes
else
  "${SB[@]}" link --project-ref "$PROJECT_REF"
  "${SB[@]}" db push --yes
fi

echo "==> Deploying Edge Functions (requires SUPABASE_ACCESS_TOKEN / supabase login)"
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
echo "Next: set EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in EAS (npm run eas:env:supabase)"
echo "Auth: enable Apple + Google; redirect briefly://auth/callback"
