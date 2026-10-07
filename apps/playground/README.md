# Playground

A Vite app for editing and previewing Isomer page schemas. It provides a live JSON editor alongside a rendered preview powered by `@opengovsg/isomer-components`.

## Development

From the repository root:

```bash
pnpm --filter playground dev
```

Root `pnpm dev` starts Studio only. Use the command above to run the playground.

## Build

```bash
pnpm --filter playground build
```

## Lint & format

Uses the monorepo's **oxlint** and **oxfmt** toolchain (not ESLint or Prettier):

```bash
pnpm --filter playground lint
pnpm --filter playground format
pnpm --filter playground format:fix
```

## JSON validation

The editor validates page JSON with AJV against `schema` from `@opengovsg/isomer-components` (same pattern as Studio). Use **Download schema** in the toolbar to save the current schema as `0.1.0.json`.

## Deployment

Vercel integration for this app will be wired to `apps/playground` after the move PR merges. Deployment is outside monorepo CI.
