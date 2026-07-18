# Package Conventions

## Create only with real code

**Create a package only if it immediately contains reusable production code.**

Do not create empty packages to match an architecture diagram. Future packages (`hooks`, `store`, …) are added when a second app needs the shared code.

## Naming

Workspace packages use `@briefly/<name>`.

This is distinct from AsyncStorage key prefixes such as `@briefly/recordings`.

## Current packages

| Package               | Responsibility                                               |
| --------------------- | ------------------------------------------------------------ |
| `@briefly/types`      | Domain types                                                 |
| `@briefly/validation` | Schema engine + input validators                             |
| `@briefly/theme`      | Design tokens; `/native` for RN ThemeProvider                |
| `@briefly/env`        | Typed env parsing (no Expo imports)                          |
| `@briefly/config`     | App constants (folders, API model IDs)                       |
| `@briefly/api`        | Supabase client factory + Edge Function helpers              |
| `@briefly/auth`       | Auth types + `mapUser`                                       |
| `@briefly/assets`     | Brand icons / logos paths                                    |
| `@briefly/ui`         | Web primitives; `/native` for RN shared controls             |
| `@briefly/utils`      | Pure helpers (formatting, cloud provider meta, list flatten) |

## Rules

1. Packages must not import from `apps/*`.
2. Prefer plain TypeScript. Peer-depend on React / React Native only when required.
3. Export via `package.json` `exports` map.
4. Update imports to `@briefly/<name>` immediately when extracting — no temporary re-export shims.
5. Colocate unit tests as `*.test.ts` next to source.
