# Briefly release checklist

Project: Supabase `vcuvfstcobxujjrvqpop` · EAS `a76ad650-f9a8-479c-ad81-a666f586a7dc`

## 1. Supabase backend

From `briefly/` (after `supabase login` + `supabase link --project-ref vcuvfstcobxujjrvqpop`):

```bash
export ASSEMBLYAI_API_KEY=...
export OPENROUTER_SHARED_API_KEY=...
chmod +x scripts/supabase-deploy.sh
./scripts/supabase-deploy.sh
```

Or step-by-step:

```bash
npx supabase db push
npx supabase functions deploy summarize --project-ref vcuvfstcobxujjrvqpop
npx supabase functions deploy assemblyai-stream-token --project-ref vcuvfstcobxujjrvqpop
npx supabase functions deploy transcription-upload-url --project-ref vcuvfstcobxujjrvqpop
npx supabase functions deploy transcription-create-job --project-ref vcuvfstcobxujjrvqpop
npx supabase functions deploy transcription-job-status --project-ref vcuvfstcobxujjrvqpop
npx supabase secrets set \
  ASSEMBLYAI_API_KEY="$ASSEMBLYAI_API_KEY" \
  OPENROUTER_SHARED_API_KEY="$OPENROUTER_SHARED_API_KEY" \
  --project-ref vcuvfstcobxujjrvqpop
```

## 2. Auth providers (dashboard)

In [Authentication → URL configuration](https://supabase.com/dashboard/project/vcuvfstcobxujjrvqpop/auth/url-configuration):

- Site URL: `briefly://auth/callback`
- Redirect URLs: `briefly://auth/callback`

In [Authentication → Providers](https://supabase.com/dashboard/project/vcuvfstcobxujjrvqpop/auth/providers):

- **Apple** — enable; use Services ID / key from Apple Developer
- **Google** — enable; use OAuth client ID/secret from Google Cloud Console

App deep link is already `briefly://auth/callback` (`authService.ts`).

## 3. EAS public env

```bash
export EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon key from Project Settings → API>
chmod +x scripts/eas-set-supabase-env.sh
./scripts/eas-set-supabase-env.sh
```

Sets:

- `EXPO_PUBLIC_SUPABASE_URL` = `https://vcuvfstcobxujjrvqpop.supabase.co`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

For local:

```bash
cp .env.example .env
# fill both EXPO_PUBLIC_* values
```

## 4. Store assets

Production icon / splash / adaptive icons live under `assets/` (no design-guide overlays).

## 5. Store submit credentials (`eas.json`)

Fill `submit.production` with real Apple / Play values, or place ASC API key + Play service account under `credentials/` (gitignored) and point paths in `eas.json`.

## 6. Optional crash reporting

Set `EXPO_PUBLIC_SENTRY_DSN` (EAS + local `.env`) to enable Sentry via `src/shared/services/crashReporter.ts`. Without it, reporting stays a no-op in production.
