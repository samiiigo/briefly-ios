# Folder Structure

```text
briefly/
  apps/
    mobile/                 # Expo app (moved from briefly/)
      app/                  # Expo Router routes
      src/features/         # Feature-owned business logic
      src/core/             # Security, storage, bootstrap
      src/lib/              # Mobile-only utilities/hooks
      modules/              # Local Expo native modules
      assets/               # Splash, adaptive icons, Live Activity
      credentials/          # EAS submit keys (gitignored)
    web/                    # Authenticated Next.js app
    website/                # Marketing Next.js site
    backend/
      src/api|workers|services/
      supabase/             # Migrations + Edge Functions
  packages/
    api/ auth/ assets/ config/ env/ theme/ types/ ui/ utils/ validation/
  configs/
    eslint/ typescript/ prettier/
  docs/
    architecture/
  scripts/
```

See [package-conventions.md](./package-conventions.md) for when to add a new package.
