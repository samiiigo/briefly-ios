# Feature Conventions

Features live **inside apps**, never in shared packages.

## Structure

```text
src/features/<feature>/
  components/
  hooks/
  services/
  state/          # Zustand stores when needed
  utils/
  types/          # Feature-local types only
  index.ts        # Public exports for the feature
```

## Rules

1. A feature owns its UI, hooks, services, and local state.
2. Cross-feature imports should go through the feature `index.ts` or shared packages — avoid deep coupling.
3. Network calls go through `apps/*/src/api` or `@briefly/api`, not inside presentational components.
4. Validation of user input uses `@briefly/validation` for shared rules; feature-specific rules stay local.
5. Do not invent a giant `shared/features` folder. If two apps need the same screen, extract a capability package or duplicate intentionally until a real abstraction appears.
