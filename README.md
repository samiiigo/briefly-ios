# Briefly

**Briefly** is a voice recorder with built-in AI transcription and summarization. This repository is a **pnpm + Turborepo monorepo** containing the Expo mobile app, authenticated web app, marketing website, shared packages, and Supabase backend.

## Apps

| App     | Path           | Description                         |
| ------- | -------------- | ----------------------------------- |
| Mobile  | `apps/mobile`  | Expo / React Native (iOS + Android) |
| Web     | `apps/web`     | Authenticated Next.js product app   |
| Website | `apps/website` | Marketing / docs / SEO (Next.js)    |
| Backend | `apps/backend` | Supabase + future API/workers       |

## Quick start

```bash
pnpm install
pnpm dev:mobile      # Expo dev client
pnpm dev:web         # http://localhost:3000
pnpm dev:website     # http://localhost:3001
```

Mobile requires a **custom dev client** (not Expo Go). See [docs/development.md](docs/development.md).

```bash
cp apps/mobile/.env.example apps/mobile/.env
# set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

## Workspace commands

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Documentation

- [Architecture](docs/architecture.md)
- [Folder structure](docs/folder-structure.md)
- [Feature conventions](docs/feature-conventions.md)
- [Package conventions](docs/package-conventions.md)
- [Development](docs/development.md)
- [Deployment](docs/deployment.md)
- [Migration summary](docs/migration-summary.md)
- [Phase 2 — Product surfaces](docs/phase-2.md)
- [ADRs](docs/architecture/decisions.md)

## License

See [LICENSE](LICENSE).
