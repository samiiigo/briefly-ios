# 002 — Use pnpm workspaces

## Status

Accepted

## Context

The Expo app used npm (`package-lock.json`). Monorepo installs with npm workspaces are weaker for strict dependency isolation and disk efficiency than pnpm.

## Decision

Standardize on **pnpm workspaces** with Expo-friendly `.npmrc` hoist patterns (`public-hoist-pattern` for Expo/RN, `node-linker=hoisted` for Metro compatibility).

## Consequences

- Single `pnpm-lock.yaml` at the root.
- CI uses `pnpm install --frozen-lockfile`.
- Windows llama postinstall scripts remain under `apps/mobile` and continue to run via pnpm lifecycle hooks.
