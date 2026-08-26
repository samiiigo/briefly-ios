# Features

Domain modules for the Briefly web app. Each feature owns its UI, hooks, and cloud sync logic.

## `auth/`

Supabase session handling (`AuthProvider`, `SignInForm`, `useAuth`).

## `library/`

Cloud-primary library synced from `account_recordings` and `account_folders`:

- `LibraryProvider` — recordings, folders, counts, mutations
- `api/accountLibraryApi.ts` — Supabase pull/push helpers
- `components/` — folder grid, recording list, detail views
- `utils/` — folder resolution, counts, filters (ported from mobile)

## `search/`

Indexed search over library data with debounced query and recent searches in `localStorage`.

## `settings/`

Account settings synced via `account_settings` (`SettingsProvider`, `SettingsForm`). Web exposes cloud summarization/transcription modes only.

## `dashboard/`

Home dashboard with library stats and recent recordings.

## `account/`

Profile, sync status, and manual library refresh.
