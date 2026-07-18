# 001 — Adopt a pnpm + Turborepo monorepo

## Status

Accepted

## Context

Briefly started as a single Expo app under `briefly/`. Product direction now includes authenticated web, a marketing site, shared design system, and a growing Supabase backend. A second major restructure later would be costly.

## Decision

Evolve the repository into a monorepo with `apps/*` and `packages/*`, orchestrated by Turborepo, without rewriting working mobile features.

## Consequences

- Clear ownership boundaries between mobile, web, website, and backend.
- Shared packages only when code is immediately reusable.
- Slightly more tooling complexity (Metro monorepo config, pnpm hoist rules for Expo).
