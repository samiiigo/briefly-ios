# 003 — Split portable tokens from native theme runtime

## Status

Accepted

## Context

Theme code mixed design tokens with React Native `Platform`, `ThemeProvider`, and Expo system UI APIs. Marketing and web apps need tokens/CSS variables without pulling React Native.

## Decision

`@briefly/theme` exposes:

- **Main export** — portable palettes, spacing, CSS variable helpers.
- **`@briefly/theme/native`** — ThemeProvider, StyleSheet helpers, fonts, elevation.

Apps pass theme preference into `ThemeProvider` rather than the package reading Zustand.

## Consequences

- Website/web can share brand colors safely.
- Mobile keeps native theming behavior without duplication of palettes.
